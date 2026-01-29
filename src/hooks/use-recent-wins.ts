import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { mockWinners } from "@/mocks";
import { MAX_RECENT_WINS } from "@/constants";

/**
 * Hook to fetch recent winners
 * Uses mock data until API is implemented
 */
export function useRecentWins(limit: number = MAX_RECENT_WINS) {
  return useQuery({
    queryKey: ["winners", "recent", limit],
    queryFn: async () => {
      // TODO: Switch to API call when backend is ready
      // return api.winners.getRecent(limit);

      // Using mock data for now
      return mockWinners.slice(0, limit);
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 3000,
  });
}
