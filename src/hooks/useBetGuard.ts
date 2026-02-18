"use client";

import { useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/lib/toast";

/**
 * useBetGuard — Reusable bet lifecycle manager for all games.
 *
 * Solves the rapid-betting problem: when a player clicks bet 100 times
 * before any result comes back, the balance check passes every time
 * because `processBetOutcome` hasn't run yet.
 *
 * This hook:
 * 1. Immediately deducts the bet from the optimistic balance BEFORE the API call
 * 2. Returns a `resolve` function to finalize the outcome (win/loss)
 * 3. Returns a `revert` function to restore the balance on API failure
 * 4. Tracks in-flight bets so balance checks account for them
 *
 * Usage in any game:
 * ```tsx
 * const { guardBet } = useBetGuard();
 *
 * const handleBet = async () => {
 *   const guard = guardBet(betAmount);
 *   if (!guard) return; // insufficient funds
 *
 *   try {
 *     const result = await gameApiClient.plinko.play(request);
 *     if (!result.success) { guard.revert(); return; }
 *     // For instant-outcome games (dice, coinflip, slots):
 *     guard.resolve(won, payout);
 *     // For deferred-outcome games (plinko): call guard.resolve later when ball lands
 *   } catch {
 *     guard.revert();
 *   }
 * };
 * ```
 */

export interface BetGuardHandle {
  /** The bet amount in SOL that was reserved */
  betAmount: number;
  /** Finalize the bet outcome — adds payout if won, does nothing for loss (bet already deducted) */
  resolve: (won: boolean, payout: number) => void;
  /** Revert the deduction on API/network failure — restores betAmount to balance */
  revert: () => void;
  /** Whether this guard has been resolved or reverted already */
  settled: boolean;
}

// Module-level tracker for total in-flight bets (survives component re-renders)
let _inFlightTotal = 0;
let _inFlightCount = 0;

/** Get the total SOL currently reserved by in-flight bets */
export function getInFlightTotal(): number {
  return _inFlightTotal;
}

/** Get the number of currently in-flight bets */
export function getInFlightCount(): number {
  return _inFlightCount;
}

export function useBetGuard() {
  // Track active guards for this component instance
  const activeGuardsRef = useRef<Set<BetGuardHandle>>(new Set());

  /**
   * Attempt to place a bet. Immediately deducts `betAmount` from the
   * optimistic vault balance. Returns a guard handle, or null if
   * insufficient funds.
   *
   * @param betAmount - The bet amount in SOL
   * @param skipBalanceCheck - Skip the balance check (e.g., for free spins)
   */
  const guardBet = useCallback(
    (betAmount: number, skipBalanceCheck = false): BetGuardHandle | null => {
      const state = useAuthStore.getState();
      const currentBalance = state.user?.vaultBalance ?? 0;

      // Check balance MINUS what's already in-flight
      const effectiveBalance = currentBalance; // balance already includes prior deductions
      if (!skipBalanceCheck && effectiveBalance < betAmount) {
        toast.error(
          "Insufficient funds",
          `Balance: ${effectiveBalance.toFixed(4)} SOL, Bet: ${betAmount.toFixed(4)} SOL`,
        );
        return null;
      }

      // Immediately deduct from optimistic balance — this is the key fix.
      // All subsequent guardBet() calls will see the reduced balance.
      state.processBetOutcome(betAmount, false, 0);
      _inFlightTotal += betAmount;
      _inFlightCount += 1;

      let settled = false;

      const handle: BetGuardHandle = {
        betAmount,
        get settled() {
          return settled;
        },

        resolve: (won: boolean, payout: number) => {
          if (settled) return; // idempotent
          settled = true;
          _inFlightTotal = Math.max(0, _inFlightTotal - betAmount);
          _inFlightCount = Math.max(0, _inFlightCount - 1);
          activeGuardsRef.current.delete(handle);

          if (won && payout > 0) {
            // Add the payout back (the bet was already deducted in guardBet)
            const { revertBetAmount } = useAuthStore.getState();
            revertBetAmount(payout);
          }
          // If lost: bet was already deducted, nothing more to do.
        },

        revert: () => {
          if (settled) return; // idempotent
          settled = true;
          _inFlightTotal = Math.max(0, _inFlightTotal - betAmount);
          _inFlightCount = Math.max(0, _inFlightCount - 1);
          activeGuardsRef.current.delete(handle);

          // Restore the deducted amount
          const { revertBetAmount } = useAuthStore.getState();
          revertBetAmount(betAmount);
        },
      };

      activeGuardsRef.current.add(handle);
      return handle;
    },
    [],
  );

  return { guardBet, getInFlightTotal, getInFlightCount };
}
