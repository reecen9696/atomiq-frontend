import { config } from "@/config";
import type { Winner, StatCard, ApiResponse, PaginatedResponse } from "@/types";
import type { Block } from "@/mocks/blocks";
import { ErrorFactory, AppError, retryWithBackoff } from "@/lib/error-handling";
import {
  formatSOLWithSymbol,
  formatNumber,
  formatPercentage,
  formatHash,
} from "@/lib/utils";

/**
 * Enhanced API Client
 * Provides type-safe, error-handled API communication
 */

/**
 * Base fetch wrapper with enhanced error handling and retries
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number; retries?: number },
): Promise<T> {
  const {
    timeout = config.api.timeout,
    retries = 0,
    ...fetchOptions
  } = options || {};
  const url = `${config.api.baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const makeRequest = async (): Promise<T> => {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle different error status codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        switch (response.status) {
          case 400:
            throw ErrorFactory.validation(
              errorData?.message || "Invalid request",
              { status: response.status, endpoint, data: errorData },
            );
          case 401:
            throw ErrorFactory.auth("Authentication required", {
              status: response.status,
              endpoint,
            });
          case 404:
            throw ErrorFactory.notFound(endpoint, {
              status: response.status,
              endpoint,
            });
          case 500:
            throw ErrorFactory.server("Internal server error", {
              status: response.status,
              endpoint,
            });
          default:
            throw ErrorFactory.network(
              `HTTP ${response.status}: ${response.statusText}`,
              { status: response.status, endpoint, data: errorData },
            );
        }
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }

      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AppError) {
        throw error;
      }

      if ((error as Error).name === "AbortError") {
        throw ErrorFactory.timeout("Request timed out", { timeout, endpoint });
      }

      throw ErrorFactory.network(
        error instanceof Error ? error.message : "Network request failed",
        { endpoint, originalError: error },
      );
    }
  };

  if (retries > 0) {
    return retryWithBackoff(makeRequest, retries, 1000, { endpoint });
  }

  return makeRequest();
}

/**
 * API Service Layer
 * All backend API calls with consistent error handling
 */
