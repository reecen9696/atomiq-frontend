"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logger";

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { updateBalance } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / 1e9;
      setBalance(sol);
      updateBalance(sol);
    } catch (err) {
      logger.error("Failed to fetch balance:", err);

      // Check if it's a 403 or rate limit error
      const errorMessage = (err as Error).message || "Failed to fetch balance";
      if (errorMessage.includes("403") || errorMessage.includes("rate limit")) {
        setError(
          "RPC endpoint rate limited. Balance will retry automatically.",
        );
      } else {
        setError(errorMessage);
      }
      
      // Default balance to 0 when cannot connect
      setBalance(0);
      updateBalance(0);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, updateBalance]);

  // Fetch balance on mount and when publicKey changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Remove automatic polling - balance should only update on page load or manual refresh

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
