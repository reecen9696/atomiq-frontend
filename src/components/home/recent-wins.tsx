"use client";

import { WinnerCard } from "@/components/ui/winner-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentWins } from "@/hooks";
import { MAX_RECENT_WINS } from "@/constants";

interface RecentWinsProps {
  maxDisplay?: number;
}

export function RecentWins({ maxDisplay = MAX_RECENT_WINS }: RecentWinsProps) {
  const { data: winners, isLoading, error } = useRecentWins(maxDisplay);

  if (error) {
    return (
      <section className="w-full">
        <p className="text-sm text-red-500">Failed to load recent wins</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="w-full">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: maxDisplay }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-40 rounded-sm shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <section className="w-full">
        <p className="text-sm text-white/60">No recent wins</p>
      </section>
    );
  }

  return (
    <section className="relative overflow-y-visible py-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {winners.map((winner) => (
          <WinnerCard
            key={winner.id}
            gameName={winner.gameName}
            gameImage={winner.gameImage}
            amount={winner.amount}
          />
        ))}
      </div>
      {/* Gradient fade overlay on right */}
      <div className="absolute right-0 top-0 bottom-0 w-60 bg-gradient-to-l from-[#0F0E11] to-transparent pointer-events-none" />
    </section>
  );
}
