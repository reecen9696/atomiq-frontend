"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { solanaService } from "@/services/solana";
import { logger } from "@/lib/logger";
import { getInFlightTotal, getUnsettledPnL } from "@/hooks/useBetGuard";

// Reconciliation configuration
const RECONCILIATION_INTERVAL = 30000; // 30 seconds
const BALANCE_DRIFT_THRESHOLD = 0.001; // 0.001 SOL threshold (absolute amount, not USD-pegged)

export function useVaultBalance() {
  const { publicKey } = useWallet();
  const { updateVaultInfo, user, setRpcAvailable } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVault, setHasVault] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const lastReconciledRef = useRef<number>(0);
  const reconciliationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconciliationFnRef = useRef<() => Promise<void>>(undefined);
  const reconcilingInProgressRef = useRef<boolean>(false);

  // Use auth store as single source of truth for balance display
  // This way processBetOutcome, revertBetAmount, deposits all update the same value
  const vaultBalance = user?.vaultBalance ?? null;
  const vaultAddress = user?.vaultAddress ?? "";

  const fetchVaultBalance = useCallback(async () => {
    if (!publicKey) {
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
        setHasVault(true);
        // Single source of truth: auth store
        updateVaultInfo(vaultInfo.address, balance);
        setRpcAvailable(true);
      } else {
        setHasVault(false);
        updateVaultInfo("", 0);
      }
    } catch (err) {
      logger.error("Failed to fetch vault balance:", err);
      const errorMessage =
        (err as Error).message || "Failed to fetch vault balance";
      setError(errorMessage);

      const isTransient =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("403") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("timeout");

      if (isTransient) {
        // Keep existing vault state on transient errors — don't hide the balance
        // The user's vault doesn't stop existing just because devnet is slow
        logger.warn("Transient RPC error — keeping last known vault state");
        setRpcAvailable(false);
      } else {
        // Only reset vault state for genuine "no vault" errors
        setHasVault(false);
        updateVaultInfo("", 0);
      }
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

    // Prevent concurrent reconciliation attempts
    if (reconcilingInProgressRef.current) {
      return;
    }

    const now = Date.now();
    // Avoid excessive RPC calls - respect minimum interval
    if (now - lastReconciledRef.current < RECONCILIATION_INTERVAL) {
      return;
    }

    reconcilingInProgressRef.current = true;
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

        // The optimistic balance reflects:
        //   optimistic = onChain - inFlight + unsettledPnL
        // where inFlight = bets deducted but not yet resolved,
        // and unsettledPnL = net P&L from resolved bets not yet on-chain.
        //
        // To check for genuine drift (deposits, withdrawals, on-chain
        // settlement applying), we compute what on-chain SHOULD be:
        //   expectedOnChain = optimistic + inFlight - unsettledPnL
        // If actual on-chain differs, it's a real event (deposit, settlement).
        const inFlightAmount = getInFlightTotal();
        const unsettledPnL = getUnsettledPnL();
        const expectedOnChain =
          currentOptimisticBalance + inFlightAmount - unsettledPnL;

        const adjustedDrift = Math.abs(onChainBalance - expectedOnChain);
        if (adjustedDrift > BALANCE_DRIFT_THRESHOLD) {
          // Genuine drift detected (deposit, withdrawal, or settlement).
          // Recompute optimistic = onChain - inFlight + unsettledPnL
          const reconciledBalance = Math.max(
            0,
            onChainBalance - inFlightAmount + unsettledPnL,
          );
          logger.info(
            `Balance reconciliation: on-chain=${onChainBalance.toFixed(4)}, ` +
              `optimistic=${currentOptimisticBalance.toFixed(4)}, ` +
              `in-flight=${inFlightAmount.toFixed(4)}, ` +
              `unsettled-pnl=${unsettledPnL.toFixed(4)}, ` +
              `reconciled=${reconciledBalance.toFixed(4)} SOL`,
          );
          updateVaultInfo(vaultInfo.address, reconciledBalance);
        }
      }
    } catch (err) {
      logger.error("Failed to reconcile balance:", err);
      // Don't update error state - this is a background operation
    } finally {
      reconcilingInProgressRef.current = false;
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

  // Method to update vault balance optimistically
  const updateLocalVaultBalance = useCallback(
    (newBalance: number) => {
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
    reconcile: reconcileBalance,
    updateLocalVaultBalance,
  };
}
