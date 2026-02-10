"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useAtomikBetting,
  useAtomikAllowance,
} from "@/components/providers/sdk-provider";
import { useBetting, useAllowanceForCasino } from "@/lib/sdk/hooks";
import type { CoinflipResult } from "@/lib/sdk";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { bettingToast, toast, walletToast } from "@/lib/toast";
import { useBetTrackingStore } from "@/stores/bet-tracking-store";
import { useSettlementErrors } from "@/hooks/useSettlementErrors";
import { 
  validateBetAmount, 
  validateCoinflipChoice, 
  generateBetId,
  formatRateLimitMessage
} from "@/lib/bet-validation";
import { getRateLimiter } from "@/lib/rate-limiter";
import { getTransactionGuard } from "@/lib/transaction-guard";
import { sanitizeError } from "@/lib/error-handler";

export function CoinflipGame() {
  const { publicKey } = useWallet();
  const { isConnected, openWalletModal, user, updateVaultInfo } =
    useAuthStore();
  const bettingService = useAtomikBetting();
  const allowanceService = useAtomikAllowance();
  const allowance = useAllowanceForCasino(
    publicKey?.toBase58() ?? null,
    allowanceService,
  );

  const { addPendingBet, updateBetTransactionId, removePendingBet } =
    useBetTrackingStore();

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

      // ✅ Read fresh user state from store to avoid stale closure
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      const won = result.result.outcome === "win";
      const payout = result.result.payment?.payout_amount || 0;
      const betAmount = result.result.payment?.bet_amount || 0;
      const outcome = result.result.outcome;

      // Get current balance directly from fresh store state
      const currentVaultBalance = currentUser.vaultBalance || 0;
      const vaultAddress = currentUser.vaultAddress || "";

      if (won) {
        // Win: add net profit (payout - original bet)
        const netProfit = payout - betAmount;
        const newBalance = currentVaultBalance + netProfit;
        updateVaultInfo(vaultAddress, newBalance);
        bettingToast.betWon(payout, outcome);
      } else {
        // Loss: subtract bet amount
        const newBalance = currentVaultBalance - betAmount;
        updateVaultInfo(vaultAddress, newBalance);
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
    [updateVaultInfo, removePendingBet],
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

    // Validate choice
    const choiceValidation = validateCoinflipChoice(selectedSide);
    if (!choiceValidation.isValid) {
      toast.warning("Invalid choice", choiceValidation.error || "Please select heads or tails");
      return;
    }

    const amount = parseFloat(betAmount);
    
    // Validate bet amount
    const balance = user?.vaultBalance || 0;
    const validation = validateBetAmount(amount, 0.01, 10, balance);
    if (!validation.isValid) {
      toast.error("Invalid bet", validation.error || "Please check your bet amount");
      return;
    }

    // Check rate limiting
    const rateLimiter = getRateLimiter();
    const gameType = 'coinflip';
    const rateLimitCheck = rateLimiter.canPlaceBet(gameType);
    if (!rateLimitCheck.allowed) {
      toast.warning(
        "Please slow down", 
        formatRateLimitMessage(rateLimitCheck.retryAfterMs || 0)
      );
      return;
    }

    // Generate unique bet ID
    const betId = generateBetId();
    
    // Check transaction guard (prevent replays)
    const txGuard = getTransactionGuard();
    if (!txGuard.markPending(betId)) {
      toast.error("Duplicate bet", "This bet is already being processed");
      return;
    }

    // Create game ID for tracking
    const gameId = `${Date.now()}-${selectedSide}-${amount}`;

    // Track the pending bet
    addPendingBet({
      gameId,
      amount,
      choice: selectedSide!,
      timestamp: Date.now(),
      playerAddress: publicKey!.toBase58(),
    });

    // Record rate limit
    rateLimiter.recordBet(gameType);

    // Place bet
    const toastId = bettingToast.placingBet(selectedSide!, amount);

    try {
      // Get cached allowancePda from localStorage
      const cachedSession = allowance?.getCachedPlaySession?.();
      const allowancePda = cachedSession?.allowancePda;

      const result = await placeCoinflipBet(
        selectedSide!,
        amount,
        user?.vaultAddress,
        allowancePda,
      );

      // Mark transaction as completed
      txGuard.markCompleted(betId);

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
      // Mark transaction as failed
      txGuard.markFailed(betId);
      
      // Remove pending bet on error
      removePendingBet(gameId);
      
      // Sanitize and display error
      const sanitized = sanitizeError(error);
      toast.error("Bet failed", sanitized.message);
      
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
        disabled={!isConnected && !selectedSide}
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