export const api = {
  // Health check
  health: {
    /**
     * Check API health status
     * GET /health
     */
    check: async (): Promise<{ status: string; timestamp: string }> => {
      if (config.features.enableMockData) {
        return { status: "healthy", timestamp: new Date().toISOString() };
      }
      return fetchApi("/health");
    },
  },

  // Winners
  winners: {
    /**
     * Fetch recent winners with pagination
     * GET /api/winners/recent
     */
    getRecent: async (
      limit: number = config.pagination.limits.winners,
      offset: number = 0,
    ): Promise<PaginatedResponse<Winner>> => {
      if (config.features.enableMockData) {
        const { mockWinners } = await import("@/mocks");
        return {
          data: mockWinners.slice(offset, offset + limit),
          total: mockWinners.length,
          page: Math.floor(offset / limit) + 1,
          limit,
          hasNext: offset + limit < mockWinners.length,
          hasPrevious: offset > 0,
        };
      }

      const gamesResponse = await fetchApi<{
        games: any[];
        next_cursor?: string;
      }>(
        `/api/games/recent?limit=${limit * 2}`, // Fetch more to ensure we get enough wins
        { retries: 2 },
      );

      // Log raw games response for debugging
      console.log("🎰 Raw games response:", gamesResponse.games.slice(0, 5));

      // Transform games to winners format, filtering only wins
      const winners = gamesResponse.games
        .filter((game: any) => game.outcome === "win")
        .slice(0, limit) // Take only the requested limit after filtering
        .map((game: any) => {
          // Map game types to proper display names
          let gameName = game.game_type;
          let gameImage = "/games/coinflip.png";

          switch (game.game_type?.toLowerCase()) {
            case "coinflip":
              gameName = "Coin Flip";
              gameImage = "/games/coinflip.png";
              break;
            case "dice":
              gameName = "Dice";
              gameImage = "/games/dice.png";
              break;
            case "plinko":
              gameName = "Plinko";
              gameImage = "/games/plinko.png";
              break;
            case "slot":
              gameName = "Slots";
              gameImage = "/games/slot.png";
              break;
            default:
              gameName = game.game_type || "Unknown";
          }

          return {
            id: game.game_id || game.tx_id.toString(),
            gameName,
            gameImage,
            amount: formatSOLWithSymbol((game.payout || 0) / 1_000_000_000, 4),
            timestamp: new Date(game.timestamp).toISOString(),
          };
        });

      console.log("🎰 Transformed winners:", winners.slice(0, 3));

      return {
        data: winners,
        total: winners.length,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasNext: gamesResponse.next_cursor !== undefined,
        hasPrevious: offset > 0,
      };
    },
  },

  // Stats
  stats: {
    /**
     * Fetch current statistics
     * GET /api/stats
     */
    getCurrent: async (): Promise<ApiResponse<StatCard[]>> => {
      if (config.features.enableMockData) {
        const { mockStatCards } = await import("@/mocks");
        return {
          data: mockStatCards,
          success: true,
          message: "Stats retrieved successfully",
        };
      }

      const casinoStats = await fetchApi<{
        total_wagered: number;
        gross_rtp: number;
        bet_count: number;
        bankroll: number;
        wins_24h: number;
        wagered_24h: number;
      }>("/api/casino/stats", { retries: 3 });

      // Transform casino stats to StatCard format
      const statCards: StatCard[] = [
        {
          id: "sol-wagered",
          title: "SOL WAGERED",
          value: `$${casinoStats.total_wagered.toFixed(1)}M`,
          icon: "💰",
        },
        {
          id: "bankroll",
          title: "BANKROLL",
          value: `${casinoStats.bankroll.toFixed(1)}M`,
          icon: "💳",
        },
        {
          id: "gross-rtp",
          title: "GROSS RTP",
          value: formatPercentage(casinoStats.gross_rtp, 1),
          icon: "📊",
        },
        {
          id: "total-bets",
          title: "BETS",
          value: formatNumber(casinoStats.bet_count),
          icon: "🎯",
        },
      ];

      return {
        data: statCards,
        success: true,
        message: "Stats retrieved successfully",
      };
    },
  },

  // Blocks
  blocks: {
    /**
     * Fetch recent blocks
     * GET /blocks
     */
    getRecent: async (
      limit: number = config.pagination.limits.blocks,
    ): Promise<ApiResponse<Block[]>> => {
      if (config.features.enableMockData) {
        const { mockBlocks } = await import("@/mocks");
        return {
          data: mockBlocks.slice(0, limit),
          success: true,
          message: "Blocks retrieved successfully",
        };
      }

      const response = await fetchApi<{ blocks: any[]; pagination: any }>(
        `/blocks?limit=${limit}`,
        { retries: 2 },
      );

      // Transform API response to Block format
      const blocks = response.blocks.map((block: any) => ({
        id: block.height.toString(),
        blockNumber: block.height,
        hash: formatHash(block.hash), // Format as [8]....[8]
        transactionCount: block.tx_count,
        timestamp: new Date(block.time).toLocaleTimeString(),
      }));

      return {
        data: blocks,
        success: true,
        message: "Blocks retrieved successfully",
      };
    },

    /**
     * Fetch block by number
     * GET /api/blocks/:blockNumber
     */
    getByNumber: async (blockNumber: number): Promise<ApiResponse<Block>> => {
      if (config.features.enableMockData) {
        const { mockBlocks } = await import("@/mocks");
        const block = mockBlocks.find((b) => b.blockNumber === blockNumber);

        if (!block) {
          throw ErrorFactory.notFound(`Block ${blockNumber}`);
        }

        return {
          data: block,
          success: true,
          message: "Block retrieved successfully",
        };
      }

      return fetchApi<ApiResponse<Block>>(`/api/blocks/${blockNumber}`);
    },
  },

  // Games
  games: {
    /**
     * Fetch all games
     * GET /api/games
     */
    getAll: async (limit?: number) => {
      if (config.features.enableMockData) {
        const { mockGames } = await import("@/mocks");
        const games = limit ? mockGames.slice(0, limit) : mockGames;
        return {
          data: games,
          success: true,
          message: "Games retrieved successfully",
        };
      }

      const params = limit ? `?limit=${limit}` : "";
      return fetchApi(`/api/games${params}`);
    },

    /**
     * Fetch game by ID
     * GET /api/games/:id
     */
    getById: async (id: string) => {
      if (config.features.enableMockData) {
        const { mockGames } = await import("@/mocks");
        const game = mockGames.find((g) => g.id === id);

        if (!game) {
          throw ErrorFactory.notFound(`Game ${id}`);
        }

        return {
          data: game,
          success: true,
          message: "Game retrieved successfully",
        };
      }

      return fetchApi(`/api/games/${id}`);
    },
  },
};

// Enhanced type exports
export type { Winner, StatCard, Block, ApiResponse, PaginatedResponse };
export { AppError, ErrorFactory };
