import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { config, env } from "@/config";
import { handleQueryError } from "@/lib/error-handling";
import { mockBlocks } from "@/mocks";

/**
 * Hook for fetching recent blockchain blocks with direct WebSocket updates
 * Uses test-ui pattern: direct WebSocket connection for instant updates
 *
 * @param limit - Maximum number of blocks to display
 * @returns React Query result with blocks data and live connection status
 */
export function useRecentBlocks(limit?: number) {
  const actualLimit = limit ?? config.pagination.limits.blocks;
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Always fetch data via polling - this ensures we never return undefined
  const query = useQuery({
    queryKey: ["blocks", "recent", actualLimit],
    queryFn: async () => {
      if (config.features.enableMockData) {
        return mockBlocks.slice(0, actualLimit);
      }

      try {
        const response = await api.blocks.getRecent(actualLimit);
        console.log("📦 Blocks query response:", response);
        // The API service already transforms data, so we use response.data directly
        return response.data || [];
      } catch (error) {
        console.warn("Blocks API failed, returning empty array:", error);
        return []; // Return empty array instead of throwing to prevent undefined
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

  // Direct WebSocket connection like test-ui for instant updates
  useEffect(() => {
    if (config.features.enableMockData) {
      console.log(
        "📦 WebSocket blocks: Mock data enabled, skipping WebSocket connection",
      );
      return;
    }

    console.log("📦 WebSocket blocks: Setting up direct WebSocket connection");
    setIsConnecting(true);

    const wsUrl = env.apiUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");
    const ws = new WebSocket(`${wsUrl}/ws?casino=true&blocks=true`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("📦 WebSocket blocks: Connected directly!");
      setIsLive(true);
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new_block") {
          console.log("📦 WebSocket blocks: New block received", data);

          // Transform to our Block format
          const newBlock = {
            id: `block-${data.height}-${crypto.randomUUID()}`, // Guaranteed unique ID
            blockNumber: data.height,
            hash: `${data.hash.slice(0, 8)}....${data.hash.slice(-8)}`, // Format as [8]....[8]
            transactionCount: data.tx_count,
            timestamp: new Date(data.timestamp * 1000).toLocaleTimeString(),
          };

          // Instantly update the cache like test-ui does
          queryClient.setQueryData(
            ["blocks", "recent", actualLimit],
            (oldData: any) => {
              if (!oldData) return [newBlock];

              // Check if this block already exists (by height and hash)
              const exists = oldData.some(
                (block: any) =>
                  block.blockNumber === newBlock.blockNumber &&
                  block.hash === newBlock.hash,
              );

              if (exists) {
                console.log(
                  "📦 WebSocket blocks: Block already exists, skipping duplicate",
                  newBlock.blockNumber,
                );
                return oldData;
              }

              return [newBlock, ...oldData.slice(0, actualLimit - 1)];
            },
          );
        }
      } catch (error) {
        console.error("📦 WebSocket blocks: Error parsing message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("📦 WebSocket blocks: Connection error:", error);
      setIsLive(false);
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("📦 WebSocket blocks: Connection closed");
      setIsLive(false);
      setIsConnecting(false);
    };

    return () => {
      console.log("📦 WebSocket blocks: Cleaning up connection");
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient, actualLimit]);

  return {
    ...query,
    isLive,
    isConnecting,
  };
}
