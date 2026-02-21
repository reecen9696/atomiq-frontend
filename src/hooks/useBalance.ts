"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logger";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { updateBalance, setRpcAvailable, rpcAvailable } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRpcToast = useRef(false);

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
      retryCountRef.current = 0; // Reset retries on success
      if (!rpcAvailable) {
        setRpcAvailable(true);
        hasShownRpcToast.current = false;
      }
    } catch (err) {
      logger.error("Failed to fetch balance:", err);

      const errorMessage = (err as Error).message || "Failed to fetch balance";
      const isTransient =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("403") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("timeout");

      if (isTransient) {
        setError("RPC temporarily unavailable. Retrying...");
        // Keep previous balance on transient errors — don't zero it out
        // Schedule a retry with exponential backoff
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCountRef.current - 1);
          retryTimerRef.current = setTimeout(() => {
            fetchBalance();
          }, delay);
        } else {
          setError("RPC endpoint unreachable. Balance may be stale.");
          setRpcAvailable(false);
          if (!hasShownRpcToast.current) {
            hasShownRpcToast.current = true;
          }
        }
      } else {
        setError(errorMessage);
        // Only zero out for non-transient errors (e.g., account doesn't exist)
        setBalance(0);
        updateBalance(0);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, updateBalance, setRpcAvailable, rpcAvailable]);

  // Fetch balance on mount and when publicKey changes
  useEffect(() => {
    retryCountRef.current = 0;
    fetchBalance();
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
