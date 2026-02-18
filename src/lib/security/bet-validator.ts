/**
 * Bet Validator (Client-Side)
 * 
 * Mirrors the backend BetValidator (from atomiq PR #8) to provide
 * instant client-side validation before making API calls.
 * 
 * Backend constraints:
 * - Min bet: 0.001 SOL (1,000,000 lamports)
 * - Max bet: 100 SOL (100,000,000,000 lamports)
 * - Max payout varies by game type
 * - All amounts in lamports internally
 */

export type GameType = "coinflip" | "dice" | "plinko" | "slot";

export interface BetLimits {
  minBetSol: number;
  maxBetSol: number;
  maxPayoutSol: number;
  maxMultiplier: number;
}

/**
 * Game-specific limits matching backend BetValidator exactly
 */
const GAME_LIMITS: Record<GameType, BetLimits> = {
  coinflip: {
    minBetSol: 0.001,
    maxBetSol: 100,
    maxPayoutSol: 200, // 2x max multiplier
    maxMultiplier: 2.0,
  },
  dice: {
    minBetSol: 0.001,
    maxBetSol: 100,
    maxPayoutSol: 9500, // 95x max multiplier
    maxMultiplier: 95.0,
  },
  plinko: {
    minBetSol: 0.001,
    maxBetSol: 100,
    maxPayoutSol: 100000, // 1000x max multiplier
    maxMultiplier: 1000.0,
  },
  slot: {
    minBetSol: 0.001,
    maxBetSol: 100,
    maxPayoutSol: 25000, // 250x max multiplier
    maxMultiplier: 250.0,
  },
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validate a bet amount before submitting to the API
 */
export function validateBet(
  amountSol: number,
  gameType: GameType,
): ValidationResult {
  const limits = GAME_LIMITS[gameType];
  if (!limits) {
    return { valid: false, error: `Unknown game type: ${gameType}`, field: "gameType" };
  }

  if (typeof amountSol !== "number" || isNaN(amountSol)) {
    return { valid: false, error: "Bet amount must be a valid number", field: "amount" };
  }

  if (amountSol <= 0) {
    return { valid: false, error: "Bet amount must be positive", field: "amount" };
  }

  if (amountSol < limits.minBetSol) {
    return {
      valid: false,
      error: `Minimum bet is ${limits.minBetSol} SOL`,
      field: "amount",
    };
  }

  if (amountSol > limits.maxBetSol) {
    return {
      valid: false,
      error: `Maximum bet is ${limits.maxBetSol} SOL`,
      field: "amount",
    };
  }

  return { valid: true };
}

/**
 * Validate multiplier for a specific game
 */
export function validateMultiplier(
  multiplier: number,
  gameType: GameType,
): ValidationResult {
  const limits = GAME_LIMITS[gameType];
  if (!limits) {
    return { valid: false, error: `Unknown game type: ${gameType}` };
  }

  if (multiplier > limits.maxMultiplier) {
    return {
      valid: false,
      error: `Maximum multiplier for ${gameType} is ${limits.maxMultiplier}x`,
    };
  }

  if (multiplier <= 0) {
    return { valid: false, error: "Multiplier must be positive" };
  }

  return { valid: true };
}

/**
 * Get the bet limits for a game type
 */
export function getBetLimits(gameType: GameType): BetLimits {
  return GAME_LIMITS[gameType];
}

/**
 * Sanitize and clamp a bet amount to valid range
 */
export function clampBetAmount(amount: number, gameType: GameType): number {
  const limits = GAME_LIMITS[gameType];
  return Math.max(limits.minBetSol, Math.min(limits.maxBetSol, amount));
}

/**
 * Validate player_id is a valid Solana public key format
 */
export function validatePlayerId(playerId: string): ValidationResult {
  if (!playerId || typeof playerId !== "string") {
    return { valid: false, error: "Player ID is required", field: "player_id" };
  }

  // Base58 check: Solana public keys are 32-44 characters of base58
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(playerId)) {
    return {
      valid: false,
      error: "Invalid wallet address format",
      field: "player_id",
    };
  }

  return { valid: true };
}
