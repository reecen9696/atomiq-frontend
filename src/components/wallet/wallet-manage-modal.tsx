"use client";

import Image from "next/image";
import { useState } from "react";

interface WalletManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActionType = "deposit" | "withdraw";

export function WalletManageModal({ isOpen, onClose }: WalletManageModalProps) {
  const [activeAction, setActiveAction] = useState<ActionType>("deposit");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setAmount("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#131216] border border-[#1E2938] rounded-md p-8 w-full max-w-md mx-4"
        style={{ height: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white text-xl font-medium">Wallet</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 6l12 12M6 18L18 6"
              />
            </svg>
          </button>
        </div>

        {/* Balance Display */}
        <div className="bg-[#211F28] rounded-sm p-4 mb-6">
          <div className="text-white/40 text-xs mb-1">CURRENT BALANCE</div>
          <div className="flex items-center gap-2">
            <Image src="/icons/sol.svg" alt="SOL" width={20} height={20} />
            <span className="text-white text-2xl font-mono">2.547839201</span>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex border border-[#1E2938] rounded-sm mb-6">
          <button
            onClick={() => setActiveAction("deposit")}
            className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
              activeAction === "deposit"
                ? "bg-[#674AE5] text-white"
                : "bg-transparent text-white/60 hover:text-white"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveAction("withdraw")}
            className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
              activeAction === "withdraw"
                ? "bg-[#674AE5] text-white"
                : "bg-transparent text-white/60 hover:text-white"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-white text-[14px] mb-2">
            Amount (SOL)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000000001"
              min="0"
              className="w-full px-4 py-3 bg-[#211F28] border border-[#1E2938] rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-[#674AE5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setAmount("2.547839201")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#674AE5] hover:text-[#8B75F6] text-[12px] font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm">
            {activeAction === "deposit"
              ? "Add SOL to your gaming balance from your wallet"
              : "Withdraw SOL from your gaming balance to your wallet"}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={handleAction}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className="w-full px-6 py-3 bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm transition-colors"
          >
            {isProcessing
              ? `${activeAction === "deposit" ? "Depositing" : "Withdrawing"}...`
              : `${activeAction === "deposit" ? "Deposit" : "Withdraw"} ${amount || "0"} SOL`}
          </button>
        </div>
      </div>
    </div>
  );
}
