"use client";

import Link from "next/link";
import { getAvailableGames } from "@/config/games";
import { GameCard } from "@/components/ui/game-card";

interface GameNotFoundProps {
  requestedGame: string;
}

/**
 * GameNotFound Component
 * Shown when a user tries to access a game that doesn't exist or is disabled
 */
export function GameNotFound({ requestedGame }: GameNotFoundProps) {
  const availableGames = getAvailableGames();

  return (
    <div className="flex min-h-[650px] items-center justify-center">
      <div className="max-w-2xl text-center px-4">
        <div className="mb-6 text-8xl">🎰</div>
        
        <h1 className="mb-3 text-3xl font-bold text-white">
          Game Not Found
        </h1>
        
        <p className="mb-2 text-lg text-white/80">
          The game <span className="font-mono text-primary-purple">&quot;{requestedGame}&quot;</span> doesn&apos;t exist or isn&apos;t available yet.
        </p>
        
        <p className="mb-8 text-white/60">
          Try one of our available games below or head back to the homepage.
        </p>

        <div className="mb-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-primary-purple px-6 py-3 text-white transition-colors hover:bg-primary-purple-hover"
          >
            Go to Homepage
          </Link>
          
          <Link
            href="/casino"
            className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10"
          >
            Browse All Games
          </Link>
        </div>

        {availableGames.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-semibold text-white">
              Available Games
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {availableGames.slice(0, 4).map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  image={game.image}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
