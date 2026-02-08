"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logger";

/**
 * WalletSync Component
 * Synchronizes Solana wallet state with auth store on page load
 * Handles auto-reconnection when wallet is already connected
 */
export function WalletSync() {
  const { connected, publicKey, wallet } = useWallet();
  const { isConnected, connect, disconnect, user } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // On mount, sync wallet state to auth store if wallet is already connected
    if (!hasInitialized.current && connected && publicKey) {
      const walletPublicKey = publicKey.toBase58();
      
      // If auth store doesn't match wallet, update it
      if (!isConnected || user?.publicKey !== walletPublicKey) {
        logger.debug("🔄 Syncing wallet state to auth store on mount", {
          walletPublicKey,
          walletConnected: connected,
          authConnected: isConnected,
          walletName: wallet?.adapter.name,
        });
        connect(walletPublicKey);
      }
      
      hasInitialized.current = true;
    }
    
    // Handle disconnection
    if (hasInitialized.current && !connected && isConnected) {
      logger.debug("🔄 Wallet disconnected, clearing auth store");
      disconnect();
    }
  }, [connected, publicKey, wallet, isConnected, user, connect, disconnect]);

  // This component doesn't render anything
  return null;
}
