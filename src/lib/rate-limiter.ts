/**
 * Rate Limiting on Bet Submissions
 * Frontend-side rate limiting to prevent accidental double-bets and spam
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

interface BetRecord {
  gameId: string;
  timestamp: number;
}

export class BetRateLimiter {
  private lastBetPerGame: Map<string, number> = new Map();
  private globalBets: BetRecord[] = [];
  private lastClickTime = 0;
  
  // Configuration
  private readonly GAME_BET_COOLDOWN_MS = 1500; // Max 1 bet per 1.5 seconds per game
  private readonly GLOBAL_MAX_BETS_PER_MINUTE = 20; // Max 20 bets per minute globally
  private readonly DEBOUNCE_MS = 300; // Debounce rapid clicks
  private readonly MINUTE_MS = 60000;

  /**
   * Check if a bet can be placed for a specific game
   */
  canPlaceBet(gameId: string): RateLimitResult {
    const now = Date.now();

    // Debounce rapid clicks
    const timeSinceLastClick = now - this.lastClickTime;
    if (timeSinceLastClick < this.DEBOUNCE_MS) {
      return {
        allowed: false,
        retryAfterMs: this.DEBOUNCE_MS - timeSinceLastClick,
      };
    }

    // Check per-game cooldown
    const lastBetTime = this.lastBetPerGame.get(gameId);
    if (lastBetTime) {
      const timeSinceLastBet = now - lastBetTime;
      if (timeSinceLastBet < this.GAME_BET_COOLDOWN_MS) {
        return {
          allowed: false,
          retryAfterMs: this.GAME_BET_COOLDOWN_MS - timeSinceLastBet,
        };
      }
    }

    // Check global rate limit (20 bets per minute)
    this.cleanupOldBets(now);
    if (this.globalBets.length >= this.GLOBAL_MAX_BETS_PER_MINUTE) {
      const oldestBet = this.globalBets[0];
      const retryAfter = this.MINUTE_MS - (now - oldestBet.timestamp);
      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfter),
      };
    }

    return { allowed: true };
  }

  /**
   * Record a bet after it's been placed
   */
  recordBet(gameId: string): void {
    const now = Date.now();
    
    // Update last click time for debouncing
    this.lastClickTime = now;
    
    // Update per-game cooldown
    this.lastBetPerGame.set(gameId, now);
    
    // Update global bet history
    this.globalBets.push({ gameId, timestamp: now });
    
    // Cleanup old bets
    this.cleanupOldBets(now);
  }

  /**
   * Reset all rate limiters (useful for testing or after disconnect)
   */
  reset(): void {
    this.lastBetPerGame.clear();
    this.globalBets = [];
    this.lastClickTime = 0;
  }

  /**
   * Clean up bets older than 1 minute
   */
  private cleanupOldBets(now: number): void {
    const cutoffTime = now - this.MINUTE_MS;
    this.globalBets = this.globalBets.filter(
      (bet) => bet.timestamp > cutoffTime
    );
  }

  /**
   * Get current rate limit status (for debugging/display)
   */
  getStatus() {
    const now = Date.now();
    this.cleanupOldBets(now);
    
    return {
      globalBetsInLastMinute: this.globalBets.length,
      maxGlobalBetsPerMinute: this.GLOBAL_MAX_BETS_PER_MINUTE,
      activeGameCooldowns: this.lastBetPerGame.size,
    };
  }
}

// Singleton instance for global use
let rateLimiterInstance: BetRateLimiter | null = null;

/**
 * Get the global rate limiter instance
 */
export function getRateLimiter(): BetRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new BetRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Reset the global rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
  rateLimiterInstance = null;
}
