"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useBetTrackingStore } from "@/stores/bet-tracking-store";
import { logger } from "@/lib/logger";
import { solanaService } from "@/services/solana";
import { toast, bettingToast } from "@/lib/toast";
import { env } from "@/config";

/**
 * WalletSync Component
 * Synchronizes Solana wallet state with auth store on page load
 * Handles auto-reconnection and automatic onboarding
 */
export function WalletSync() {
  const { connected, publicKey, wallet, sendTransaction } = useWallet();
  const {
    isConnected,
    connect,
    disconnect,
    user,
    updateVaultInfo,
    setOnboarding,
    setHasCompletedInitialLoad,
    hasCompletedInitialLoad,
  } = useAuthStore();
  const hasInitialized = useRef(false);
  const hasCleanedStorage = useRef(false);
  const hasCompletedOnboarding = useRef(false);
  const hasSetInitialTimeout = useRef(false);

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

              localStorage.setItem(
                "auth-storage",
                JSON.stringify(cleanStorage),
              );
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

  // Set a timeout for initial wallet connection check
  // If no wallet connects within 2 seconds, mark initial load as complete
  useEffect(() => {
    if (!hasSetInitialTimeout.current && !hasCompletedInitialLoad) {
      hasSetInitialTimeout.current = true;

      const timeout = setTimeout(() => {
        // Only mark as complete if we haven't started onboarding
        if (!connected && !hasCompletedOnboarding.current) {
          logger.debug(
            "⏱️ No wallet auto-connected, marking initial load complete",
          );
          setHasCompletedInitialLoad(true);
        }
      }, 3000); // Give wallet 3 seconds to auto-connect

      return () => clearTimeout(timeout);
    }
  }, [connected, hasCompletedInitialLoad, setHasCompletedInitialLoad]);

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
      hasCompletedOnboarding.current = false;
    }
  }, [connected, publicKey, wallet, isConnected, user, connect, disconnect]);

  // Automatic onboarding when wallet connects
  useEffect(() => {
    if (
      !connected ||
      !publicKey ||
      !sendTransaction ||
      hasCompletedOnboarding.current
    ) {
      return;
    }

    const performOnboarding = async () => {
      try {
        setOnboarding(true);
        logger.debug("🚀 Starting automatic onboarding");

        // Check if vault exists
        const vaultInfo = await solanaService.getUserVaultInfo({
          user: publicKey,
          connection: solanaService.getConnection(),
        });

        if (vaultInfo.exists) {
          logger.debug("✅ Vault already exists, skipping creation");
          const vaultBalance =
            Number(vaultInfo.state?.solBalanceLamports || 0n) / 1e9;
          updateVaultInfo(vaultInfo.address, vaultBalance);
          hasCompletedOnboarding.current = true;
          setOnboarding(false);
          setHasCompletedInitialLoad(true);
          return;
        }

        // Create vault automatically
        logger.debug("🏦 Creating vault automatically");
        const { signature, vaultPda } = await solanaService.initializeUserVault(
          {
            user: publicKey,
            connection: solanaService.getConnection(),
            sendTransaction,
          },
        );

        logger.debug("✅ Vault created", { signature, vaultPda });

        // Update vault info
        const updatedVaultInfo = await solanaService.getUserVaultInfo({
          user: publicKey,
          connection: solanaService.getConnection(),
        });

        if (updatedVaultInfo.exists) {
          const vaultBalance =
            Number(updatedVaultInfo.state?.solBalanceLamports || 0n) / 1e9;
          updateVaultInfo(updatedVaultInfo.address, vaultBalance);
        }

        // Create play session with 5,000 SOL automatically
        logger.debug("🎮 Creating initial play session");
        const sessionResult = await solanaService.approveAllowanceSol({
          user: publicKey,
          connection: solanaService.getConnection(),
          sendTransaction,
          amountLamports: BigInt(5000 * 1_000_000_000),
          durationSeconds: BigInt(2592000),
        });

        if (sessionResult.signature) {
          logger.debug("✅ Play session created", {
            signature: sessionResult.signature,
          });
          // Save play session immediately so game pages can use it
          const sessionData = {
            allowancePda: sessionResult.allowancePda || "",
            expiresAt: Math.floor(Date.now() / 1000) + 2592000,
            nonce: 0,
          };
          const storageKey = `atomik:playSession:${publicKey.toBase58()}`;
          localStorage.setItem(storageKey, JSON.stringify(sessionData));
          window.dispatchEvent(
            new CustomEvent("playSessionCreated", { detail: sessionData }),
          );
          toast.success("Wallet Ready", "Your wallet is now ready for gaming!");
        }

        hasCompletedOnboarding.current = true;
      } catch (error) {
        logger.error("❌ Automatic onboarding failed", error);
        toast.error(
          "Setup Failed",
          "Please try creating your vault manually from the wallet menu",
        );
      } finally {
        setOnboarding(false);
        setHasCompletedInitialLoad(true);
      }
    };

    // Delay onboarding slightly to ensure wallet is fully ready
    const timer = setTimeout(performOnboarding, 1000);
    return () => clearTimeout(timer);
  }, [
    connected,
    publicKey,
    sendTransaction,
    setOnboarding,
    updateVaultInfo,
    setHasCompletedInitialLoad,
  ]);

  // Global WebSocket listener for settlement failures
  // This runs on every page since WalletSync is in the root layout
  useEffect(() => {
    if (!connected || !publicKey) return;

    const walletAddress = publicKey.toBase58();
    const wsUrl = env.apiUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");
    const ws = new WebSocket(
      `${wsUrl}/ws?settlements=true&wallet_address=${encodeURIComponent(walletAddress)}`,
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Unwrap envelope: backend sends {type, message: {...actual data...}}
        const msg = data.message ?? data;

        if (
          (data.type === "settlement_failed" ||
            msg.type === "settlement_failed") &&
          msg.player_address === walletAddress
        ) {
          logger.warn("⚠️ Settlement failed (global)", {
            transactionId: msg.transaction_id,
            errorMessage: msg.error_message,
            isPermanent: msg.is_permanent,
          });

          const { getPendingBetByTransactionId, removePendingBet } =
            useBetTrackingStore.getState();
          const { revertBetAmount } = useAuthStore.getState();

          const pendingBet = getPendingBetByTransactionId(msg.transaction_id);
          if (pendingBet) {
            revertBetAmount(pendingBet.amount);
            bettingToast.settlementFailed(
              pendingBet.amount,
              msg.error_message,
              msg.is_permanent,
            );
            removePendingBet(pendingBet.gameId);
          } else {
            // No tracked bet — still notify the user
            const amount =
              typeof msg.bet_amount === "number" && msg.bet_amount > 1000
                ? msg.bet_amount / 1e9
                : msg.bet_amount;
            bettingToast.settlementFailed(
              amount,
              msg.error_message,
              msg.is_permanent,
            );
          }
        }
      } catch {
        // Ignore parse errors from heartbeat or other messages
      }
    };

    ws.onerror = () => {
      logger.warn("⚠️ Settlement WS error");
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [connected, publicKey]);

  // This component doesn't render anything
  return null;
}
