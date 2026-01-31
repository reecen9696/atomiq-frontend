"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AtomikWebSocketManager, WebSocketConnection } from "../index";

export interface CasinoStats {
  totalGames: number;
  totalVolume: string;
  activeUsers: number;
  headsWins?: number;
  tailsWins?: number;
}

export interface RecentWin {
  gameId: string;
  outcome: "heads" | "tails";
  amount: number;
  playerPubkey: string;
  timestamp: string;
}

export interface BlockUpdate {
  slot: number;
  blockTime: number;
  blockhash: string;
}

export interface UseWebSocketState {
  // Connection status
  connected: boolean;
  connecting: boolean;

  // Live data
  casinoStats: CasinoStats | null;
  recentWins: RecentWin[];
  latestBlock: BlockUpdate | null;

  // Error state
  error: string | null;
}

export interface UseWebSocketActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;

  // State management
  clearError: () => void;
  reset: () => void;
}

export interface UseWebSocketResult
  extends UseWebSocketState, UseWebSocketActions {}

/**
 * React hook for managing WebSocket connections and live casino data
 */
export function useWebSocket(
  wsManager: AtomikWebSocketManager,
  autoConnect = true,
): UseWebSocketResult {
  const [state, setState] = useState<UseWebSocketState>({
    connected: false,
    connecting: false,
    casinoStats: null,
    recentWins: [],
    latestBlock: null,
    error: null,
  });

  const connectionRef = useRef<WebSocketConnection | null>(null);
  const unsubscribeFnsRef = useRef<(() => void)[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      // Connect to casino stream
      const connection = await wsManager.connectToCasinoStreams();
      connectionRef.current = connection;

      // Clear previous subscriptions
      unsubscribeFnsRef.current.forEach((fn) => fn());
      unsubscribeFnsRef.current = [];

      // Subscribe to casino stats
      const unsubStats = connection.subscribe<CasinoStats>(
        "casino_stats",
        (data) => {
          setState((prev) => ({ ...prev, casinoStats: data }));
        },
      );

      // Subscribe to recent wins
      const unsubWins = connection.subscribe<RecentWin>(
        "casino_win",
        (data) => {
          setState((prev) => ({
            ...prev,
            recentWins: [data, ...prev.recentWins.slice(0, 9)], // Keep last 10 wins
          }));
        },
      );

      // Subscribe to block updates
      const unsubBlocks = connection.subscribe<BlockUpdate>(
        "new_block",
        (data) => {
          setState((prev) => ({ ...prev, latestBlock: data }));
        },
      );

      // Store unsubscribe functions
      unsubscribeFnsRef.current = [unsubStats, unsubWins, unsubBlocks];

      // Set up connection event handlers
      const connectUnsub = connection.onConnect(() => {
        setState((prev) => ({ ...prev, connected: true, connecting: false }));
      });

      const disconnectUnsub = connection.onDisconnect(() => {
        setState((prev) => ({ ...prev, connected: false }));
      });

      const errorUnsub = connection.onError(() => {
        setState((prev) => ({
          ...prev,
          error: "WebSocket connection error",
          connecting: false,
        }));
      });

      unsubscribeFnsRef.current.push(connectUnsub, disconnectUnsub, errorUnsub);

      setState((prev) => ({ ...prev, connected: true, connecting: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message || "Failed to connect to WebSocket",
        connecting: false,
        connected: false,
      }));
    }
  }, [wsManager]);

  const disconnect = useCallback(() => {
    // Unsubscribe from all events
    unsubscribeFnsRef.current.forEach((fn) => fn());
    unsubscribeFnsRef.current = [];

    // Disconnect all connections
    wsManager.disconnectAll();
    connectionRef.current = null;

    setState((prev) => ({ ...prev, connected: false, connecting: false }));
  }, [wsManager]);

  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    await connect();
  }, [connect, disconnect]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    disconnect();
    setState({
      connected: false,
      connecting: false,
      casinoStats: null,
      recentWins: [],
      latestBlock: null,
      error: null,
    });
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    clearError,
    reset,
  };
}
