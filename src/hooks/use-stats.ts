import { useQuery } from "@tanstack/react-query";
import { config, env } from "@/config";
import { mockStatCards } from "@/mocks";
import { logger } from "@/lib/logger";
import {
  formatNumber,
  formatPercentage,
  formatSOLWithSymbol,
} from "@/lib/utils";

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
        logger.debug("📊 Stats: Using mock data");
        return mockStatCards;
      }

      try {
        logger.api("📊 Stats: Fetching from API", `${env.apiUrl}/api/casino/stats`);

        // Use the same simple fetch approach as test-ui
        const response = await fetch(`${env.apiUrl}/api/casino/stats`);

        if (!response.ok) {
          logger.warn("📊 Stats: API returned error", { status: response.status });
          throw new Error(`HTTP ${response.status}`);
        }

        const casinoStats = await response.json();
        logger.debug("📊 Stats: Received API data", { casinoStats });

        // Transform to StatCard format like test-ui displays
        const statCards = [
          {
            id: "bets",
            title: "BETS",
            value: formatNumber(casinoStats.bet_count),
            icon: "/icons/diceicon.svg",
          },
          {
            id: "gross-rtp",
            title: "GROSS RTP",
            value: formatPercentage(casinoStats.gross_rtp, 2),
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
            value: formatSOLWithSymbol(casinoStats.total_wagered, 2),
            icon: "/icons/winicon.svg",
          },
        ];

        logger.debug("📊 Stats: Transformed data", { count: statCards.length });
        return statCards;
      } catch (error) {
        logger.warn("📊 Stats: API failed, using mock data", { error });
        return mockStatCards; // Fall back to mock data on API failure
      }
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 2, // Only retry twice on failure
  });
}
