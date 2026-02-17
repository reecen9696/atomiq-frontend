"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { GameConfig } from "@/config/games";

/**
 * Game component map
 * Maps game slugs to their React components
 * Uses dynamic imports for code splitting
 */
const GAME_COMPONENTS: Record<string, ComponentType<any>> = {
  coinflip: dynamic(
    () =>
      import("@/components/games/coinflip-game").then((mod) => ({
        default: mod.CoinflipGame,
      })),
    {
      loading: () => <GameLoadingState />,
      ssr: false,
    },
  ),

  dice: dynamic(() => import("@/components/games/dice/Dice"), {
    loading: () => <GameLoadingState />,
    ssr: false,
  }),

  plinko: dynamic(() => import("@/components/games/plinko/Plinko"), {
    loading: () => <GameLoadingState />,
    ssr: false,
  }),

  slots: dynamic(() => import("@/components/games/slots/Slots"), {
    loading: () => <GameLoadingState />,
    ssr: false,
  }),
};

interface GameLoaderProps {
  game: GameConfig;
}

/**
 * GameLoader Component
 * Dynamically loads and renders the appropriate game component
 */
export function GameLoader({ game }: GameLoaderProps) {
  const GameComponent = GAME_COMPONENTS[game.slug];

  if (!GameComponent) {
    return <GameNotImplemented game={game} />;
  }

  return <GameComponent />;
}

/**
 * Loading state shown while game component is being loaded
 */
function GameLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-purple border-r-transparent" />
        <p className="text-white/60">Loading game...</p>
      </div>
    </div>
  );
}

/**
 * Placeholder shown for games that are enabled but not yet implemented
 */
function GameNotImplemented({ game }: { game: GameConfig }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">🎮</div>
        <h2 className="mb-2 text-2xl font-bold text-white">{game.title}</h2>
        <p className="mb-4 text-white/60">{game.description}</p>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-400">
            This game is coming soon! Check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
