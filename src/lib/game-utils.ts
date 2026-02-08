/**
 * Game Utilities
 * Helper functions for game-related operations
 * 
 * Note: Most formatting utilities have been moved to lib/utils.ts
 * This file contains only game-specific logic
 */

import {
  slugify as baseSlugify,
  unslugify as baseUnslugify,
  formatSOL as baseFormatSOL,
  formatAddress as baseFormatAddress,
  formatTimeAgo as baseFormatTimeAgo,
} from "./utils";

// Re-export commonly used utilities for convenience
export {
  slugify,
  unslugify,
  formatSOL,
  formatAddress,
  formatTimeAgo,
} from "./utils";

/**
 * Get the full route path for a game
 * @example getGameRoute("coinflip") => "/casino/coinflip"
 */
export function getGameRoute(slug: string): string {
  return `/casino/${slug}`;
}

/**
 * Validate bet amount is within acceptable range
 */
export function validateBetAmount(
  amount: number,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Bet amount must be greater than 0" };
  }
  
  if (amount < min) {
    return { valid: false, error: `Minimum bet is ${min} SOL` };
  }
  
  if (amount > max) {
    return { valid: false, error: `Maximum bet is ${max} SOL` };
  }
  
  return { valid: true };
}
