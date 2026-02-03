"use client";

import { useEffect } from "react";
import { useAtomikWebSocket } from "@/components/providers/sdk-provider";
import { useWebSocket } from "@/lib/sdk/hooks";

export function LiveStatsWidget() {
  const wsManager = useAtomikWebSocket();
  const { casinoStats, recentWins, connected, connect, disconnect } =
    useWebSocket(wsManager, false);

  useEffect(() => {
    // Connect on mount
    connect().catch(console.error);

    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  if (!connected) {
    return (
      <div className="bg-[#131216] border border-[#1E2938] rounded-lg p-4">
        <div className="text-white/60 text-sm">Connecting to live stats...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#131216] border border-[#1E2938] rounded-lg p-4 space-y-4">
      <h3 className="text-white font-medium text-lg mb-3">Live Stats 🔴</h3>

      {/* Casino Stats */}
      {casinoStats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1E2938] rounded p-3">
            <div className="text-white/60 text-xs mb-1">Total Games</div>
            <div className="text-white font-medium text-xl">
              {casinoStats.totalGames.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#1E2938] rounded p-3">
            <div className="text-white/60 text-xs mb-1">Total Volume</div>
            <div className="text-white font-medium text-xl">
              {parseFloat(casinoStats.totalVolume).toFixed(2)} SOL
            </div>
          </div>

          <div className="bg-[#1E2938] rounded p-3">
            <div className="text-white/60 text-xs mb-1">Active Users</div>
            <div className="text-white font-medium text-xl">
              {casinoStats.activeUsers}
            </div>
          </div>

          <div className="bg-[#1E2938] rounded p-3">
            <div className="text-white/60 text-xs mb-1">Win Rate</div>
            <div className="text-white font-medium text-xl">
              {casinoStats.headsWins && casinoStats.tailsWins
                ? (
                    ((casinoStats.headsWins + casinoStats.tailsWins) /
                      2 /
                      casinoStats.totalGames) *
                    100
                  ).toFixed(1)
                : "50.0"}
              %
            </div>
          </div>
        </div>
      )}

      {/* Recent Wins */}
      {recentWins.length > 0 && (
        <div className="mt-4">
          <h4 className="text-white/80 text-sm font-medium mb-2">
            Recent Wins
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentWins.slice(0, 5).map((win) => (
              <div
                key={win.gameId}
                className="bg-[#1E2938] rounded p-2 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-green-400">🎉</span>
                  <span className="text-white/80">
                    {win.playerPubkey.slice(0, 4)}...
                    {win.playerPubkey.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {win.amount} SOL
                  </span>
                  <span className="text-white/60 text-xs">{win.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
