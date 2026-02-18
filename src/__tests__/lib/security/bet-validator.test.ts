import { describe, it, expect } from "vitest";
import {
  validateBet,
  validateMultiplier,
  validatePlayerId,
  getBetLimits,
  clampBetAmount,
} from "@/lib/security/bet-validator";

describe("BetValidator", () => {
  describe("validateBet", () => {
    it("accepts valid bets within range", () => {
      expect(validateBet(0.01, "coinflip").valid).toBe(true);
      expect(validateBet(1.0, "dice").valid).toBe(true);
      expect(validateBet(50, "plinko").valid).toBe(true);
      expect(validateBet(100, "slot").valid).toBe(true);
    });

    it("rejects bets below minimum (0.001 SOL)", () => {
      const result = validateBet(0.0001, "coinflip");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Minimum bet");
    });

    it("rejects bets above maximum (100 SOL)", () => {
      const result = validateBet(101, "dice");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Maximum bet");
    });

    it("rejects negative bets", () => {
      const result = validateBet(-1, "plinko");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("positive");
    });

    it("rejects zero bets", () => {
      const result = validateBet(0, "slot");
      expect(result.valid).toBe(false);
    });

    it("rejects NaN bets", () => {
      const result = validateBet(NaN, "coinflip");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid number");
    });

    it("rejects unknown game types", () => {
      const result = validateBet(1, "unknown" as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown game type");
    });

    it("enforces boundary values (min 0.001)", () => {
      expect(validateBet(0.001, "coinflip").valid).toBe(true);
      expect(validateBet(0.0009, "coinflip").valid).toBe(false);
    });

    it("enforces boundary values (max 100)", () => {
      expect(validateBet(100, "dice").valid).toBe(true);
      expect(validateBet(100.01, "dice").valid).toBe(false);
    });
  });

  describe("validateMultiplier", () => {
    it("accepts valid multipliers per game type", () => {
      expect(validateMultiplier(2.0, "coinflip").valid).toBe(true);
      expect(validateMultiplier(95.0, "dice").valid).toBe(true);
      expect(validateMultiplier(1000.0, "plinko").valid).toBe(true);
      expect(validateMultiplier(250.0, "slot").valid).toBe(true);
    });

    it("rejects multipliers exceeding game max", () => {
      expect(validateMultiplier(2.1, "coinflip").valid).toBe(false);
      expect(validateMultiplier(96, "dice").valid).toBe(false);
      expect(validateMultiplier(1001, "plinko").valid).toBe(false);
      expect(validateMultiplier(251, "slot").valid).toBe(false);
    });

    it("rejects zero or negative multipliers", () => {
      expect(validateMultiplier(0, "coinflip").valid).toBe(false);
      expect(validateMultiplier(-1, "dice").valid).toBe(false);
    });
  });

  describe("validatePlayerId", () => {
    it("accepts valid Solana public keys", () => {
      // Valid base58 Solana address format
      expect(
        validatePlayerId("HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1").valid,
      ).toBe(true);
    });

    it("rejects empty player ID", () => {
      expect(validatePlayerId("").valid).toBe(false);
    });

    it("rejects invalid characters", () => {
      expect(validatePlayerId("invalid-address!@#$").valid).toBe(false);
    });

    it("rejects too-short addresses", () => {
      expect(validatePlayerId("short").valid).toBe(false);
    });
  });

  describe("getBetLimits", () => {
    it("returns correct limits for each game type", () => {
      const coinflip = getBetLimits("coinflip");
      expect(coinflip.maxMultiplier).toBe(2.0);
      expect(coinflip.minBetSol).toBe(0.001);
      expect(coinflip.maxBetSol).toBe(100);

      const plinko = getBetLimits("plinko");
      expect(plinko.maxMultiplier).toBe(1000.0);
    });
  });

  describe("clampBetAmount", () => {
    it("clamps below minimum to minimum", () => {
      expect(clampBetAmount(0.0001, "coinflip")).toBe(0.001);
    });

    it("clamps above maximum to maximum", () => {
      expect(clampBetAmount(200, "dice")).toBe(100);
    });

    it("leaves valid amounts unchanged", () => {
      expect(clampBetAmount(5, "plinko")).toBe(5);
    });
  });
});
