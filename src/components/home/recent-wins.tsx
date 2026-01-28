"use client";

import { WinnerCard } from "@/components/ui/winner-card";
import type { Winner } from "@/types/winner";

interface RecentWinsProps {
  winners: Winner[];
  maxDisplay?: number;
}

export function RecentWins({ winners, maxDisplay = 8 }: RecentWinsProps) {
  const displayedWinners = winners.slice(0, maxDisplay);

  if (displayedWinners.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {displayedWinners.map((winner) => (
          <WinnerCard
            key={winner.id}
            gameName={winner.gameName}
            gameImage={winner.gameImage}
            amount={winner.amount}
          />
        ))}
      </div>
    </section>
  );
}
