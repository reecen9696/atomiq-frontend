import type { AtomikConfig, ApiConfig } from "../env";
import { getApiConfig } from "../env";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Token {
  symbol: string;
  mint_address?: string | null;
}

export interface CoinflipRequest {
  player_id: string;
  choice: "heads" | "tails";
  token: Token;
  bet_amount: number;
  allowance_nonce: number; // Required from PlaySession for PDA derivation
  wallet_signature?: string; // Optional - not used (Solana program validates via PDA)
  timestamp?: number; // Optional timestamp
}

export type CoinflipResult =
  | {
      status: "complete";
      game_id: string;
      result: GameResult;
    }
  | {
      status: "pending";
      game_id: string;
      message?: string | null;
    };

export interface GameResult {
  game_id: string;
  game_type: string;
  player: {
    player_id: string;
    wallet_signature?: string | null;
  };
  payment: {
    token: Token;
    bet_amount: number;
    payout_amount: number;
    settlement_tx_id?: string | null;
  };
  vrf: {
    vrf_output: string;
    vrf_proof: string;
    public_key: string;
    input_message: string;
  };
  outcome: string;
  timestamp: number;
  game_type_data: string;
  player_choice?: string;
  result_choice?: string;
  metadata?: unknown;
}

export interface Settlement {
  settlementId: string;
  status: "pending" | "processing" | "completed" | "failed";
  gameId: string;
  amount: number;
  createdAt: string;
  processedAt?: string;
}

export interface RecentGame {
  gameId: string;
  gameType: string;
  outcome: string;
  amount: number;
  won: boolean;
  timestamp: string;
  playerPubkey: string;
}

export interface PaginatedGames {
  games: RecentGame[];
  cursor?: string;
  hasMore: boolean;
}

/**
 * Enhanced API client with retry logic and proper error handling
 */
export class AtomikApiClient {
  private apiConfig: ApiConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: AtomikConfig) {
    this.apiConfig = getApiConfig(config);
    this.baseHeaders = {
      "Content-Type": "application/json",
    };

    if (this.apiConfig.apiKey) {
      this.baseHeaders["Authorization"] = `Bearer ${this.apiConfig.apiKey}`;
    }
  }

  /**
   * Make a request with automatic retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1,
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.apiConfig.timeout,
      );

      const response = await fetch(`${this.apiConfig.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...this.baseHeaders, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Empty response`);
        }
        return {
          success: true,
          data: null as T,
        };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}`,
        );
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      const isLastAttempt = attempt >= this.apiConfig.retryAttempts;

      if (!isLastAttempt && !(error as Error)?.name?.includes("AbortError")) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
        return this.request<T>(endpoint, options, attempt + 1);
      }

      return {
        success: false,
        error: (error as Error)?.message || "Request failed",
      };
    }
  }

  /**
   * Play a coinflip game - using test-ui endpoint
   */
  async playCoinflip(
    request: CoinflipRequest,
  ): Promise<ApiResponse<CoinflipResult>> {
    return this.request<CoinflipResult>("/api/coinflip/play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  /**
   * Get game result by ID - using test-ui endpoint
   */
  async getGameResult(gameId: string): Promise<ApiResponse<CoinflipResult>> {
    return this.request<CoinflipResult>(
      `/api/game/${encodeURIComponent(gameId)}`,
    );
  }

  /**
   * Get pending settlements for a user
   */
  async getPendingSettlements(
    userPubkey: string,
  ): Promise<ApiResponse<Settlement[]>> {
    return this.request<Settlement[]>(`/api/settlements/pending/${userPubkey}`);
  }

  /**
   * Get settlement details
   */
  async getSettlement(settlementId: string): Promise<ApiResponse<Settlement>> {
    return this.request<Settlement>(`/api/settlements/${settlementId}`);
  }

  /**
   * Get recent games with pagination
   */
  async getRecentGames(cursor?: string): Promise<ApiResponse<PaginatedGames>> {
    const params = cursor ? `?cursor=${cursor}` : "";
    return this.request<PaginatedGames>(`/api/games/recent${params}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/health");
  }

  /**
   * Get WebSocket URL for real-time updates
   */
  getWebSocketUrl(): string {
    return this.apiConfig.baseUrl.replace(/^http/, "ws");
  }
}

/**
 * Factory function to create an API client from config
 */
export function createApiClient(config: AtomikConfig): AtomikApiClient {
  return new AtomikApiClient(config);
}
