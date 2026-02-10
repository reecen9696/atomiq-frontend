import { ComponentType } from "react";

/**
 * Game Configuration
 * Central registry for all casino games
 */

export interface GameConfig {
  /** Unique game identifier */
  id: string;

  /** URL-friendly slug for routing */
  slug: string;

  /** Display name */
  title: string;

  /** Display description */
  description: string;

  /** Game thumbnail image path */
  image: string;

  /** Game category */
  category: string;

  /** Minimum bet amount in SOL */
  minBet: number;

  /** Maximum bet amount in SOL */
  maxBet: number;

  /** Whether the game is currently available */
  enabled: boolean;

  /** Whether this is a featured game */
  featured: boolean;

  /** Component to render the game (loaded dynamically) */
  component?: ComponentType<any>;

  /** Route path for the game */
  route: string;
}

/**
 * Game Registry
 * Add new games here to make them available throughout the app
 */
export const GAMES: Record<string, GameConfig> = {
  coinflip: {
    id: "coinflip",
    slug: "coinflip",
    title: "Coinflip",
    description: "Classic heads or tails game with provably fair results",
    image: "/games/coinflip.png",
    category: "classic",
    minBet: 0.01,
    maxBet: 10,
    enabled: true,
    featured: true,
    route: "/casino/coinflip",
  },

  dice: {
    id: "dice",
    slug: "dice",
    title: "Dice",
    description: "Roll the dice and win big with customizable multipliers",
    image: "/games/game1.png",
    category: "classic",
    minBet: 0.01,
    maxBet: 100,
    enabled: true,
    featured: true,
    route: "/casino/dice",
  },

  // Placeholder games for future implementation
  slots: {
    id: "slots",
    slug: "slots",
    title: "Slots",
    description: "Spin the reels for massive jackpots",
    image: "/games/game2.png",
    category: "slots",
    minBet: 0.01,
    maxBet: 50,
    enabled: false,
    featured: false,
    route: "/casino/slots",
  },

  roulette: {
    id: "roulette",
    slug: "roulette",
    title: "Roulette",
    description: "Place your bets on the classic wheel of fortune",
    image: "/games/game3.png",
    category: "table",
    minBet: 0.01,
    maxBet: 100,
    enabled: false,
    featured: false,
    route: "/casino/roulette",
  },

  blackjack: {
    id: "blackjack",
    slug: "blackjack",
    title: "Blackjack",
    description: "Beat the dealer with skill and strategy",
    image: "/games/game4.png",
    category: "table",
    minBet: 0.1,
    maxBet: 500,
    enabled: false,
    featured: false,
    route: "/casino/blackjack",
  },

  plinko: {
    id: "plinko",
    slug: "plinko",
    title: "Plinko",
    description: "Watch your bet bounce to victory",
    image: "/games/game5.png",
    category: "arcade",
    minBet: 0.01,
    maxBet: 20,
    enabled: false,
    featured: false,
    route: "/casino/plinko",
  },

  crash: {
    id: "crash",
    slug: "crash",
    title: "Crash",
    description: "Cash out before the rocket crashes",
    image: "/games/game6.png",
    category: "arcade",
    minBet: 0.01,
    maxBet: 100,
    enabled: false,
    featured: false,
    route: "/casino/crash",
  },
} as const;

/**
 * Get all available games (enabled only)
 */
export function getAvailableGames(): GameConfig[] {
  return Object.values(GAMES).filter((game) => game.enabled);
}

/**
 * Get all games (including disabled)
 */
export function getAllGames(): GameConfig[] {
  return Object.values(GAMES);
}

/**
 * Get featured games
 */
export function getFeaturedGames(): GameConfig[] {
  return Object.values(GAMES).filter((game) => game.enabled && game.featured);
}

/**
 * Get game by slug
 */
export function getGameBySlug(slug: string): GameConfig | null {
  return GAMES[slug] || null;
}

/**
 * Get game by ID
 */
export function getGameById(id: string): GameConfig | null {
  return GAMES[id] || null;
}

/**
 * Check if a game exists and is enabled
 */
export function isGameAvailable(slug: string): boolean {
  const game = getGameBySlug(slug);
  return game !== null && game.enabled;
}

/**
 * Get games by category
 */
export function getGamesByCategory(category: string): GameConfig[] {
  return Object.values(GAMES).filter(
    (game) => game.enabled && game.category === category,
  );
}

/**
 * Format game slug for display
 * @example formatGameTitle("coinflip") => "Coinflip"
 */
export function formatGameTitle(slug: string): string {
  const game = getGameBySlug(slug);
  return (
    game?.title ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Get community games
 * Returns games in the community category
 */
export function getCommunityGames(): GameConfig[] {
  return getGamesByCategory("community");
}

/**
 * Game categories
 */
export const GAME_CATEGORIES_LIST = [
  { id: "all", label: "All Games" },
  { id: "classic", label: "Classic" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Table Games" },
  { id: "arcade", label: "Arcade" },
  { id: "community", label: "Community" },
] as const;
