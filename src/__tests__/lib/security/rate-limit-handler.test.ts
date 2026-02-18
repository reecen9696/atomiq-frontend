import { describe, it, expect, beforeEach } from "vitest";
import {
  RateLimitError,
  rateLimitTracker,
  parseRateLimitHeaders,
} from "@/lib/security/rate-limit-handler";

describe("RateLimitHandler", () => {
  beforeEach(() => {
    rateLimitTracker.clear();
  });

  describe("parseRateLimitHeaders", () => {
    it("parses standard rate limit headers", () => {
      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "25",
        "X-RateLimit-Reset": "1700000000",
      });

      const info = parseRateLimitHeaders(headers);
      expect(info.limit).toBe(30);
      expect(info.remaining).toBe(25);
      expect(info.resetTimestamp).toBe(1700000000);
      expect(info.retryAfter).toBeNull();
    });

    it("parses Retry-After header", () => {
      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1700000000",
        "Retry-After": "60",
      });

      const info = parseRateLimitHeaders(headers);
      expect(info.remaining).toBe(0);
      expect(info.retryAfter).toBe(60);
    });

    it("returns defaults for missing headers", () => {
      const headers = new Headers();
      const info = parseRateLimitHeaders(headers);
      expect(info.limit).toBe(30);
      expect(info.remaining).toBe(30);
    });
  });

  describe("RateLimitError", () => {
    it("calculates retryAfterMs from retryAfter", () => {
      const error = new RateLimitError("too many", {
        limit: 30,
        remaining: 0,
        resetTimestamp: 0,
        retryAfter: 5,
      });
      expect(error.retryAfterMs).toBe(5000);
    });

    it("calculates retryAfterMs from reset timestamp", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 10;
      const error = new RateLimitError("too many", {
        limit: 30,
        remaining: 0,
        resetTimestamp: futureTimestamp,
        retryAfter: null,
      });
      // Should be approximately 10 seconds (within 1s margin)
      expect(error.retryAfterMs).toBeGreaterThan(8000);
      expect(error.retryAfterMs).toBeLessThanOrEqual(11000);
    });
  });

  describe("RateLimitTracker", () => {
    it("allows requests when no rate limit data exists", () => {
      const result = rateLimitTracker.canMakeRequest("wallet123");
      expect(result.allowed).toBe(true);
    });

    it("blocks requests when remaining is 0", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 60;
      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(futureReset),
      });

      rateLimitTracker.updateFromResponse("wallet123", headers);
      const result = rateLimitTracker.canMakeRequest("wallet123");
      expect(result.allowed).toBe(false);
      expect(result.waitMs).toBeGreaterThan(0);
    });

    it("allows requests when remaining > 0", () => {
      const headers = new Headers({
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "15",
        "X-RateLimit-Reset": "1700000000",
      });

      rateLimitTracker.updateFromResponse("wallet123", headers);
      const result = rateLimitTracker.canMakeRequest("wallet123");
      expect(result.allowed).toBe(true);
    });

    it("tracks different wallets independently", () => {
      const futureReset = Math.floor(Date.now() / 1000) + 60;

      rateLimitTracker.updateFromResponse(
        "wallet1",
        new Headers({ "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(futureReset) }),
      );

      rateLimitTracker.updateFromResponse(
        "wallet2",
        new Headers({ "X-RateLimit-Remaining": "20", "X-RateLimit-Reset": "0" }),
      );

      expect(rateLimitTracker.canMakeRequest("wallet1").allowed).toBe(false);
      expect(rateLimitTracker.canMakeRequest("wallet2").allowed).toBe(true);
    });

    it("respects global cooldown", () => {
      rateLimitTracker.setGlobalCooldown(5000);
      const result = rateLimitTracker.canMakeRequest("any-wallet");
      expect(result.allowed).toBe(false);
    });

    it("returns remaining requests", () => {
      rateLimitTracker.updateFromResponse(
        "wallet123",
        new Headers({ "X-RateLimit-Remaining": "12" }),
      );
      expect(rateLimitTracker.getRemainingRequests("wallet123")).toBe(12);
    });

    it("returns null for unknown wallets", () => {
      expect(rateLimitTracker.getRemainingRequests("unknown")).toBeNull();
    });

    it("clears all tracking data", () => {
      rateLimitTracker.updateFromResponse(
        "wallet1",
        new Headers({ "X-RateLimit-Remaining": "5" }),
      );
      rateLimitTracker.clear();
      expect(rateLimitTracker.getRemainingRequests("wallet1")).toBeNull();
    });
  });
});
