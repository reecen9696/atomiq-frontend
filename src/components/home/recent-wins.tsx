"use client";

import { WinnerCard } from "@/components/ui/winner-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentWins } from "@/hooks";
import { config } from "@/config";
import { GradientOverlay } from "@/components/shared/gradient-overlay";

interface RecentWinsProps {
  maxDisplay?: number;
}

export function RecentWins({
  maxDisplay = config.pagination.limits.winners,
}: RecentWinsProps) {
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
    <section className="relative py-4 overflow-y-visible">
      <div className="flex gap-4 pb-2 overflow-x-auto">
        {winners.map((winner) => (
          <WinnerCard
            key={winner.id}
            gameName={winner.gameName}
            gameImage={winner.gameImage}
            amount={winner.amount}
          />
        ))}
      </div>
      <GradientOverlay position="right" size="w-60" />
    </section>
  );
}
