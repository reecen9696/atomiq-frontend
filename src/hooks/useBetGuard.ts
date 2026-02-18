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
 * 4. Tracks in-flight bets AND unsettled P&L so reconciliation doesn't
 *    overwrite game outcomes before on-chain settlement catches up
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
  /** Finalize the bet outcome — adds payout back (even partial payouts on "losses" like plinko 0.5x) */
  resolve: (won: boolean, payout: number) => void;
  /** Revert the deduction on API/network failure — restores betAmount to balance */
  revert: () => void;
  /** Whether this guard has been resolved or reverted already */
  settled: boolean;
}

// Module-level tracker for total in-flight bets (survives component re-renders)
let _inFlightTotal = 0;
let _inFlightCount = 0;

// Unsettled P&L: net profit/loss from resolved bets that haven't settled on-chain yet.
// Positive = net winnings, Negative = net losses.
// This prevents reconciliation from overwriting game outcomes before settlement.
let _unsettledPnL = 0;

// Track individual P&L entries with timestamps so they can decay
interface PnLEntry {
  amount: number; // payout - betAmount (can be negative)
  timestamp: number;
}
const _pnlEntries: PnLEntry[] = [];

// How long before we assume a settlement has been applied on-chain (2 minutes)
const PNL_DECAY_MS = 120_000;

/** Decay old P&L entries that have likely settled on-chain */
function decayPnL() {
  const now = Date.now();
  let i = 0;
  while (i < _pnlEntries.length) {
    if (now - _pnlEntries[i].timestamp > PNL_DECAY_MS) {
      _unsettledPnL -= _pnlEntries[i].amount;
      _pnlEntries.splice(i, 1);
    } else {
      i++;
    }
  }
  // Clamp rounding errors
  if (_pnlEntries.length === 0) _unsettledPnL = 0;
}

/** Get the total SOL currently reserved by in-flight bets */
export function getInFlightTotal(): number {
  return _inFlightTotal;
}

/** Get the number of currently in-flight bets */
export function getInFlightCount(): number {
  return _inFlightCount;
}

/**
 * Get the net unsettled P&L from resolved bets.
 * Positive = net winnings not yet on-chain. Negative = net losses not yet on-chain.
 * Automatically decays entries older than PNL_DECAY_MS.
 */
export function getUnsettledPnL(): number {
  decayPnL();
  return _unsettledPnL;
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

      // Check balance — already reflects prior deductions from earlier guardBet calls
      if (!skipBalanceCheck && currentBalance < betAmount) {
        toast.error(
          "Insufficient funds",
          `Balance: ${currentBalance.toFixed(4)} SOL, Bet: ${betAmount.toFixed(4)} SOL`,
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

          // Track the net P&L for reconciliation purposes.
          // This tells reconciliation "the optimistic balance includes this
          // game outcome, but on-chain hasn't settled yet — don't overwrite it."
          const netPnL = payout - betAmount;
          _unsettledPnL += netPnL;
          _pnlEntries.push({ amount: netPnL, timestamp: Date.now() });

          if (payout > 0) {
            // Add the payout back (the bet was already deducted in guardBet).
            // This handles BOTH wins (payout > betAmount) AND partial-payout
            // "losses" like plinko 0.5x (payout < betAmount but > 0).
            const { revertBetAmount } = useAuthStore.getState();
            revertBetAmount(payout);
          }
          // If payout is 0 (true loss): bet was already deducted, nothing to add.
        },

        revert: () => {
          if (settled) return; // idempotent
          settled = true;
          _inFlightTotal = Math.max(0, _inFlightTotal - betAmount);
          _inFlightCount = Math.max(0, _inFlightCount - 1);
          activeGuardsRef.current.delete(handle);

          // Restore the deducted amount (API failure — bet never happened)
          const { revertBetAmount } = useAuthStore.getState();
          revertBetAmount(betAmount);
        },
      };

      activeGuardsRef.current.add(handle);
      return handle;
    },
    [],
  );

  return { guardBet, getInFlightTotal, getInFlightCount, getUnsettledPnL };
}
