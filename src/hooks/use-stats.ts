import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { config } from "@/config";
import { handleQueryError } from "@/lib/error-handling";
import { mockStatCards } from "@/mocks";

/**
 * Hook for fetching current statistics
 * Automatically handles loading, error states, and polling
 *
 * @returns React Query result with stats data
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats", "current"],
    queryFn: async () => {
      if (config.features.enableMockData) {
        return mockStatCards;
      }

      try {
        const response = await api.stats.getCurrent();
        return response.data;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: config.polling.intervals.stats,
    refetchInterval: config.polling.intervals.stats,
    retry: (failureCount, error) => {
      // Be more aggressive with stats polling since it's critical
      if (error instanceof Error && error.message.includes("timeout")) {
        return failureCount < 5;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
