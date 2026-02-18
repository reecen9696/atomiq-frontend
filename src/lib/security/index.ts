/**
 * Security utilities barrel export
 */
export {
  RateLimitError,
  rateLimitTracker,
  parseRateLimitHeaders,
  type RateLimitInfo,
} from "./rate-limit-handler";

export {
  validateBet,
  validateMultiplier,
  validatePlayerId,
  getBetLimits,
  clampBetAmount,
  type GameType,
  type BetLimits,
  type ValidationResult,
} from "./bet-validator";

export { gameApiClient, type GameApiResponse } from "./game-api-client";
