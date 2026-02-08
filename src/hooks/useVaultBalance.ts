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

  const fetchVaultBalance = useCallback(async () => {
    if (!publicKey) {
      // Clear vault info in auth store when no wallet connected (only if different)
      if (user?.vaultBalance !== 0 || user?.vaultAddress !== "") {
        updateVaultInfo("", 0);
      }
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
        // Only update auth store if balance or address changed
        if (
          user?.vaultBalance !== balance ||
          user?.vaultAddress !== vaultInfo.address
        ) {
          updateVaultInfo(vaultInfo.address, balance);
        }
      } else {
        // No vault found - clear auth store (only if different)
        if (user?.vaultBalance !== 0 || user?.vaultAddress !== "") {
          updateVaultInfo("", 0);
        }
      }
    } catch (err) {
      logger.error("Failed to fetch vault balance:", err);
      const errorMessage =
        (err as Error).message || "Failed to fetch vault balance";
      setError(errorMessage);
      // Clear vault info on error (only if different)
      if (user?.vaultBalance !== 0 || user?.vaultAddress !== "") {
        updateVaultInfo("", 0);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, updateVaultInfo]);

  // Fetch vault balance on mount and when publicKey changes
  useEffect(() => {
    fetchVaultBalance();
  }, [fetchVaultBalance]);

  // Remove automatic polling - vault balance should only update on page load or manual refresh

  // Method to update vault balance - now just updates auth store
  const updateLocalVaultBalance = useCallback(
    (newBalance: number) => {
      const vaultAddress = user?.vaultAddress || "";
      updateVaultInfo(vaultAddress, newBalance);
    },
    [updateVaultInfo, user?.vaultAddress],
  );

  return {
    vaultBalance: user?.vaultBalance ?? null,
    vaultAddress: user?.vaultAddress ?? "",
    hasVault: user?.hasVault ?? false,
    loading,
    error,
    refresh: fetchVaultBalance,
    updateLocalVaultBalance,
  };
}
