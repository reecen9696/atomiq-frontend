/**
 * Rate Limit Handler
 * 
 * Handles HTTP 429 (Too Many Requests) responses from the backend rate limiter.
 * Parses X-RateLimit-* headers and provides retry logic with backoff.
 * 
 * Backend rate limits (from atomiq PR #8):
 * - 30 requests per minute per wallet
 * - 500 requests per hour per wallet
 * - Burst: 5 requests per 3 seconds
 */

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTimestamp: number;
  retryAfter: number | null;
}

export class RateLimitError extends Error {
  public readonly rateLimitInfo: RateLimitInfo;
  public readonly statusCode: number = 429;

  constructor(message: string, info: RateLimitInfo) {
    super(message);
    this.name = "RateLimitError";
    this.rateLimitInfo = info;
  }

  get retryAfterMs(): number {
    if (this.rateLimitInfo.retryAfter) {
      return this.rateLimitInfo.retryAfter * 1000;
    }
    const now = Math.floor(Date.now() / 1000);
    const resetIn = this.rateLimitInfo.resetTimestamp - now;
    return Math.max(resetIn * 1000, 1000);
  }
}

/**
 * Parse rate limit headers from API response
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get("X-RateLimit-Limit") || "30", 10),
    remaining: parseInt(headers.get("X-RateLimit-Remaining") || "30", 10),
    resetTimestamp: parseInt(headers.get("X-RateLimit-Reset") || "0", 10),
    retryAfter: headers.has("Retry-After")
      ? parseInt(headers.get("Retry-After")!, 10)
      : null,
  };
}

/**
 * Track rate limit state per wallet to prevent unnecessary requests
 */
class RateLimitTracker {
  private walletLimits: Map<string, RateLimitInfo> = new Map();
  private globalCooldown: number | null = null;

  updateFromResponse(walletAddress: string, headers: Headers): void {
    const info = parseRateLimitHeaders(headers);
    this.walletLimits.set(walletAddress, info);
  }

  setGlobalCooldown(durationMs: number): void {
    this.globalCooldown = Date.now() + durationMs;
  }

  canMakeRequest(walletAddress: string): { allowed: boolean; waitMs?: number } {
    // Check global cooldown
    if (this.globalCooldown && Date.now() < this.globalCooldown) {
      return { allowed: false, waitMs: this.globalCooldown - Date.now() };
    }

    const info = this.walletLimits.get(walletAddress);
    if (!info) return { allowed: true };

    if (info.remaining <= 0) {
      const now = Math.floor(Date.now() / 1000);
      if (now < info.resetTimestamp) {
        return {
          allowed: false,
          waitMs: (info.resetTimestamp - now) * 1000,
        };
      }
    }

    return { allowed: true };
  }

  getRemainingRequests(walletAddress: string): number | null {
    const info = this.walletLimits.get(walletAddress);
    return info?.remaining ?? null;
  }

  clear(): void {
    this.walletLimits.clear();
    this.globalCooldown = null;
  }
}

export const rateLimitTracker = new RateLimitTracker();
