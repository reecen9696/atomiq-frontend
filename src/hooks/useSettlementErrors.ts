"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useBetTrackingStore } from "@/stores/bet-tracking-store";
import { createWebSocketManager } from "@/lib/sdk/websocket/manager";
import type { SettlementFailedMessage } from "@/lib/sdk/websocket/manager";
import { bettingToast } from "@/lib/toast";
import { createAtomikConfig } from "@/lib/sdk";

export function useSettlementErrors() {
  const { publicKey } = useWallet();
  const { revertBetAmount } = useAuthStore();
  const { getPendingBetByTransactionId, removePendingBet, cleanupOldBets } = useBetTrackingStore();
  const wsManagerRef = useRef<ReturnType<typeof createWebSocketManager> | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const initializeWebSocket = async () => {
      try {
        // Create WebSocket manager if not exists
        if (!wsManagerRef.current) {
          const config = createAtomikConfig();
          wsManagerRef.current = createWebSocketManager(config);
        }

        const connection = await wsManagerRef.current.connectToCasinoStreams(
          publicKey?.toBase58()
        );

        // Subscribe to settlement failures
        const unsubscribe = connection.subscribe<SettlementFailedMessage>(
          "settlement_failed",
          (message) => {
            console.log("📨 WebSocket message: settlement_failed", {
              transactionId: message.transaction_id,
              playerAddress: message.player_address,
              currentWallet: publicKey?.toBase58(),
              timestamp: message.timestamp
            });
            handleSettlementFailure(message);
          }
        );

        // Cleanup old pending bets periodically
        const cleanupInterval = setInterval(cleanupOldBets, 60000); // Every minute

        return () => {
          unsubscribe();
          clearInterval(cleanupInterval);
        };
      } catch (error) {
        console.error("Failed to initialize settlement error handling:", error);
      }
    };

    const cleanup = initializeWebSocket();

    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [publicKey, cleanupOldBets]);

  const handleSettlementFailure = (message: SettlementFailedMessage) => {
    console.log("🔍 Settlement failure message:", {
      transactionId: message.transaction_id,
      playerAddress: message.player_address,
      currentWallet: publicKey?.toBase58(),
      isForCurrentUser: message.player_address === publicKey?.toBase58(),
      betAmount: message.bet_amount,
      errorMessage: message.error_message,
      isPermanent: message.is_permanent
    });

    // Only handle failures for the current user
    if (message.player_address !== publicKey?.toBase58()) {
      console.log("⏭️ Skipping settlement failure - not for current user");
      return;
    }

    // Find the pending bet that matches this transaction
    const pendingBet = getPendingBetByTransactionId(message.transaction_id);
    
    if (!pendingBet) {
      console.warn("⚠️ No pending bet found for transaction:", message.transaction_id);
      return;
    }

    console.log("🔄 Processing settlement failure:", {
      gameId: pendingBet.gameId,
      betAmount: pendingBet.amount,
      revertAmount: pendingBet.amount,
      errorType: message.is_permanent ? "permanent" : "retry"
    });

    // Revert the balance by the exact bet amount
    revertBetAmount(pendingBet.amount);

    // Show error notification
    bettingToast.settlementFailed(
      pendingBet.amount,
      message.error_message,
      message.is_permanent
    );

    // Remove the pending bet since we've handled the failure
    removePendingBet(pendingBet.gameId);
    
    console.log("✅ Settlement failure processed successfully");
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnectAll();
        wsManagerRef.current = null;
      }
    };
  }, []);
}