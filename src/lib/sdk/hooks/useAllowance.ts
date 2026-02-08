import { useState, useCallback, useRef, useEffect } from "react";
import {
  Connection,
  Transaction,
  VersionedTransaction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import type { AtomikAllowanceService } from "../allowance/service";
import type { AllowanceAccountState } from "@/services/solana/types";
import { logger } from "@/lib/logger";

// Simple cache for allowance PDA - balance tracked in auth store
export interface PlaySessionData {
  allowancePda: string;
  expiresAt: number; // Unix timestamp
  nonce: number;
}

// localStorage utilities
const PLAY_SESSION_STORAGE_KEY = "atomik:playSession";

function getPlaySessionStorageKey(userPublicKey: string): string {
  return `${PLAY_SESSION_STORAGE_KEY}:${userPublicKey}`;
}

function savePlaySessionToStorage(
  userPublicKey: string,
  sessionData: PlaySessionData,
): void {
  if (!userPublicKey) return;

  try {
    const key = getPlaySessionStorageKey(userPublicKey);
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    logger.warn("Unable to save play session to localStorage", { error });
  }
}

function loadPlaySessionFromStorage(
  userPublicKey: string,
): PlaySessionData | null {
  if (!userPublicKey) return null;

  try {
    const key = getPlaySessionStorageKey(userPublicKey);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    return JSON.parse(stored) as PlaySessionData;
  } catch (error) {
    logger.warn("Unable to load play session from localStorage", { error });
    return null;
  }
}

function isPlaySessionValid(sessionData: PlaySessionData | null): boolean {
  if (!sessionData) return false;

  // Check if session has expired
  const now = Math.floor(Date.now() / 1000);

  if (sessionData.expiresAt <= now) {
    return false;
  }

  return true;
}

type SendTransactionFn = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
) => Promise<TransactionSignature>;

type SignTransactionFn = (
  transaction: Transaction | VersionedTransaction,
) => Promise<Transaction | VersionedTransaction>;

export interface UseAllowanceState {
  // Current allowances
  activeAllowances: Array<{
    allowancePda: string;
    nonce: number;
    data: AllowanceAccountState;
  }>;

  // Loading states
  loading: boolean;
  approving: boolean;
  revoking: boolean;
  extending: boolean;

  // Error state
  error: string | null;

  // Last operation result
  lastSignature: string | null;
  lastAllowancePda: string | null;
}

export interface UseAllowanceActions {
  // Core operations
  approve: (
    spender: string,
    amount: number,
    duration?: number,
  ) => Promise<{ signature: string; allowancePda: string } | null>;
  revoke: (allowancePda: string) => Promise<string | null>;
  extend: (
    spender: string,
    additionalDuration: number,
  ) => Promise<{ signature: string; allowancePda: string } | null>;

  // Utility operations
  refreshAllowances: (spender: string) => Promise<void>;
  getNextNonce: (spender: string) => Promise<number>;
  findMostRecentActive: (spender: string) => Promise<{
    allowancePda: string;
    nonce: number;
    data: AllowanceAccountState;
  } | null>;

  // localStorage-based operations
  getCachedPlaySession: () => PlaySessionData | null;
  savePlaySessionData: (data: PlaySessionData) => void;
  getMostRecentActiveFromCache: () => Promise<{
    allowancePda: string;
    nonce: number;
    data: AllowanceAccountState;
  } | null>;

  // State management
  clearError: () => void;
  reset: () => void;
}

export interface UseAllowanceResult
  extends UseAllowanceState, UseAllowanceActions {}

/**
 * React hook for allowance operations
 */
