"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createWebSocketManager } from "@/lib/sdk/websocket/manager";
import type { BlockUpdateMessage } from "@/lib/sdk/websocket/manager";
import type { Block } from "@/mocks/blocks";
import { createAtomikConfig } from "@/lib/sdk";
import { env } from "@/config";

interface UseWebSocketBlocksState {
  blocks: Block[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface UseWebSocketBlocksActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export interface UseWebSocketBlocksResult
  extends UseWebSocketBlocksState, UseWebSocketBlocksActions {}

/**
 * Transform WebSocket block message to frontend Block interface
 */
function transformWebSocketBlock(message: BlockUpdateMessage): Block {
  return {
    id: `ws-block-${message.height}-${message.timestamp}`,
    blockNumber: message.height,
    hash: formatHash(message.hash),
    transactionCount: message.tx_count,
    timestamp: formatRelativeTime(message.timestamp),
  };
}

/**
 * Format hash to show first 8 and last 8 characters
 */
function formatHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

/**
 * Format relative time like test-ui
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const blockTime = timestamp * 1000; // Convert to milliseconds
  const secondsAgo = Math.floor((now - blockTime) / 1000);

  if (secondsAgo < 60) {
    return `${secondsAgo} secs ago`;
  } else if (secondsAgo < 3600) {
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo} mins ago`;
  } else {
    const hoursAgo = Math.floor(secondsAgo / 3600);
    return `${hoursAgo} hours ago`;
  }
}

/**
 * Hook for managing WebSocket blocks connection and live block updates
 */
export function useWebSocketBlocks(
  limit: number = 5,
): UseWebSocketBlocksResult {
  const { publicKey } = useWallet();
  const [state, setState] = useState<UseWebSocketBlocksState>({
    blocks: [],
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const wsManagerRef = useRef<ReturnType<typeof createWebSocketManager> | null>(
    null,
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch initial blocks like test-ui does
  const fetchInitialBlocks = useCallback(async () => {
    try {
      const apiUrl = env.apiUrl;
      console.log(
        "🔍 Fetching initial blocks from:",
        `${apiUrl}/blocks?limit=${limit}`,
      );

      const response = await fetch(`${apiUrl}/blocks?limit=${limit}`);
      console.log("📦 Blocks API response:", response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Blocks API data:", data);

        if (data.blocks && Array.isArray(data.blocks)) {
          const initialBlocks = data.blocks.map((block: any) => ({
            id: `initial-block-${block.height}`,
            blockNumber: block.height,
            hash: formatHash(block.hash),
            transactionCount: block.tx_count || 0,
            timestamp: formatRelativeTime(
              block.time
                ? new Date(block.time).getTime() / 1000
                : Date.now() / 1000,
            ),
          }));
          console.log("📦 Transformed initial blocks:", initialBlocks);
          setState((prev) => ({ ...prev, blocks: initialBlocks }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial blocks:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch blocks",
      }));
    }
  }, [limit]);

  const connect = useCallback(async () => {
    console.log("📦 WebSocket blocks: Starting connect process...");
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      console.log("📦 WebSocket blocks: Creating WebSocket manager...");
      // Create WebSocket manager if not exists
      if (!wsManagerRef.current) {
        console.log("📦 WebSocket blocks: Creating new Atomik config...");
        const config = createAtomikConfig();
        console.log("📦 WebSocket blocks: Config created:", config);
        wsManagerRef.current = createWebSocketManager(config);
        console.log(
          "📦 WebSocket blocks: Manager created:",
          wsManagerRef.current,
        );
      }

      console.log("📦 WebSocket blocks: Connecting to casino streams...");
      console.log(
        "📦 WebSocket blocks: Using wallet public key:",
        publicKey?.toBase58(),
      );
      const connection = await wsManagerRef.current.connectToCasinoStreams(
        publicKey?.toBase58(),
      );
      console.log("📦 WebSocket blocks: Connection established:", connection);

      console.log("📦 WebSocket blocks: Subscribing to new_block messages...");
      // Subscribe to new_block messages
      const unsubscribe = connection.subscribe<BlockUpdateMessage>(
        "new_block",
        (message) => {
          console.log("📦 WebSocket new block:", {
            height: message.height,
            hash: message.hash.slice(0, 8) + "...",
            txCount: message.tx_count,
            timestamp: new Date(message.timestamp * 1000).toISOString(),
          });

          const transformedBlock = transformWebSocketBlock(message);
          setState((prev) => ({
            ...prev,
            blocks: [transformedBlock, ...prev.blocks].slice(0, limit),
          }));
        },
      );

      unsubscribeRef.current = unsubscribe;

      // Set up connection status handlers
      const onConnect = connection.onConnect(() => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
        }));
      });

      const onDisconnect = connection.onDisconnect(() => {
        setState((prev) => ({ ...prev, isConnected: false }));
      });

      const onError = connection.onError((error) => {
        console.error("📦 WebSocket blocks: Connection error:", error);
        setState((prev) => ({
          ...prev,
          error: "WebSocket connection error",
          isConnecting: false,
          isConnected: false,
        }));
      });

      // Store cleanup functions
      const originalUnsubscribe = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        originalUnsubscribe?.();
        onConnect();
        onDisconnect();
        onError();
      };

      setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }));
      console.log(
        "📦 WebSocket blocks: Successfully connected and subscribed!",
      );
    } catch (error) {
      console.error("📦 WebSocket blocks: Failed to connect:", error);
      console.error(
        "📦 WebSocket blocks: Error details:",
        error instanceof Error ? error.stack : "No stack",
      );
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
        isConnecting: false,
        isConnected: false,
      }));
    }
  }, [publicKey, limit]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setState((prev) => ({ ...prev, isConnected: false, isConnecting: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Auto-connect when wallet changes - simplified approach like test-ui
  useEffect(() => {
    fetchInitialBlocks(); // Load initial blocks first
    console.log("📦 WebSocket blocks: Re-enabling WebSocket connection");
    connect();
    return () => disconnect();
  }, [fetchInitialBlocks, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnectAll();
        wsManagerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    clearError,
  };
}
