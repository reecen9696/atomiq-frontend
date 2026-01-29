import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { mockBlocks } from "@/mocks";
import { BLOCKS_POLL_INTERVAL, MAX_RECENT_BLOCKS } from "@/constants";

/**
 * Hook to fetch recent blocks
 * Uses mock data until API is implemented
 */
export function useRecentBlocks(limit: number = MAX_RECENT_BLOCKS) {
  return useQuery({
    queryKey: ["blocks", "recent", limit],
    queryFn: async () => {
      // TODO: Switch to API call when backend is ready
      // return api.blocks.getRecent(limit);

      // Using mock data for now
      return mockBlocks.slice(0, limit);
    },
    refetchInterval: BLOCKS_POLL_INTERVAL,
    staleTime: BLOCKS_POLL_INTERVAL - 1000,
  });
}
