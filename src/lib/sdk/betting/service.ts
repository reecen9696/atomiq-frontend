import type { AtomikConfig } from "../env";
import type {
  AtomikApiClient,
  CoinflipResult,
  Settlement,
} from "../api/client";
import { createAllowanceService } from "../allowance/service";
import { solanaService } from "@/services/solana";
import { logger } from "@/lib/logger";

export interface BettingOperations {
  // Betting operations
  placeCoinflipBet(params: {
    choice: "heads" | "tails";
    amount: number;
    playSession: { nonce: number; allowancePda: string };
    userPublicKey: string;
  }): Promise<CoinflipResult>;

  // Game result checking
  getGameResult(gameId: string): Promise<CoinflipResult | null>;

  // Settlement checking
  getPendingSettlements(userPublicKey: string): Promise<Settlement[]>;
  getSettlement(settlementId: string): Promise<Settlement | null>;

  // Polling utilities
  waitForGameSettlement(
    gameId: string,
    timeoutMs?: number,
  ): Promise<CoinflipResult>;
}

/**
 * Service for casino betting operations
 * Handles coinflip games and result checking
 */
export class AtomikBettingService implements BettingOperations {
  private config: AtomikConfig;
  private apiClient: AtomikApiClient;
  private allowanceService = createAllowanceService(
    solanaService.getConnection(),
  );

  constructor(config: AtomikConfig, apiClient: AtomikApiClient) {
    this.config = config;
    this.apiClient = apiClient;
  }

  /**
   * Place a coinflip bet
   * Uses allowance nonce from PlaySession for authorization
   */
  async placeCoinflipBet(params: {
    choice: "heads" | "tails";
    amount: number;
    playSession: { nonce: number; allowancePda: string };
    userPublicKey: string;
  }) {
    const { choice, amount, playSession, userPublicKey } = params;

    logger.info("Placing coinflip bet", {
      player: userPublicKey.substring(0, 8),
      nonce: playSession.nonce,
      amount,
    });

    // Make API call with nonce only - signature verification happens on Solana
    const response = await this.apiClient.playCoinflip({
      player_id: userPublicKey,
      choice,
      token: {
        symbol: "SOL",
        mint_address: null,
      },
      bet_amount: amount,
      allowance_nonce: playSession.nonce,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to place coinflip bet");
    }

    logger.info("Bet placed successfully", {
      gameId: response.data.game_id,
      status: response.data.status,
    });

    return response.data;
  }

  /**
   * Get game result by ID
   */
  async getGameResult(gameId: string): Promise<CoinflipResult | null> {
    const response = await this.apiClient.getGameResult(gameId);

    if (!response.success) {
      if (response.error?.includes("not found")) {
        return null;
      }
      throw new Error(response.error || "Failed to get game result");
    }

    return response.data || null;
  }

  /**
   * Get recent games for a user
   */
  async getRecentGames(cursor?: string) {
    const response = await this.apiClient.getRecentGames(cursor);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to get recent games");
    }

    return response.data;
  }

  /**
   * Get pending settlements for a user
   */
  async getPendingSettlements(userPublicKey: string): Promise<Settlement[]> {
    const response = await this.apiClient.getPendingSettlements(userPublicKey);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to get pending settlements");
    }

    return response.data;
  }

  /**
   * Get detailed settlement information
   */
  async getSettlement(settlementId: string): Promise<Settlement | null> {
    const response = await this.apiClient.getSettlement(settlementId);

    if (!response.success) {
      if (response.error?.includes("not found")) {
        return null;
      }
      throw new Error(response.error || "Failed to get settlement");
    }

    return response.data || null;
  }

  /**
   * Wait for game settlement with polling
   */
  async waitForGameSettlement(
    gameId: string,
    timeoutMs: number = 30000,
  ): Promise<CoinflipResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await this.getGameResult(gameId);
        if (result) {
          return result;
        }
      } catch (error) {
        logger.warn("Error polling for game result:", { error });
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Game settlement timeout after ${timeoutMs}ms`);
  }
}

/**
 * Factory function to create a betting service
 */
export function createBettingService(
  config: AtomikConfig,
  apiClient: AtomikApiClient,
): AtomikBettingService {
  return new AtomikBettingService(config, apiClient);
}
