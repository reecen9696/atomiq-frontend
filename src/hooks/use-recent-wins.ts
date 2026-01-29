import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { config } from "@/config";
import { handleQueryError } from "@/lib/error-handling";
import { mockWinners } from "@/mocks";

/**
 * Hook for fetching recent winners
 * Automatically handles loading, error states, and polling
 *
 * @param limit - Maximum number of winners to display
 * @returns React Query result with winners data
 */
export function useRecentWins(limit?: number) {
  const actualLimit = limit ?? config.pagination.limits.winners;
  return useQuery({
    queryKey: ["winners", "recent", actualLimit],
    queryFn: async () => {
      if (config.features.enableMockData) {
        return mockWinners.slice(0, actualLimit);
      }

      try {
        const response = await api.winners.getRecent(actualLimit);
        return response.data;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: config.polling.intervals.winners,
    refetchInterval: config.polling.intervals.winners,
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes("validation")) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
