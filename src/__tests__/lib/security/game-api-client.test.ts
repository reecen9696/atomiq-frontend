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
  });
});
