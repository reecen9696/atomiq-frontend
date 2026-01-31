import { useQuery } from "@tanstack/react-query";
import { useAtomikWebSocket } from "@/components/providers/sdk-provider";
import { useWebSocket } from "@/lib/sdk/hooks";
import { config } from "@/config";
import { mockStatCards } from "@/mocks";

/**
 * Hook for fetching current statistics using WebSocket data
 * Falls back to mock data if WebSocket is not connected
 *
 * @returns React Query result with stats data
 */
export function useStats() {
  const wsManager = useAtomikWebSocket();
  const { casinoStats, connected } = useWebSocket(wsManager, true);

  return useQuery({
    queryKey: ["stats", "current", casinoStats],
    queryFn: async () => {
      if (connected && casinoStats) {
        // Transform WebSocket data to stats cards format
        return [
          {
            id: "1",
            title: "Total Games",
            value: casinoStats.totalGames.toLocaleString(),
            icon: "/icons/stats/games.svg",
          },
          {
            id: "2",
            title: "Total Volume",
            value: `${casinoStats.totalVolume} SOL`,
            icon: "/icons/stats/volume.svg",
          },
          {
            id: "3",
            title: "Active Users",
            value: casinoStats.activeUsers.toLocaleString(),
            icon: "/icons/stats/users.svg",
          },
          {
            id: "4",
            title: "Heads Wins",
            value: (casinoStats.headsWins || 0).toLocaleString(),
            icon: "/icons/stats/wins.svg",
          },
          {
            id: "5",
            title: "Tails Wins",
            value: (casinoStats.tailsWins || 0).toLocaleString(),
            icon: "/icons/stats/wins.svg",
          },
        ];
      }

      // Fall back to mock data
      if (config.features.enableMockData) {
        return mockStatCards;
      }

      return [];
    },
    enabled: true,
    staleTime: 5000,
  });
}
