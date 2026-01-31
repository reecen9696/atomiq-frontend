"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAtomikBetting } from "@/components/providers/sdk-provider";
import { useBetting } from "@/lib/sdk/hooks";
import { bettingToast, toast, walletToast } from "@/lib/toast";
import Image from "next/image";

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
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Clear error toast after 5 seconds
  useEffect(() => {
    if (error) {
      toast.error("Bet failed", error);
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  // Handle game result animation
  useEffect(() => {
    if (gameResult && !isFlipping) {
      setIsFlipping(true);

      // Show flipping animation for 2 seconds
      setTimeout(() => {
        setIsFlipping(false);
        setShowResult(true);

        // Show result toast
        if (gameResult.won) {
          bettingToast.betWon(gameResult.amount, gameResult.outcome);
        } else {
          bettingToast.betLost(gameResult.amount, gameResult.outcome);
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setShowResult(false);
          clearCurrentGame();
        }, 3000);
      }, 2000);
    }
  }, [gameResult, isFlipping, clearCurrentGame]);

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
      {/* Coin Display */}
      <div className="relative w-48 h-48 mb-4">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl transition-transform duration-500 ${
            isFlipping ? "animate-spin" : ""
          }`}
        >
          {showResult && gameResult ? (
            <div className="text-4xl font-bold text-white">
              {gameResult.outcome.toUpperCase()}
            </div>
          ) : (
            <div className="text-6xl">🪙</div>
          )}
        </div>

        {/* Result Overlay */}
        {showResult && gameResult && (
          <div
            className={`absolute inset-0 rounded-full flex items-center justify-center ${
              gameResult.won
                ? "bg-green-500/20 border-4 border-green-500"
                : "bg-red-500/20 border-4 border-red-500"
            }`}
          >
            <div className="text-2xl">
              {gameResult.won ? "🎉 WIN!" : "😔 LOSS"}
            </div>
          </div>
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
          disabled={placingBet || isFlipping}
          className={`px-8 py-4 rounded-lg font-medium transition-all ${
            selectedSide === "heads"
              ? "bg-[#674AE5] text-white scale-105"
              : "bg-[#1E2938] text-white/80 hover:bg-[#2A3644]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          HEADS
        </button>
        <button
          onClick={() => setSelectedSide("tails")}
          disabled={placingBet || isFlipping}
          className={`px-8 py-4 rounded-lg font-medium transition-all ${
            selectedSide === "tails"
              ? "bg-[#674AE5] text-white scale-105"
              : "bg-[#1E2938] text-white/80 hover:bg-[#2A3644]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          TAILS
        </button>
      </div>

      {/* Bet Amount */}
      <div className="w-full max-w-md">
        <label className="block text-white mb-2">Bet Amount (SOL)</label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          step="0.1"
          min="0.01"
          max="10"
          disabled={placingBet || isFlipping}
          className="w-full h-12 px-4 bg-[#1E2938] border border-[#2A3644] text-white rounded-lg focus:border-[#674AE5] outline-none disabled:opacity-50"
          placeholder="0.1"
        />

        {/* Quick Bet Buttons */}
        <div className="flex gap-2 mt-2">
          {quickBetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={placingBet || isFlipping}
              className="flex-1 py-2 bg-[#1E2938] hover:bg-[#2A3644] text-white/80 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handleBetClick}
        disabled={placingBet || isFlipping || !selectedSide}
        className="w-full max-w-md py-4 bg-[#674AE5] hover:bg-[#8B75F6] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected
          ? "Connect Wallet"
          : placingBet
            ? "Placing Bet..."
            : isFlipping
              ? "Flipping..."
              : `Bet ${betAmount} SOL on ${selectedSide?.toUpperCase() ?? "..."}`}
      </button>

      {/* Game Info */}
      <div className="text-center text-white/60 text-sm">
        <p>Min: 0.01 SOL | Max: 10 SOL</p>
        <p className="mt-1">50% chance to win 2x your bet</p>
      </div>
    </div>
  );
}
