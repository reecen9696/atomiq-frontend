import type { GameCardProps } from "@/components/ui/game-card";

/**
 * Mock data for games
 * TODO: Replace with actual API data
 */
export const mockGames: GameCardProps[] = Array.from({ length: 7 }, (_, i) => ({
  id: `game-${i + 1}`,
  title: `Game ${i + 1}`,
  image: `/games/game${i + 1}.png`,
}));
