"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createWebSocketManager } from "@/lib/sdk/websocket/manager";
import type { BlockUpdateMessage, SettlementFailedMessage } from "@/lib/sdk/websocket/manager";
import type { Block } from "@/mocks/blocks";
import { createAtomikConfig } from "@/lib/sdk";
import { env } from "@/config";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/stores/auth-store";
import { useBetTrackingStore } from "@/stores/bet-tracking-store";
import { bettingToast } from "@/lib/toast";

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
  const { revertBetAmount } = useAuthStore();
  const { getPendingBetByTransactionId, removePendingBet, cleanupOldBets } =
    useBetTrackingStore();
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
      logger.api("GET", `/blocks?limit=${limit}`, { apiUrl });

      const response = await fetch(`${apiUrl}/blocks?limit=${limit}`);
      logger.api("GET", "/blocks", { status: response.status, ok: response.ok });

      if (response.ok) {
        const data = await response.json();
        logger.debug("📦 Blocks API data received", { count: data.blocks?.length });

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
          logger.debug("📦 Transformed initial blocks", { count: initialBlocks.length });
          setState((prev) => ({ ...prev, blocks: initialBlocks }));
        }
      }
    } catch (error) {
      logger.error("Failed to fetch initial blocks", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch blocks",
      }));
    }
  }, [limit]);

  const connect = useCallback(async () => {
    logger.websocket("blocks: Starting connect process");
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Create WebSocket manager if not exists
      if (!wsManagerRef.current) {
        logger.debug("📦 Creating WebSocket manager for blocks");
        const config = createAtomikConfig();
        wsManagerRef.current = createWebSocketManager(config);
      }

      logger.websocket("blocks: Connecting to casino streams", {
        wallet: publicKey?.toBase58(),
      });
      const connection = await wsManagerRef.current.connectToCasinoStreams(
        publicKey?.toBase58(),
      );
      logger.websocket("blocks: Connection established");

      logger.websocket("blocks: Subscribing to new_block messages");
      // Subscribe to new_block messages
      const unsubscribe = connection.subscribe<BlockUpdateMessage>(
        "new_block",
        (message) => {
          logger.websocket("new_block", {
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

      // Subscribe to settlement_failed messages for toast notifications
      const unsubSettlement = connection.subscribe(
        "settlement_failed",
        (raw: any) => {
          // Backend wraps the payload in a `message` envelope
          const message = raw.message ?? raw;

          // Only handle failures for the current user
          if (message.player_address !== publicKey?.toBase58()) return;

          logger.warn("⚠️ Settlement failed", {
            transactionId: message.transaction_id,
            errorMessage: message.error_message,
            isPermanent: message.is_permanent,
          });

          const pendingBet = getPendingBetByTransactionId(message.transaction_id);
          if (pendingBet) {
            revertBetAmount(pendingBet.amount);
            bettingToast.settlementFailed(
              pendingBet.amount,
              message.error_message,
              message.is_permanent,
            );
            removePendingBet(pendingBet.gameId);
          } else {
            // No tracked bet — still show a toast so the user knows
            const amount = typeof message.bet_amount === 'number' && message.bet_amount > 1000
              ? message.bet_amount / 1e9  // lamports
              : message.bet_amount;       // already SOL
            bettingToast.settlementFailed(
              amount,
              message.error_message,
              message.is_permanent,
            );
          }
        },
      );

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
        logger.error("📦 WebSocket blocks: Connection error", error);
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
        unsubSettlement();
        onConnect();
        onDisconnect();
        onError();
      };

      setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }));
      logger.websocket("blocks: Successfully connected and subscribed");
    } catch (error) {
      logger.error("📦 WebSocket blocks: Failed to connect", error, {
        stack: error instanceof Error ? error.stack : undefined,
      });
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
    logger.debug("📦 Re-enabling WebSocket connection for blocks");
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
