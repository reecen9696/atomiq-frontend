import type { GameCardProps } from "@/components/ui/game-card";
import { getAvailableGames, getAllGames } from "@/config/games";

/**
 * Mock data for games
 * Now uses the centralized game registry
 */
export const mockGames: GameCardProps[] = getAllGames().map((game) => ({
  id: game.id,
  title: game.title,
  image: game.image,
  slug: game.slug,
}));

/**
 * Get only enabled/available games
 */
export const availableGames: GameCardProps[] = getAvailableGames().map((game) => ({
  id: game.id,
  title: game.title,
  image: game.image,
  slug: game.slug,
}));
