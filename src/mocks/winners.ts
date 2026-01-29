import type { Winner } from "@/types/winner";

/**
 * Mock data for recent winners
 * TODO: Replace with actual API data
 */
export const mockWinners: Winner[] = Array.from({ length: 7 }, (_, i) => ({
  id: `winner-${i + 1}`,
  gameName: "LuckyPoker",
  gameImage: "/games/game1.png",
  amount: "0.092856",
}));
