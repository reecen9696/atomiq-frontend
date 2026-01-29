import { config } from "@/config";
import type { Winner, StatCard, ApiResponse, PaginatedResponse } from "@/types";
import type { Block } from "@/mocks/blocks";
import { ErrorFactory, AppError, retryWithBackoff } from "@/lib/error-handling";

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

      return fetchApi<PaginatedResponse<Winner>>(
        `/api/winners/recent?limit=${limit}&offset=${offset}`,
        { retries: 2 },
      );
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

      return fetchApi<ApiResponse<StatCard[]>>("/api/stats", { retries: 3 });
    },
  },

  // Blocks
  blocks: {
    /**
     * Fetch recent blocks
     * GET /api/blocks/recent
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

      return fetchApi<ApiResponse<Block[]>>(
        `/api/blocks/recent?limit=${limit}`,
        { retries: 2 },
      );
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
