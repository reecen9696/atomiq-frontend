import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { config } from "@/config";
import { handleQueryError } from "@/lib/error-handling";
import { mockWinners } from "@/mocks";
import { env } from "@/config/env";
import { Winner } from "@/types/winner";
import { toast } from "@/lib/toast";

/**
 * Hook for fetching recent winners with direct WebSocket updates
 * Uses test-ui pattern: direct WebSocket connection for instant updates
 *
 * @param limit - Maximum number of winners to display
 * @returns React Query result with winners data and live connection status
 */
export function useRecentWins(limit?: number) {
  const actualLimit = limit ?? config.pagination.limits.winners;
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const hasShownErrorToast = useRef(false);

  // Always fetch data via polling - this ensures we never return undefined
  const query = useQuery({
    queryKey: ["winners", "recent", actualLimit],
    queryFn: async () => {
      if (config.features.enableMockData) {
        return mockWinners.slice(0, actualLimit);
      }

      try {
        console.log("🎰 Fetching recent wins from API...");
        const response = await api.winners.getRecent(actualLimit);
        console.log("🎰 Recent wins response:", response.data);
        hasShownErrorToast.current = false; // Reset on success
        return response.data || []; // Ensure we never return undefined
      } catch (error) {
        console.error("🎰 Winners API failed:", error);
        if (!hasShownErrorToast.current) {
          toast.error("Cannot connect to server", "Failed to load recent wins");
          hasShownErrorToast.current = true;
        }
        return []; // Return empty array instead of throwing to prevent undefined
      }
    },
    staleTime: 0, // Always consider data stale to refetch
    refetchInterval: config.polling.intervals.winners,
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes("validation")) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Direct WebSocket connection like test-ui for instant updates
  useEffect(() => {
    if (config.features.enableMockData) {
      console.log(
        "🎰 WebSocket wins: Mock data enabled, skipping WebSocket connection",
      );
      return;
    }

    console.log("🎰 WebSocket wins: Setting up direct WebSocket connection");
    setIsConnecting(true);

    const wsUrl = env.apiUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");
    const ws = new WebSocket(`${wsUrl}/ws?casino=true&wins=true`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🎰 WebSocket wins: Connected directly!");
      setIsLive(true);
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "casino_win" ||
          (data.type === "game_settled" && data.amount_won > 0)
        ) {
          console.log("🎰 WebSocket wins: New win received", data);

          // Transform to our Winner format
          const newWin: Winner = {
            id: `win-${data.tx_id || data.id || "unknown"}-${crypto.randomUUID()}`, // Guaranteed unique ID
            gameName:
              data.game_type === "coinflip"
                ? "Coin Flip"
                : data.game_type || data.game || "Unknown",
            gameImage: "/games/coinflip.png",
            amount: `${(data.amount_won || data.amount || 0).toFixed(4)} ${data.currency || "SOL"}`,
            timestamp: new Date(
              (data.timestamp || Date.now()) * 1000,
            ).toISOString(),
          };

          // Instantly update the cache like test-ui does
          queryClient.setQueryData(
            ["winners", "recent", actualLimit],
            (oldData: Winner[] | undefined) => {
              if (!oldData) return [newWin];

              // Check if this win already exists (by transaction ID and amount)
              const exists = oldData.some(
                (win: Winner) =>
                  win.id.includes(data.tx_id || data.id || "unknown") &&
                  win.amount === newWin.amount,
              );

              if (exists) {
                console.log(
                  "🎰 WebSocket wins: Win already exists, skipping duplicate",
                  data.tx_id || data.id,
                );
                return oldData;
              }

              return [newWin, ...oldData.slice(0, actualLimit - 1)];
            },
          );
        }
      } catch (error) {
        console.error("🎰 WebSocket wins: Error parsing message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("🎰 WebSocket wins: Connection error:", error);
      setIsLive(false);
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("🎰 WebSocket wins: Connection closed");
      setIsLive(false);
      setIsConnecting(false);
    };

    return () => {
      console.log("🎰 WebSocket wins: Cleaning up connection");
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
