import { useQuery } from "@tanstack/react-query";
import { config } from "@/config";
import { mockStatCards } from "@/mocks";
import { env } from "@/config/env";

/**
 * Hook for fetching current statistics via direct API call like test-ui
 * Falls back to mock data if API is not available
 *
 * @returns React Query result with stats data
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats", "current"],
    queryFn: async () => {
      if (config.features.enableMockData) {
        console.log("📊 Stats: Using mock data");
        return mockStatCards;
      }

      try {
        console.log(
          "📊 Stats: Fetching from API:",
          `${env.apiUrl}/api/casino/stats`,
        );

        // Use the same simple fetch approach as test-ui
        const response = await fetch(`${env.apiUrl}/api/casino/stats`);

        if (!response.ok) {
          console.warn(`📊 Stats: API returned ${response.status}`);
          throw new Error(`HTTP ${response.status}`);
        }

        const casinoStats = await response.json();
        console.log("📊 Stats: Received API data:", casinoStats);

        // Transform to StatCard format like test-ui displays
        const statCards = [
          {
            id: "bets",
            title: "BETS",
            value: casinoStats.bet_count.toLocaleString(),
            icon: "/icons/diceicon.svg",
          },
          {
            id: "gross-rtp",
            title: "GROSS RTP",
            value: `${casinoStats.gross_rtp.toFixed(2)}%`,
            icon: "/icons/diceicon.svg",
          },
          {
            id: "bankroll",
            title: "BANKROLL ",
            value: `12.3 SOL`,
            icon: "/icons/moneyicon.svg",
          },
          {
            id: "wagered",
            title: "WAGERED",
            value: `${casinoStats.total_wagered.toFixed(2)} SOL`,
            icon: "/icons/winicon.svg",
          },
        ];

        console.log("📊 Stats: Transformed data:", statCards);
        return statCards;
      } catch (error) {
        console.warn("📊 Stats: API failed, using mock data:", error);
        return mockStatCards; // Fall back to mock data on API failure
      }
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 2, // Only retry twice on failure
  });
}
