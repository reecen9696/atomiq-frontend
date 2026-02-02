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
        console.warn("Failed to get next nonce:", error);
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
        console.warn("Failed to find most recent active allowance:", error);
        return null;
      }
    },
    [userPublicKey, allowanceService],
  );

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
    () => allowanceHook.findMostRecentActive(spender),
    [allowanceHook.findMostRecentActive, spender],
  );

  return {
    ...allowanceHook,
    allowances: casinoAllowances,
    approve: approveForCasino,
    extend: extendForCasino,
    refresh: refreshForCasino,
    getMostRecentActive: getMostRecentCasinoAllowance,
  };
}
