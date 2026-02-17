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
  const hasCleanedStorage = useRef(false);

  // One-time cleanup of any old balance data in localStorage
  // This runs BEFORE zustand can hydrate the store
  useEffect(() => {
    if (!hasCleanedStorage.current) {
      try {
        const storage = localStorage.getItem("auth-storage");
        if (storage) {
          const parsed = JSON.parse(storage);
          
          // Check if there's old balance data
          if (parsed?.state?.user) {
            const user = parsed.state.user;
            const hasOldBalanceData = 
              user.balance !== undefined || 
              user.vaultBalance !== undefined || 
              user.vaultAddress !== undefined ||
              user.hasVault !== undefined;
            
            if (hasOldBalanceData) {
              logger.debug("🧹 Found old balance data in localStorage");
              logger.debug("Old data:", { ...user });
              
              // Save the publicKey before clearing
              const savedPublicKey = user.publicKey;
              const savedIsConnected = parsed.state.isConnected;
              
              // Completely rebuild the storage without balance fields
              const cleanStorage = {
                state: {
                  isConnected: savedIsConnected,
                  user: savedPublicKey ? { publicKey: savedPublicKey } : null,
                  isConnecting: false,
                  isWalletModalOpen: false,
                },
                version: parsed.version || 0,
              };
              
              localStorage.setItem("auth-storage", JSON.stringify(cleanStorage));
              logger.debug("✅ Rebuilt localStorage without balance data");
            }
          }
        }
      } catch (error) {
        logger.warn("Failed to clean localStorage", { error });
      }
      
      hasCleanedStorage.current = true;
    }
  }, []);

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