export function useAllowance(
  userPublicKey: string | null,
  allowanceService: AtomikAllowanceService,
  sendTransaction?: SendTransactionFn,
  signTransaction?: SignTransactionFn,
): UseAllowanceResult {
  const [state, setState] = useState<UseAllowanceState>({
    activeAllowances: [],
    loading: false,
    approving: false,
    revoking: false,
    extending: false,
    error: null,
    lastSignature: null,
    lastAllowancePda: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refreshAllowances = useCallback(
    async (spender: string) => {
      if (!userPublicKey) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const allowances = await allowanceService.findActiveAllowances({
          userPublicKey,
          spender,
        });

        setState((prev) => ({
          ...prev,
          activeAllowances: allowances,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: (error as Error).message || "Failed to fetch allowances",
          loading: false,
        }));
      }
    },
    [userPublicKey, allowanceService],
  );

  const getNextNonce = useCallback(
    async (spender: string): Promise<number> => {
      if (!userPublicKey) return 0;

      try {
        return await allowanceService.getNextAllowanceNonce({
          userPublicKey,
          spender,
        });
      } catch (error) {
        logger.warn("Failed to get next nonce:", { error });
        return 0;
      }
    },
    [userPublicKey, allowanceService],
  );

  const findMostRecentActive = useCallback(
    async (spender: string) => {
      if (!userPublicKey) return null;

      try {
        return await allowanceService.findMostRecentActiveAllowance({
          userPublicKey,
          spender,
        });
      } catch (error) {
        logger.warn("Failed to find most recent active allowance:", { error });
        return null;
      }
    },
    [userPublicKey, allowanceService],
  );

  // localStorage-based methods
  const getCachedPlaySession = useCallback((): PlaySessionData | null => {
    if (!userPublicKey) return null;
    const cached = loadPlaySessionFromStorage(userPublicKey);
    return isPlaySessionValid(cached) ? cached : null;
  }, [userPublicKey]);

  const savePlaySessionData = useCallback(
    (data: PlaySessionData) => {
      if (!userPublicKey) return;
      savePlaySessionToStorage(userPublicKey, data);
    },
    [userPublicKey],
  );

  const getMostRecentActiveFromCache = useCallback(async () => {
    if (!userPublicKey) return null;

    try {
      // Use fast localStorage-based lookup like test-ui
      const result = await allowanceService.findCachedActiveAllowance({
        userPublicKey,
      });

      if (result) {
        // Cache the session data for consistency
        const sessionData: PlaySessionData = {
          allowancePda: result.allowancePda,
          expiresAt: Number(result.data.expiresAt),
          nonce: 0, // We don't need exact nonce for session validation
        };

        savePlaySessionToStorage(userPublicKey, sessionData);

        return {
          allowancePda: result.allowancePda,
          nonce: 0,
          data: result.data,
        };
      }
    } catch (error) {
      logger.debug("⚠️ Error checking cached allowance:", { error });
    }

    // Only use expensive scan as last resort
    logger.debug("📡 No cached allowance found, using scan as fallback");
    return findMostRecentActive("casino");
  }, [userPublicKey, allowanceService, findMostRecentActive]);

  const approve = useCallback(
    async (
      spender: string,
      amount: number,
      duration = 10000,
    ): Promise<{ signature: string; allowancePda: string } | null> => {
      if (!userPublicKey || !sendTransaction || !signTransaction) {
        setState((prev) => ({
          ...prev,
          error: "Missing required parameters for approval",
        }));
        return null;
      }

      if (amount <= 0) {
        setState((prev) => ({
          ...prev,
          error: "Allowance amount must be greater than 0",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, approving: true, error: null }));

      try {
        const result = await allowanceService.approveAllowance({
          userPublicKey,
          spender,
          amount,
          duration,
          sendTransaction,
          signTransaction,
        });

        setState((prev) => ({
          ...prev,
          approving: false,
          lastSignature: result.signature,
          lastAllowancePda: result.allowancePda,
        }));

        // Save to localStorage immediately for fast lookup (like test-ui)
        try {
          const key = `atomik:lastAllowancePda:${userPublicKey}`;
          localStorage.setItem(key, result.allowancePda);
          logger.debug(
            "✅ Saved allowance PDA to localStorage:",
            { allowancePda: result.allowancePda },
          );
        } catch (storageError) {
          logger.warn(
            "Unable to save allowance PDA to localStorage:",
            { error: storageError },
          );
        }

        // Get the allowance info and cache it for instant display
        try {
          const allowanceInfo = await allowanceService.getAllowanceInfo(
            result.allowancePda,
            allowanceService.getConnection(),
          );

          if (allowanceInfo.accountExists && allowanceInfo.allowanceData) {
            const playSessionData: PlaySessionData = {
              allowancePda: result.allowancePda,
              expiresAt: Number(allowanceInfo.allowanceData.expiresAt),
              nonce: 0, // This will be updated when we have nonce info
            };
            savePlaySessionData(playSessionData);
          }
        } catch (cacheError) {
          logger.warn("⚠️ Could not cache play session data:", { error: cacheError });
        }

        // Refresh allowances after approval
        await refreshAllowances(spender);

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: (error as Error).message || "Failed to approve allowance",
          approving: false,
        }));
        return null;
      }
    },
    [
      userPublicKey,
      sendTransaction,
      signTransaction,
      allowanceService,
      refreshAllowances,
      savePlaySessionData,
    ],
  );

  const extend = useCallback(
    async (
      spender: string,
      additionalDuration: number,
    ): Promise<{ signature: string; allowancePda: string } | null> => {
      if (!userPublicKey || !sendTransaction || !signTransaction) {
        setState((prev) => ({
          ...prev,
          error: "Missing required parameters for extension",
        }));
        return null;
      }

      if (additionalDuration <= 0) {
        setState((prev) => ({
          ...prev,
          error: "Extension duration must be greater than 0",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, extending: true, error: null }));

      try {
        const result = await allowanceService.extendAllowance({
          userPublicKey,
          spender,
          additionalDuration,
          sendTransaction,
          signTransaction,
        });

        setState((prev) => ({
          ...prev,
          extending: false,
          lastSignature: result.signature,
          lastAllowancePda: result.allowancePda,
        }));

        // Get the updated allowance info and cache it
        try {
          const allowanceInfo = await allowanceService.getAllowanceInfo(
            result.allowancePda,
            allowanceService.getConnection(),
          );

          if (allowanceInfo.accountExists && allowanceInfo.allowanceData) {
            const playSessionData: PlaySessionData = {
              allowancePda: result.allowancePda,
              expiresAt: Number(allowanceInfo.allowanceData.expiresAt),
              nonce: 0, // This will be updated when we have nonce info
            };
            savePlaySessionData(playSessionData);
          }
        } catch (cacheError) {
          logger.warn("⚠️ Could not cache play session data:", { error: cacheError });
        }

        // Refresh allowances after extension
        await refreshAllowances(spender);

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: (error as Error).message || "Failed to extend allowance",
          extending: false,
        }));
        return null;
      }
    },
    [
      userPublicKey,
      sendTransaction,
      signTransaction,
      allowanceService,
      refreshAllowances,
      savePlaySessionData,
    ],
  );

  const revoke = useCallback(
    async (allowancePda: string): Promise<string | null> => {
      if (!userPublicKey || !sendTransaction || !signTransaction) {
        setState((prev) => ({
          ...prev,
          error: "Missing required parameters for revocation",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, revoking: true, error: null }));

      try {
        const signature = await allowanceService.revokeAllowance({
          userPublicKey,
          allowancePda,
          sendTransaction,
          signTransaction,
        });

        setState((prev) => ({
          ...prev,
          revoking: false,
          lastSignature: signature,
          lastAllowancePda: allowancePda,
          // Remove revoked allowance from active list
          activeAllowances: prev.activeAllowances.filter(
            (a) => a.allowancePda !== allowancePda,
          ),
        }));

        return signature;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: (error as Error).message || "Failed to revoke allowance",
          revoking: false,
        }));
        return null;
      }
    },
    [userPublicKey, sendTransaction, signTransaction, allowanceService],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      activeAllowances: [],
      loading: false,
      approving: false,
      revoking: false,
      extending: false,
      error: null,
      lastSignature: null,
      lastAllowancePda: null,
    });
  }, []);

  return {
    ...state,
    approve,
    revoke,
    extend,
    refreshAllowances,
    getNextNonce,
    findMostRecentActive,
    getCachedPlaySession,
    savePlaySessionData,
    getMostRecentActiveFromCache,
    clearError,
    reset,
  };
}

