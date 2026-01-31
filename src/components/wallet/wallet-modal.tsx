"use client";

import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";
import { useState } from "react";

type ModalPage = "connect" | "smartVault" | "addFunds" | "createSession";

export function WalletModal() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    connect,
    setConnecting,
    isConnecting,
  } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<ModalPage>("connect");
  const [amount, setAmount] = useState("");

  if (!isWalletModalOpen) return null;

  const handleConnect = async (walletType: string) => {
    // Show smart vault page instead of connecting immediately
    setCurrentPage("smartVault");
  };

  const handleActivateVault = () => {
    setCurrentPage("addFunds");
  };

  const handleAddFunds = () => {
    setCurrentPage("createSession");
  };

  const handleCreateSession = async () => {
    try {
      setConnecting(true);
      // Simulate session creation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock wallet connection with a fake public key
      const mockPublicKey = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      connect(mockPublicKey);

      // Close modal and reset
      handleClose();
    } catch (error) {
      console.error("Failed to create session:", error);
      setConnecting(false);
    }
  };

  const handleClose = () => {
    closeWalletModal();
    setCurrentPage("connect");
    setAmount("");
  };

  const renderConnectPage = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Connect Wallet</h2>
        <button
          onClick={handleClose}
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

      {/* Wallet Options */}
      <div className="space-y-3">
        <button
          onClick={() => handleConnect("phantom")}
          className="w-full flex items-center gap-3 p-4 border border-[#1E2938] hover:border-[#674AE5] hover:bg-white/5 rounded-sm transition-all duration-200"
        >
          <div className="w-8 h-8 bg-[#674AE5] rounded-sm flex items-center justify-center">
            <Image
              src="/icons/wallet.svg"
              alt="Phantom"
              width={16}
              height={16}
            />
          </div>
          <div className="text-left">
            <div className="text-white font-medium">Phantom</div>
            <div className="text-white/60 text-sm">
              Connect using Phantom wallet
            </div>
          </div>
        </button>

        <button
          onClick={() => handleConnect("solflare")}
          className="w-full flex items-center gap-3 p-4 border border-[#1E2938] hover:border-[#674AE5] hover:bg-white/5 rounded-sm transition-all duration-200"
        >
          <div className="w-8 h-8 bg-[#674AE5] rounded-md flex items-center justify-center">
            <Image
              src="/icons/wallet.svg"
              alt="Solflare"
              width={16}
              height={16}
            />
          </div>
          <div className="text-left">
            <div className="text-white font-medium">Solflare</div>
            <div className="text-white/60 text-sm">
              Connect using Solflare wallet
            </div>
          </div>
        </button>

        <button
          onClick={() => handleConnect("other")}
          className="w-full flex items-center gap-3 p-4 border border-[#1E2938] hover:border-[#674AE5] hover:bg-white/5 rounded-sm transition-all duration-200"
        >
          <div className="w-8 h-8 bg-[#674AE5] rounded-md flex items-center justify-center">
            <Image src="/icons/wallet.svg" alt="Other" width={16} height={16} />
          </div>
          <div className="text-left">
            <div className="text-white font-medium">Other Wallet</div>
            <div className="text-white/60 text-sm">
              Connect using another wallet
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center">
        <p className="text-white/60 text-sm">
          By connecting a wallet, you agree to our terms of service.
        </p>
      </div>
    </>
  );

  const renderSmartVaultPage = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Smart Vault</h2>
        <button
          onClick={handleClose}
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

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <p className="text-white/80 mb-6 leading-relaxed">
          Smart vault keeps your funds in your control at all times. Using
          secure smart contracts, the casino never has access to your money.
        </p>

        {/* Features */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#674AE5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" fill="white" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5 2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-white">Full control over your assets</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#674AE5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" fill="white" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5 2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-white">Instant on-chain withdrawals</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#674AE5] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" fill="white" viewBox="0 0 12 12">
                <path
                  d="M10 3L4.5 8.5 2 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-white">No account or KYC required</span>
          </div>
        </div>

        {/* Activate Button */}
        <div className="mt-auto">
          <button
            onClick={handleActivateVault}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            Activate Smart Vault
          </button>

          {/* Deposit Message */}
          <p className="text-white/60 text-sm text-center">
            Deposit some SOL into your Phantom wallet to activate the smart
            vault.
          </p>
        </div>
      </div>
    </>
  );

  const renderAddFundsPage = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Add Funds</h2>
        <button
          onClick={handleClose}
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

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Token Selector */}
        <div className="mb-4">
          <label className="block text-white mb-2">Select token</label>
          <div className="flex items-center justify-between w-full h-[48px] px-3 border border-[#1E2938] hover:border-[#5C41E1] hover:bg-white/10 rounded-sm transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/sol.svg"
                alt="SOL"
                width={20}
                height={20}
                style={{ width: "auto", height: "auto" }}
              />
              <span className="text-white font-medium">SOL</span>
            </div>
            <Image
              src="/icons/downArrow.svg"
              alt="Dropdown"
              width={16}
              height={16}
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-white mb-2">Amount to Add</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-[48px] px-3 border border-[#1E2938] hover:border-[#5C41E1] focus:border-[#674AE5] bg-transparent text-white rounded-sm transition-all duration-200 outline-none"
          />
        </div>

        {/* Add Funds Button */}
        <div className="mt-auto">
          <button
            onClick={handleAddFunds}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            Add Funds
          </button>

          {/* Blank space to match other cards */}
          <div className="h-10"></div>
        </div>
      </div>
    </>
  );

  const renderCreateSessionPage = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Create Play Session</h2>
        <button
          onClick={handleClose}
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

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <p className="text-white/80 mb-6 leading-relaxed">
          Create a play timer to place bets.
        </p>

        {/* Renew Play Timer Button */}
        <div className="mt-auto">
          <button
            onClick={handleCreateSession}
            disabled={isConnecting}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            Renew Play Timer
          </button>

          {/* Blank space to match other cards */}
          <div className="h-10"></div>
        </div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#131216] border border-[#1E2938] rounded-sm p-6 w-96 max-w-[90vw] h-[500px] flex flex-col">
        {currentPage === "connect" && renderConnectPage()}
        {currentPage === "smartVault" && renderSmartVaultPage()}
        {currentPage === "addFunds" && renderAddFundsPage()}
        {currentPage === "createSession" && renderCreateSessionPage()}
      </div>
    </div>
  );
}
