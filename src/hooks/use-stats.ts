import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { mockStatCards } from "@/mocks";
import { STATS_POLL_INTERVAL } from "@/constants";

/**
 * Hook to fetch current stats
 * Uses mock data until WebSocket is implemented
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      // TODO: Switch to WebSocket subscription when backend is ready
      // return api.stats.getCurrent();

      // Using mock data for now
      return mockStatCards;
    },
    refetchInterval: STATS_POLL_INTERVAL,
    staleTime: STATS_POLL_INTERVAL - 1000,
  });
}
