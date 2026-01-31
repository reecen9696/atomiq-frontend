"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useBalance } from "@/hooks/useBalance";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { solanaService } from "@/services/solana";
import { toast } from "@/lib/toast";

interface WalletManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActionType = "deposit" | "withdraw";

const MODAL_HEIGHT = "600px";
const CLOSE_BUTTON_SVG_PATH = "M6 6l12 12M6 18L18 6";

export function WalletManageModal({ isOpen, onClose }: WalletManageModalProps) {
  const [activeAction, setActiveAction] = useState<ActionType>("deposit");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { setConnecting } = useAuthStore();
  const {
    balance: walletBalance,
    loading: walletLoading,
    refresh: refreshWallet,
  } = useBalance();
  const {
    vaultBalance,
    hasVault,
    loading: vaultLoading,
    refresh: refreshVault,
  } = useVaultBalance();

  const handleAction = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || !publicKey || !sendTransaction) {
      toast.error("Invalid amount", "Please enter a valid amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount", "Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    setConnecting(true);

    try {
      if (activeAction === "deposit") {
        // Deposit SOL from wallet to vault
        const amountLamports = BigInt(Math.floor(amountNum * 1_000_000_000));

        const { signature } = await solanaService.depositSol({
          user: publicKey,
          amountLamports,
          sendTransaction,
          signTransaction: signTransaction ?? undefined,
          connection: solanaService.getConnection(),
        });

        console.log("✅ Deposit successful!", signature);
        toast.success(
          "Deposit successful",
          `Deposited ${amount} SOL to your vault`,
        );
      } else {
        // Withdraw SOL from vault to wallet
        const amountLamports = BigInt(Math.floor(amountNum * 1_000_000_000));

        const { signature } = await solanaService.withdrawSol({
          user: publicKey,
          amountLamports,
          sendTransaction,
          signTransaction: signTransaction ?? undefined,
          connection: solanaService.getConnection(),
        });

        console.log("✅ Withdrawal successful!", signature);
        toast.success(
          "Withdrawal successful",
          `Withdrew ${amount} SOL to your wallet`,
        );
      }

      // Refresh balances
      await Promise.all([refreshWallet(), refreshVault()]);

      setAmount("");
      onClose();
    } catch (error) {
      console.error(`❌ ${activeAction} failed:`, error);

      const errorMsg = error instanceof Error ? error.message : String(error);
      if (
        errorMsg.toLowerCase().includes("user rejected") ||
        errorMsg.toLowerCase().includes("user declined")
      ) {
        toast.error(`${activeAction} cancelled`, "User cancelled transaction");
      } else {
        toast.error(`${activeAction} failed`, errorMsg);
      }
    } finally {
      setIsProcessing(false);
      setConnecting(false);
    }
  }, [
    amount,
    activeAction,
    publicKey,
    sendTransaction,
    signTransaction,
    setConnecting,
    refreshWallet,
    refreshVault,
    onClose,
  ]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(e.target.value);
    },
    [],
  );

  const handleMaxClick = useCallback(() => {
    const maxBalance =
      activeAction === "deposit" ? walletBalance || 0 : vaultBalance || 0;
    setAmount(maxBalance.toFixed(9));
  }, [activeAction, walletBalance, vaultBalance]);

  const handleDepositClick = useCallback(() => {
    setActiveAction("deposit");
  }, []);

  const handleWithdrawClick = useCallback(() => {
    setActiveAction("withdraw");
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleCloseClick}
    >
      <div
        className="bg-[#131216] border border-[#1E2938] rounded-md p-8 w-full max-w-md mx-4"
        style={{ height: MODAL_HEIGHT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white text-xl font-medium">Wallet</h2>
          <button
            onClick={handleCloseClick}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={CLOSE_BUTTON_SVG_PATH}
              />
            </svg>
          </button>
        </div>

        {/* Balance Display */}
        <div className="space-y-4 mb-6">
          {/* Wallet Balance */}
          <div className="bg-[#211F28] rounded-sm p-4">
            <div className="text-white/40 text-xs mb-1">WALLET BALANCE</div>
            <div className="flex items-center gap-2">
              <Image src="/icons/sol.svg" alt="SOL" width={20} height={20} />
              <span className="text-white text-xl font-mono">
                {walletLoading ? "..." : (walletBalance || 0).toFixed(9)}
              </span>
            </div>
          </div>

          {/* Vault Balance */}
          {hasVault && (
            <div className="bg-[#211F28] rounded-sm p-4">
              <div className="text-white/40 text-xs mb-1">VAULT BALANCE</div>
              <div className="flex items-center gap-2">
                <Image src="/icons/sol.svg" alt="SOL" width={20} height={20} />
                <span className="text-white text-xl font-mono">
                  {vaultLoading ? "..." : (vaultBalance || 0).toFixed(9)}
                </span>
              </div>
            </div>
          )}

          {!hasVault && (
            <div className="bg-[#211F28] rounded-sm p-4 border border-yellow-700/30">
              <div className="text-yellow-400 text-xs mb-1">
                VAULT NOT CREATED
              </div>
              <div className="text-white/60 text-sm">
                Create a vault to start depositing funds
              </div>
            </div>
          )}
        </div>

        {/* Action Tabs */}
        <div className="flex border border-[#1E2938] rounded-sm mb-6">
          <button
            onClick={handleDepositClick}
            className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
              activeAction === "deposit"
                ? "bg-[#674AE5] text-white"
                : "bg-transparent text-white/60 hover:text-white"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={handleWithdrawClick}
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
              onChange={handleAmountChange}
              placeholder="0.00"
              step="0.000000001"
              min="0"
              className="w-full px-4 py-3 bg-[#211F28] border border-[#1E2938] rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-[#674AE5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={handleMaxClick}
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
              ? "Transfer SOL from your wallet to your vault for gaming"
              : "Withdraw SOL from your vault back to your wallet"}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={handleAction}
            disabled={
              isProcessing ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !publicKey ||
              (activeAction === "deposit" && !hasVault)
            }
            className="w-full px-6 py-3 bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm transition-colors"
          >
            {isProcessing
              ? `${activeAction === "deposit" ? "Depositing" : "Withdrawing"}...`
              : !hasVault && activeAction === "deposit"
                ? "Create Vault First"
                : `${activeAction === "deposit" ? "Deposit" : "Withdraw"} ${amount || "0"} SOL`}
          </button>
        </div>
      </div>
    </div>
  );
}
