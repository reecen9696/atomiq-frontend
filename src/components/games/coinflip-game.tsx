"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useAtomikBetting,
  useAtomikAllowance,
} from "@/components/providers/sdk-provider";
import { useBetting, useAllowanceForCasino } from "@/lib/sdk/hooks";
import type { CoinflipResult } from "@/lib/sdk";
import { bettingToast, toast } from "@/lib/toast";
import { useBetTrackingStore } from "@/stores/bet-tracking-store";
import { useSettlementErrors } from "@/hooks/useSettlementErrors";
import { useBetGuard } from "@/hooks/useBetGuard";
import { useBetCooldown } from "@/hooks/useBetCooldown";
import type { BetGuardHandle } from "@/hooks/useBetGuard";

export function CoinflipGame() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { isConnected, openWalletModal, user } = useAuthStore();
  const bettingService = useAtomikBetting();
  const allowanceService = useAtomikAllowance();
  const allowance = useAllowanceForCasino(
    publicKey?.toBase58() ?? null,
    allowanceService,
  );

  const { addPendingBet, updateBetTransactionId, removePendingBet } =
    useBetTrackingStore();

  // Bet guard — prevents over-betting by immediately deducting from optimistic balance
  const { guardBet } = useBetGuard();
  const activeGuardRef = useRef<BetGuardHandle | null>(null);

  // Bet cooldown — 500ms minimum between bets to avoid hitting rate limits
  const { canBet, recordBet, cooldownActive } = useBetCooldown(500);

  // Initialize settlement error handling
  useSettlementErrors();

  const {
    placeCoinflipBet,
    currentGame,
    gameResult,
    placingBet,
    error,
    clearCurrentGame,
    clearError,
  } = useBetting(publicKey?.toBase58() ?? null, bettingService);

  const [betAmount, setBetAmount] = useState("0.1");
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(
    null,
  );
  const [showResult, setShowResult] = useState(false);
  const processedGameIdRef = useRef<string | null>(null);

  // Clear error toast after 5 seconds
  useEffect(() => {
    if (error) {
      toast.error("Bet failed", error);
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  // Centralized bet result processor - handles balance updates atomically
  const processBetResult = useCallback(
    (result: CoinflipResult) => {
      // Type guard: only process complete results
      if (result.status !== "complete" || !result.result) return;

      // Dedup guard: skip if already processed this game result
      if (result.game_id && processedGameIdRef.current === result.game_id) return;
      if (result.game_id) processedGameIdRef.current = result.game_id;

      const won = result.result.outcome === "win";
      const payout = result.result.payment?.payout_amount || 0;
      const betAmount = result.result.payment?.bet_amount || 0;
      const outcome = result.result.outcome;

      // Resolve the bet guard (balance already deducted in handleBetClick)
      if (activeGuardRef.current && !activeGuardRef.current.settled) {
        activeGuardRef.current.resolve(won, payout);
        activeGuardRef.current = null;
      } else {
        // Fallback: no guard (shouldn't happen, but safe)
        const { processBetOutcome } = useAuthStore.getState();
        processBetOutcome(betAmount, won, payout);
      }

      // Show toast notification
      if (won) {
        bettingToast.betWon(payout, outcome);
      } else {
        bettingToast.betLost(betAmount, outcome);
      }

      // Remove from pending bets on successful settlement
      if (result.game_id) {
        const pendingBets = useBetTrackingStore.getState().pendingBets;
        for (const [gameId, bet] of pendingBets.entries()) {
          if (
            bet.transactionId &&
            result.game_id.includes(bet.transactionId.toString())
          ) {
            removePendingBet(gameId);
            break;
          }
        }
      }
    },
    [removePendingBet],
  );

  // Handle game result - Process EVERY result for balance updates
  useEffect(() => {
    if (gameResult && gameResult.status === "complete") {
      // ALWAYS process bet result for balance updates (even if display is showing)
      processBetResult(gameResult);

      // Only update display state if not already showing
      if (!showResult) {
        setShowResult(true);

        // Auto-clear result after 3 seconds to allow rapid betting
        setTimeout(() => {
          setShowResult(false);
          clearCurrentGame();
        }, 3000);
      }
    }
  }, [gameResult, showResult, clearCurrentGame, processBetResult]);

  const handleBetClick = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }

    // Enforce minimum 500ms between bets
    if (!canBet()) return;
    recordBet();

    if (!selectedSide) {
      toast.warning("Select heads or tails", "Choose a side to bet on");
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount", "Please enter a valid bet amount");
      return;
    }

    if (amount < 0.01) {
      toast.warning("Minimum bet", "Minimum bet is 0.01 SOL");
      return;
    }

    if (amount > 10) {
      toast.warning("Maximum bet", "Maximum bet is 10 SOL");
      return;
    }

    // Guard the bet — immediately deducts from optimistic balance
    const guard = guardBet(amount);
    if (!guard) return; // insufficient funds
    activeGuardRef.current = guard;

    // Create unique game ID
    const gameId = `${Date.now()}-${selectedSide}-${amount}`;

    // Track the pending bet
    addPendingBet({
      gameId,
      amount,
      choice: selectedSide,
      timestamp: Date.now(),
      playerAddress: publicKey!.toBase58(),
    });

    // Place bet
    const toastId = bettingToast.placingBet(selectedSide, amount);

    try {
      // Phase 4.2: Get current play session for nonce
      const playSession = allowance.getCachedPlaySession();
      if (!playSession) {
        // Check if session exists but expired
        const cachedData = localStorage.getItem(
          `atomik:playSession:${publicKey?.toBase58()}`,
        );
        if (cachedData) {
          toast.error(
            "Play session expired",
            "Please click the timer button to extend your session.",
          );
        } else {
          toast.error(
            "No active play session",
            "Please approve an allowance first by clicking the wallet icon.",
          );
        }
        toast.dismiss(toastId);
        removePendingBet(gameId);
        guard.revert();
        return;
      }

      // Place bet with nonce only - no wallet signature needed
      const result = await placeCoinflipBet(selectedSide, amount, playSession);

      // Update with transaction ID if available
      if (result?.game_id) {
        // Try to extract transaction ID from game_id or store game_id as reference
        const possibleTransactionId = parseInt(
          result.game_id.replace("tx-", ""),
          10,
        );
        if (!isNaN(possibleTransactionId)) {
          updateBetTransactionId(gameId, possibleTransactionId);
        }
      }
    } catch (error) {
      // Remove pending bet on error and revert balance
      removePendingBet(gameId);
      guard.revert();
      throw error;
    } finally {
      toast.dismiss(toastId);
    }
  };

  const quickBetAmounts = ["0.1", "0.5", "1.0", "5.0"];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6">
      {/* Result Display */}
      <div className="w-48 h-48 mb-4 flex flex-col items-center justify-center">
        {showResult &&
        gameResult &&
        gameResult.status === "complete" &&
        gameResult.result ? (
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2">
              {gameResult.result.outcome === "win" ? "WIN" : "LOSE"}
            </div>
            <div
              className={`text-2xl font-medium ${
                gameResult.result.outcome === "win"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {gameResult.result.outcome === "win"
                ? `+${gameResult.result.payment.payout_amount} SOL`
                : `-${gameResult.result.payment.bet_amount} SOL`}
            </div>
          </div>
        ) : (
          <div className="text-6xl text-white/60">🎲</div>
        )}
      </div>

      {/* Game Status */}
      {currentGame && !gameResult && (
        <div className="text-white/80 text-center">
          <p>Placing bet...</p>
          <p className="text-sm text-white/60">
            {currentGame.amount} SOL on {currentGame.choice}
          </p>
        </div>
      )}

      {/* Bet Selection */}
      <div className="flex gap-4">
        <button
          onClick={() => setSelectedSide("heads")}
          className={`px-8 py-4 rounded-lg font-medium transition-all ${
            selectedSide === "heads"
              ? "bg-[#674AE5] text-white scale-105"
              : "bg-[#1E2938] text-white/80 hover:bg-[#2A3644]"
          }`}
        >
          HEADS
        </button>
        <button
          onClick={() => setSelectedSide("tails")}
          className={`px-8 py-4 rounded-lg font-medium transition-all ${
            selectedSide === "tails"
              ? "bg-[#674AE5] text-white scale-105"
              : "bg-[#1E2938] text-white/80 hover:bg-[#2A3644]"
          }`}
        >
          TAILS
        </button>
      </div>

      {/* Bet Amount */}
      <div className="w-full max-w-md">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          step="0.1"
          min="0.01"
          max="10"
          className="w-full h-12 px-4 bg-[#1E2938] border border-[#2A3644] text-white rounded-lg focus:border-[#674AE5] outline-none"
        />

        {/* Quick Bet Buttons */}
        <div className="flex gap-2 mt-2">
          {quickBetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className="flex-1 py-2 bg-[#1E2938] hover:bg-[#2A3644] text-white/80 text-sm rounded transition-colors"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handleBetClick}
        disabled={(!isConnected && !selectedSide) || cooldownActive}
        className="w-full max-w-md py-4 bg-[#674AE5] hover:bg-[#8B75F6] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected
          ? "Connect Wallet"
          : `Bet ${betAmount} SOL on ${selectedSide || "..."}`}
      </button>

      {/* Game Info */}
      <div className="text-center text-white/60 text-sm">
        <p>Min: 0.01 SOL | Max: 10 SOL</p>
        <p className="mt-1">50% chance to win 2x your bet</p>
      </div>
    </div>
  );
}
