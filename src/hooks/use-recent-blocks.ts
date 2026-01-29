import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { config } from "@/config";
import { handleQueryError } from "@/lib/error-handling";
import { mockBlocks } from "@/mocks";

/**
 * Hook for fetching recent blockchain blocks
 * Automatically handles loading, error states, and polling
 *
 * @param limit - Maximum number of blocks to display
 * @returns React Query result with blocks data
 */
export function useRecentBlocks(limit?: number) {
  const actualLimit = limit ?? config.pagination.limits.blocks;
  return useQuery({
    queryKey: ["blocks", "recent", actualLimit],
    queryFn: async () => {
      if (config.features.enableMockData) {
        return mockBlocks.slice(0, actualLimit);
      }

      try {
        const response = await api.blocks.getRecent(actualLimit);
        return response.data;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: config.polling.intervals.blocks,
    refetchInterval: config.polling.intervals.blocks,
    retry: (failureCount, error) => {
      // Blocks are time-sensitive, so be more lenient with retries
      if (error instanceof Error && error.message.includes("network")) {
        return failureCount < 5;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
  });
}
