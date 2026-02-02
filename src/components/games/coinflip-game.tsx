"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAtomikBetting } from "@/components/providers/sdk-provider";
import { useBetting } from "@/lib/sdk/hooks";
import { bettingToast, toast, walletToast } from "@/lib/toast";

export function CoinflipGame() {
  const { publicKey } = useWallet();
  const { isConnected, openWalletModal } = useAuthStore();
  const bettingService = useAtomikBetting();

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

  // Handle game result - show instantly, then clear after 3 seconds
  useEffect(() => {
    if (gameResult && gameResult.status === "complete" && !showResult) {
      setShowResult(true);

      // Calculate if won based on API outcome field
      const won = gameResult.result?.outcome === "win";
      const payout = gameResult.result?.payment?.payout_amount || 0;
      const betAmount = gameResult.result?.payment?.bet_amount || 0;
      const outcome = gameResult.result?.outcome;

      // Show result toast
      if (won) {
        bettingToast.betWon(payout, outcome);
      } else {
        bettingToast.betLost(betAmount, outcome);
      }

      // Auto-clear result after 3 seconds to allow rapid betting
      setTimeout(() => {
        setShowResult(false);
        clearCurrentGame();
      }, 3000);
    }
  }, [gameResult, showResult, clearCurrentGame, selectedSide]);

  const handleBetClick = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }

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

    // Place bet
    const toastId = bettingToast.placingBet(selectedSide, amount);
    await placeCoinflipBet(selectedSide, amount);
    toast.dismiss(toastId);
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
