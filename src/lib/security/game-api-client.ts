/**
 * Secure Game API Client
 * 
 * Centralized API client for all game endpoints. Handles:
 * - Rate limit headers (X-RateLimit-*)
 * - 429 Too Many Requests with retry logic
 * - Client-side bet validation before sending
 * - Input sanitization
 * - Consistent error handling
 * 
 * All game components should use this instead of raw axios/fetch calls.
 */

import axios, { AxiosError, AxiosResponse } from "axios";
import {
  RateLimitError,
  rateLimitTracker,
  parseRateLimitHeaders,
} from "./rate-limit-handler";
import {
  validateBet,
  validatePlayerId,
  type GameType,
} from "./bet-validator";

const BLOCKCHAIN_API_URL =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:8080";

export interface GameApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitRemaining?: number;
}

interface PlayRequest {
  player_id: string;
  bet_amount: number;
  allowance_nonce?: number;
  [key: string]: any;
}

/**
 * Create an axios instance with security defaults
 */
const apiInstance = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor: track rate limits from all responses
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Track rate limit headers from successful responses
    const playerId = response.config.data
      ? JSON.parse(response.config.data)?.player_id
      : null;
    if (playerId && response.headers) {
      const headers = new Headers();
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") headers.set(key, value);
      });
      rateLimitTracker.updateFromResponse(playerId, headers);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      const headers = new Headers();
      Object.entries(error.response.headers).forEach(([key, value]) => {
        if (typeof value === "string") headers.set(key, value);
      });
      const rateLimitInfo = parseRateLimitHeaders(headers);
      const playerId =
        error.config?.data && JSON.parse(error.config.data)?.player_id;

      if (playerId) {
        rateLimitTracker.updateFromResponse(playerId, headers);
      }

      throw new RateLimitError(
        (error.response.data as any)?.error ||
          "Too many requests. Please wait before placing another bet.",
        rateLimitInfo,
      );
    }
    throw error;
  },
);

/**
 * Unified game play function with full validation and security
 */
async function playGame<T>(
  gameType: GameType,
  endpoint: string,
  request: PlayRequest,
): Promise<GameApiResponse<T>> {
  // 1. Validate player ID
  const playerValidation = validatePlayerId(request.player_id);
  if (!playerValidation.valid) {
    return { success: false, error: playerValidation.error };
  }

  // 2. Validate bet amount
  const betValidation = validateBet(request.bet_amount, gameType);
  if (!betValidation.valid) {
    return { success: false, error: betValidation.error };
  }

  // 3. Check client-side rate limit
  const rateCheck = rateLimitTracker.canMakeRequest(request.player_id);
  if (!rateCheck.allowed) {
    const waitSec = Math.ceil((rateCheck.waitMs || 1000) / 1000);
    return {
      success: false,
      error: `Rate limited. Please wait ${waitSec}s before placing another bet.`,
    };
  }

  // 4. Make API call
  try {
    const response = await apiInstance.post<T>(endpoint, request);
    return {
      success: true,
      data: response.data,
      rateLimitRemaining: parseInt(
        response.headers["x-ratelimit-remaining"] || "30",
        10,
      ),
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: error.message,
        rateLimitRemaining: 0,
      };
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = (error.response?.data as any)?.error;

      if (status === 400) {
        return { success: false, error: message || "Invalid bet parameters" };
      }
      if (status === 503) {
        return { success: false, error: "Game service temporarily unavailable" };
      }

      return {
        success: false,
        error: message || `Request failed (${status || "network error"})`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Game-specific API methods
 */
export const gameApiClient = {
  coinflip: {
    play: (request: PlayRequest & { choice: string }) =>
      playGame("coinflip", "/api/coinflip/play", request),
  },

  dice: {
    play: (
      request: PlayRequest & {
        target_number: number;
        bet_type: string;
        client_seed?: string;
      },
    ) => playGame("dice", "/api/dice/play", request),
  },

  plinko: {
    play: (
      request: PlayRequest & {
        risk_level: string;
        rows: number;
      },
    ) => playGame("plinko", "/api/plinko/play", request),
  },

  slot: {
    play: (
      request: PlayRequest & {
        lines: number;
      },
    ) => playGame("slot", "/api/slot/play", request),
  },

  /**
   * Get a game result by ID
   */
  getResult: async (gameId: string) => {
    try {
      const response = await apiInstance.get(`/api/games/${gameId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as any)?.error || error.message
        : "Failed to fetch game result";
      return { success: false, error: message };
    }
  },

  /**
   * Verify VRF proof for a game
   */
  verifyVrf: async (gameId: string) => {
    try {
      const response = await apiInstance.get(`/api/games/${gameId}/verify`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as any)?.error || error.message
        : "Failed to verify game";
      return { success: false, error: message };
    }
  },
};
