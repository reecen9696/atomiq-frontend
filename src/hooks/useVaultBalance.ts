"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { solanaService } from "@/services/solana";
import { logger } from "@/lib/logger";

// Reconciliation configuration
const RECONCILIATION_INTERVAL = 30000; // 30 seconds
const BALANCE_DRIFT_THRESHOLD = 0.001; // 0.001 SOL threshold (absolute amount, not USD-pegged)

export function useVaultBalance() {
  const { publicKey } = useWallet();
  const { updateVaultInfo, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use local state as source of truth, not auth store
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [hasVault, setHasVault] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const lastReconciledRef = useRef<number>(0);
  const reconciliationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconciliationFnRef = useRef<() => Promise<void>>();

  const fetchVaultBalance = useCallback(async () => {
    if (!publicKey) {
      // Clear vault info when no wallet connected
      setVaultBalance(null);
      setVaultAddress("");
      setHasVault(false);
      updateVaultInfo("", 0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vaultInfo = await solanaService.getUserVaultInfo({
        user: publicKey,
        connection: solanaService.getConnection(),
      });

      if (vaultInfo.exists && vaultInfo.state) {
        const balance = Number(vaultInfo.state.solBalanceLamports || 0n) / 1e9;
        // Update local state (source of truth for display)
        setVaultBalance(balance);
        setVaultAddress(vaultInfo.address);
        setHasVault(true);
        // Also update auth store for cross-component sync
        updateVaultInfo(vaultInfo.address, balance);
      } else {
        // No vault found
        setVaultBalance(0);
        setVaultAddress("");
        setHasVault(false);
        updateVaultInfo("", 0);
      }
    } catch (err) {
      logger.error("Failed to fetch vault balance:", err);
      const errorMessage =
        (err as Error).message || "Failed to fetch vault balance";
      setError(errorMessage);
      // Default to 0 on error
      setVaultBalance(0);
      setVaultAddress("");
      setHasVault(false);
      updateVaultInfo("", 0);
    } finally {
      setLoading(false);
    }
  }, [publicKey, updateVaultInfo]);

  // Reconciliation function - fetches on-chain balance and compares with optimistic balance
  // Using useRef to store this so the interval doesn't need to be recreated
  reconciliationFnRef.current = async () => {
    // Skip if no public key, already loading, or recently reconciled
    if (!publicKey || loading) {
      return;
    }

    const now = Date.now();
    // Avoid excessive RPC calls - respect minimum interval
    if (now - lastReconciledRef.current < RECONCILIATION_INTERVAL) {
      return;
    }

    setIsReconciling(true);
    lastReconciledRef.current = now;

    try {
      const vaultInfo = await solanaService.getUserVaultInfo({
        user: publicKey,
        connection: solanaService.getConnection(),
      });

      if (vaultInfo.exists && vaultInfo.state) {
        const onChainBalance =
          Number(vaultInfo.state.solBalanceLamports || 0n) / 1e9;
        const currentOptimisticBalance = user?.vaultBalance || 0;

        // Check if balances have drifted beyond threshold
        const drift = Math.abs(onChainBalance - currentOptimisticBalance);
        if (drift > BALANCE_DRIFT_THRESHOLD) {
          logger.info(
            `Balance drift detected: ${drift.toFixed(4)} SOL. Reconciling...`,
          );
          logger.info(
            `On-chain: ${onChainBalance.toFixed(4)} SOL, Optimistic: ${currentOptimisticBalance.toFixed(4)} SOL`,
          );

          // Update to on-chain value
          setVaultBalance(onChainBalance);
          updateVaultInfo(vaultInfo.address, onChainBalance);
        }
      }
    } catch (err) {
      logger.error("Failed to reconcile balance:", err);
      // Don't update error state - this is a background operation
    } finally {
      setIsReconciling(false);
    }
  };

  // Wrapper function for manual refresh
  const reconcileBalance = useCallback(async () => {
    if (reconciliationFnRef.current) {
      await reconciliationFnRef.current();
    }
  }, []);

  // Fetch vault balance on mount and when publicKey changes
  useEffect(() => {
    fetchVaultBalance();
  }, [fetchVaultBalance]);

  // Set up periodic balance reconciliation
  useEffect(() => {
    if (!publicKey || !hasVault) {
      // Clear interval if no wallet connected or no vault
      if (reconciliationIntervalRef.current) {
        clearInterval(reconciliationIntervalRef.current);
        reconciliationIntervalRef.current = null;
      }
      return;
    }

    // Set up reconciliation interval - uses the ref to avoid recreating interval
    reconciliationIntervalRef.current = setInterval(() => {
      reconciliationFnRef.current?.();
    }, RECONCILIATION_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (reconciliationIntervalRef.current) {
        clearInterval(reconciliationIntervalRef.current);
        reconciliationIntervalRef.current = null;
      }
    };
  }, [publicKey, hasVault]);

  // Method to update vault balance - updates both local state and auth store
  const updateLocalVaultBalance = useCallback(
    (newBalance: number) => {
      setVaultBalance(newBalance);
      updateVaultInfo(vaultAddress, newBalance);
    },
    [updateVaultInfo, vaultAddress],
  );

  return {
    vaultBalance,
    vaultAddress,
    hasVault,
    loading,
    error,
    isReconciling,
    refresh: fetchVaultBalance,
    updateLocalVaultBalance,
  };
}
