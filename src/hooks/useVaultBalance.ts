"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { solanaService } from "@/services/solana";
import { logger } from "@/lib/logger";

export function useVaultBalance() {
  const { publicKey } = useWallet();
  const { updateVaultInfo, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use local state as source of truth, not auth store
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [hasVault, setHasVault] = useState(false);

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

  // Fetch vault balance on mount and when publicKey changes
  useEffect(() => {
    fetchVaultBalance();
  }, [fetchVaultBalance]);

  // Remove automatic polling - vault balance should only update on page load or manual refresh

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
    refresh: fetchVaultBalance,
    updateLocalVaultBalance,
  };
}
