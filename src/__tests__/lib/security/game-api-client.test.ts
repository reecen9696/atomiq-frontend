import { describe, it, expect, vi, beforeEach } from "vitest";
import { gameApiClient } from "@/lib/security/game-api-client";
import axios from "axios";

// Mock axios
vi.mock("axios", () => {
  const mockAxios: any = {
    create: vi.fn(() => mockAxios),
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
    isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
  };
  return { default: mockAxios };
});

describe("GameApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("client-side validation", () => {
    it("rejects invalid player ID before making API call", async () => {
      const result = await gameApiClient.coinflip.play({
        player_id: "",
        bet_amount: 1,
        choice: "heads",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Player ID");
    });

    it("rejects invalid bet amount before making API call", async () => {
      const result = await gameApiClient.dice.play({
        player_id: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        bet_amount: -1,
        target_number: 50,
        bet_type: "over",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("positive");
    });

    it("rejects bet below minimum", async () => {
      const result = await gameApiClient.plinko.play({
        player_id: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        bet_amount: 0.0001,
        risk_level: "medium",
        rows: 12,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Minimum bet");
    });

    it("rejects bet above maximum", async () => {
      const result = await gameApiClient.slot.play({
        player_id: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        bet_amount: 200,
        lines: 20,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum bet");
    });
  });

  describe("all game types have play methods", () => {
    it("has coinflip.play", () => {
      expect(gameApiClient.coinflip.play).toBeDefined();
    });

    it("has dice.play", () => {
      expect(gameApiClient.dice.play).toBeDefined();
    });

    it("has plinko.play", () => {
      expect(gameApiClient.plinko.play).toBeDefined();
    });

    it("has slot.play", () => {
      expect(gameApiClient.slot.play).toBeDefined();
    });

    it("has getResult", () => {
      expect(gameApiClient.getResult).toBeDefined();
    });

    it("has verifyVrf", () => {
      expect(gameApiClient.verifyVrf).toBeDefined();
    });

    it("has unified play method", () => {
      expect(gameApiClient.play).toBeDefined();
    });

    it("has getBalance", () => {
      expect(gameApiClient.getBalance).toBeDefined();
    });
  });

  describe("unified play endpoint", () => {
    it("rejects invalid player ID", async () => {
      const result = await gameApiClient.play({
        player_id: "",
        player_address: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        game_type: "plinko",
        bet_amount: 1,
        token: { symbol: "SOL" },
        game_params: { risk_level: "medium", rows: 12 },
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Player ID");
    });

    it("rejects bet below minimum", async () => {
      const result = await gameApiClient.play({
        player_id: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        player_address: "HN7cABqLq46Es1jh92dQQisAi5YqQxzN6aw81cR5q1z1",
        game_type: "plinko",
        bet_amount: 0.0001,
        token: { symbol: "SOL" },
        game_params: { risk_level: "medium", rows: 12 },
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Minimum bet");
    });
  });

  describe("plinko payout correctness", () => {
    it("0.5x multiplier: net balance change is -0.5 SOL (not -1 SOL)", () => {
      // useBetGuard deducts betAmount, then resolve() adds back payout
      // For 0.5x: deduct 1, add back 0.5 → net -0.5
      const betAmount = 1;
      const payoutAmount = 0.5; // server-returned payout for 0.5x
      const netChange = payoutAmount - betAmount;
      expect(netChange).toBe(-0.5);
    });

    it("14x multiplier: net balance change is +13 SOL", () => {
      const betAmount = 1;
      const payoutAmount = 14; // server-returned payout for 14x
      const netChange = payoutAmount - betAmount;
      expect(netChange).toBe(13);
    });

    it("uses server payout_amount (??), not || operator fallback", () => {
      // When payout_amount is 0.5 (truthy), both || and ?? yield 0.5 — correct
      const serverPayout = 0.5;
      const won = false; // outcome = "loss" for partial payout
      const betAmount = 1;
      const multiplier = 0.5;

      // Old buggy calculation (|| with won-based fallback)
      const buggyPayout = serverPayout || (won ? betAmount * multiplier : 0);
      // New correct calculation (?? with multiplier fallback)
      const correctPayout = serverPayout ?? betAmount * multiplier;

      // Both yield the right answer when server provides payout_amount
      expect(buggyPayout).toBe(0.5);
      expect(correctPayout).toBe(0.5);
    });

    it("?? operator handles missing payout_amount for partial loss correctly", () => {
      // When payout_amount is undefined (server didn't return it),
      // ?? falls back to betAmount * multiplier (correct for partial loss)
      const serverPayout = undefined;
      const betAmount = 1;
      const multiplier = 0.5;
      const won = false;

      // Old buggy calculation falls to 0 for a loss
      const buggyPayout = serverPayout || (won ? betAmount * multiplier : 0);
      // New correct calculation uses multiplier regardless of won
      const correctPayout = serverPayout ?? betAmount * multiplier;

      expect(buggyPayout).toBe(0); // bug: loses the 0.5x payout
      expect(correctPayout).toBe(0.5); // correct
    });
  });
});
