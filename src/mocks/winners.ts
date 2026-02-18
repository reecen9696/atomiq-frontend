import type { Winner } from "@/types/winner";

/**
 * Mock data for recent winners
 * TODO: Replace with actual API data
 */
const gameImages = [
  { name: "Plinko", image: "/games/plinko.png" },
  { name: "Dice", image: "/games/dice.png" },
  { name: "Coinflip", image: "/games/coinflip.png" },
  { name: "Slots", image: "/games/slot.png" },
];

export const mockWinners: Winner[] = Array.from({ length: 7 }, (_, i) => {
  const game = gameImages[i % gameImages.length];
  return {
    id: `winner-${i + 1}`,
    gameName: game.name,
    gameImage: game.image,
    amount: "0.092856",
  };
});
