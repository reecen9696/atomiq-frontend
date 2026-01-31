"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { solanaService } from "@/services/solana";

export function useVaultBalance() {
  const { publicKey } = useWallet();
  const { updateVaultInfo, user } = useAuthStore();
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVault, setHasVault] = useState(false);

  const fetchVaultBalance = useCallback(async () => {
    if (!publicKey) {
      setVaultBalance(null);
      setVaultAddress("");
      setHasVault(false);
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
        setVaultBalance(balance);
        setVaultAddress(vaultInfo.address);
        setHasVault(true);
        updateVaultInfo(vaultInfo.address, balance);
      } else {
        setVaultBalance(null);
        setVaultAddress("");
        setHasVault(false);
      }
    } catch (err) {
      console.error("Failed to fetch vault balance:", err);
      const errorMessage = (err as Error).message || "Failed to fetch vault balance";
      setError(errorMessage);
      setVaultBalance(null);
      setVaultAddress("");
      setHasVault(false);
    } finally {
      setLoading(false);
    }
  }, [publicKey, updateVaultInfo]);

  // Fetch vault balance on mount and when publicKey changes
  useEffect(() => {
    fetchVaultBalance();
  }, [fetchVaultBalance]);

  // Refresh vault balance every 10 seconds
  useEffect(() => {
    if (!publicKey) return;

    const interval = setInterval(() => {
      fetchVaultBalance();
    }, 10000);

    return () => clearInterval(interval);
  }, [publicKey, fetchVaultBalance]);

  return {
    vaultBalance: vaultBalance ?? user?.vaultBalance ?? null,
    vaultAddress: vaultAddress || user?.vaultAddress || "",
    hasVault: hasVault || user?.hasVault || false,
    loading,
    error,
    refresh: fetchVaultBalance,
  };
}