/**
 * Hook for managing allowances with a specific spender (casino)
 */
export function useAllowanceForCasino(
  userPublicKey: string | null,
  allowanceService: AtomikAllowanceService,
  sendTransaction?: SendTransactionFn,
  signTransaction?: SignTransactionFn,
) {
  // For casino use case, spender is always the casino PDA
  // We'll derive this dynamically, but for now use a constant identifier
  const spender = "casino"; // This will be resolved to actual casino PDA in service

  const allowanceHook = useAllowance(
    userPublicKey,
    allowanceService,
    sendTransaction,
    signTransaction,
  );

  // Auto-refresh allowances when user changes
  useEffect(() => {
    if (userPublicKey && spender) {
      allowanceHook.refreshAllowances(spender);
    }
  }, [userPublicKey, spender]);

  // Filter allowances for this spender only
  const casinoAllowances = allowanceHook.activeAllowances;

  // Convenience methods for casino-specific operations
  const approveForCasino = useCallback(
    (amount: number, duration?: number) =>
      allowanceHook.approve(spender, amount, duration),
    [allowanceHook.approve, spender],
  );

  const extendForCasino = useCallback(
    (additionalDuration: number) =>
      allowanceHook.extend(spender, additionalDuration),
    [allowanceHook.extend, spender],
  );

  const refreshForCasino = useCallback(
    () => allowanceHook.refreshAllowances(spender),
    [allowanceHook.refreshAllowances, spender],
  );

  const getMostRecentCasinoAllowance = useCallback(
    () => allowanceHook.getMostRecentActiveFromCache(),
    [allowanceHook.getMostRecentActiveFromCache],
  );

  const getCachedPlaySessionForCasino = useCallback(
    () => allowanceHook.getCachedPlaySession(),
    [allowanceHook.getCachedPlaySession],
  );

  return {
    ...allowanceHook,
    allowances: casinoAllowances,
    approve: approveForCasino,
    extend: extendForCasino,
    refresh: refreshForCasino,
    getMostRecentActive: getMostRecentCasinoAllowance,
    getCachedPlaySession: getCachedPlaySessionForCasino,
  };
}
