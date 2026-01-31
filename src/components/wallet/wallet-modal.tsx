"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { walletToast, toast } from "@/lib/toast";

type ModalPage = "connect" | "smartVault" | "addFunds" | "createSession";

export function WalletModal() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    connect,
    setConnecting,
    isConnecting,
  } = useAuthStore();
  const {
    publicKey,
    connected,
    connecting,
    wallet,
    disconnect: disconnectWallet,
  } = useWallet();
  const [currentPage, setCurrentPage] = useState<ModalPage>("connect");
  const [amount, setAmount] = useState("");
  const [vaultCreated, setVaultCreated] = useState(false);
  const [fundsAdded, setFundsAdded] = useState(false);
  const prevConnectedRef = useRef(false);
  const hasShownToastRef = useRef(false);

  // Debug logging for all state changes
  console.log("🔄 WalletModal render:", {
    isWalletModalOpen,
    currentPage,
    connected,
    publicKey: publicKey?.toBase58().slice(0, 8),
    vaultCreated,
    fundsAdded,
    prevConnected: prevConnectedRef.current,
    hasShownToast: hasShownToastRef.current,
  });

  // Sync wallet adapter state with auth store and handle onboarding progression
  useEffect(() => {
    console.log("🚀 useEffect triggered");
    const wasConnected = prevConnectedRef.current;
    const isNowConnected = connected && !!publicKey;

    console.log("📊 Connection state:", {
      wasConnected,
      isNowConnected,
      connected,
      publicKey: publicKey?.toBase58().slice(0, 8),
      currentPage,
      vaultCreated,
      fundsAdded,
    });

    if (isNowConnected && !wasConnected) {
      console.log("✅ NEW WALLET CONNECTION DETECTED");

      // Sync with auth store
      connect(publicKey.toBase58());

      if (wallet && !hasShownToastRef.current) {
        console.log("📢 Showing wallet connect toast");
        walletToast.connected(wallet.adapter.name);
        hasShownToastRef.current = true;
      }

      // Always go to smartVault first after connection
      console.log("➡️ Auto-advancing to smartVault page");
      setCurrentPage("smartVault");
    } else if (!isNowConnected && wasConnected) {
      console.log("❌ WALLET DISCONNECTION DETECTED");
      // Wallet disconnected - reset flow
      setCurrentPage("connect");
      setVaultCreated(false);
      setFundsAdded(false);
      hasShownToastRef.current = false;
    } else {
      console.log("⏸️ No connection state change");
    }

    prevConnectedRef.current = isNowConnected;
    console.log(
      "🔚 useEffect complete, prevConnectedRef set to:",
      isNowConnected,
    );
  }, [connected, publicKey, wallet, connect]);

  if (!isWalletModalOpen) return null;

  const handleActivateVault = async () => {
    console.log("🏦 handleActivateVault called");
    try {
      setConnecting(true);
      console.log("⏳ Creating vault...");

      // Simulate vault creation (would call SDK vault.initializeUserVault)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("✅ Vault created successfully");
      setVaultCreated(true);
      toast.success("Vault created", "Your smart vault is ready to use");

      // Auto-advance to add funds
      console.log("➡️ Auto-advancing to addFunds");
      setCurrentPage("addFunds");
    } catch (error) {
      console.error("❌ Failed to create vault:", error);
      toast.error("Failed to create vault", (error as Error).message);
    } finally {
      setConnecting(false);
      console.log("🔚 handleActivateVault complete");
    }
  };

  const handleAddFunds = async () => {
    console.log("💰 handleAddFunds called with amount:", amount);
    if (!amount || parseFloat(amount) <= 0) {
      console.log("❌ Invalid amount");
      toast.warning("Invalid amount", "Please enter a valid amount");
      return;
    }

    try {
      setConnecting(true);
      console.log("⏳ Adding funds...");

      // Simulate deposit (would call SDK vault.depositSol)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("✅ Funds added successfully");
      setFundsAdded(true);
      toast.success("Funds added", `Deposited ${amount} SOL to your vault`);

      // Auto-advance to session creation
      console.log("➡️ Auto-advancing to createSession");
      setCurrentPage("createSession");
    } catch (error) {
      console.error("❌ Failed to add funds:", error);
      toast.error("Failed to add funds", (error as Error).message);
    } finally {
      setConnecting(false);
      console.log("🔚 handleAddFunds complete");
    }
  };

  const handleCreateSession = async () => {
    console.log("⏰ handleCreateSession called");
    try {
      setConnecting(true);
      console.log("⏳ Creating session...");

      // Simulate session/allowance creation (would call SDK allowance.createAllowance)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("✅ Session created successfully");
      toast.success("Session created", "You can now place bets!");

      // Close modal and reset
      console.log("🚪 Closing modal and resetting");
      handleClose();
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      toast.error("Failed to create session", (error as Error).message);
    } finally {
      setConnecting(false);
      console.log("🔚 handleCreateSession complete");
    }
  };

  const handleClose = () => {
    console.log("🚪 handleClose called");
    closeWalletModal();
    setCurrentPage(connected ? "smartVault" : "connect");
    setAmount("");
    console.log("🔚 Modal closed");
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

      {/* Wallet Connection */}
      <div className="space-y-4">
        {!connected ? (
          <div className="p-4 border border-[#1E2938] rounded-sm">
            <p className="text-white/80 mb-4 text-sm">
              Connect your Solana wallet to get started. We support Phantom,
              Solflare, and other popular wallets.
            </p>
            <WalletMultiButton className="!w-full !bg-[#674AE5] hover:!bg-[#8B75F6] !text-white !font-medium !py-3 !px-4 !rounded-sm !transition-colors !duration-200" />
          </div>
        ) : (
          <div className="p-4 border border-[#1E2938] rounded-sm bg-green-900/20">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
                  fill="#10B981"
                />
              </svg>
              <span className="text-green-400 font-medium">
                Wallet Connected
              </span>
            </div>
            <p className="text-white/60 text-sm">
              {publicKey?.toBase58().slice(0, 4)}...
              {publicKey?.toBase58().slice(-4)}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path
                d="M8 1L10.5 6L16 7L12 11L13 16L8 13.5L3 16L4 11L0 7L5.5 6L8 1Z"
                fill="#674AE5"
              />
            </svg>
            Secure connection via Solana wallet adapter
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path
                d="M8 1L10.5 6L16 7L12 11L13 16L8 13.5L3 16L4 11L0 7L5.5 6L8 1Z"
                fill="#674AE5"
              />
            </svg>
            Your keys, your crypto - we never have access
          </div>
        </div>
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
            <span className="text-white">Instant on-chain withdrawals</span>
          </div>
        </div>

        {/* Activate Button */}
        <div className="mt-auto">
          <button
            onClick={handleActivateVault}
            disabled={isConnecting || !connected}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            {isConnecting ? "Creating Vault..." : "Activate Smart Vault"}
          </button>

          {/* Deposit Message */}
          <p className="text-white/60 text-sm text-center">
            {connected
              ? "Click to create your smart vault on-chain"
              : "Connect your wallet first to activate the vault"}
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
            disabled={isConnecting || !amount || parseFloat(amount) <= 0}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            {isConnecting ? "Adding Funds..." : "Add Funds"}
          </button>

          {/* Info */}
          <p className="text-white/60 text-sm text-center">
            Funds will be deposited from your wallet to your smart vault
          </p>
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
        <p className="text-white/80 mb-4 leading-relaxed">
          Create a play session to enable betting. This approves the casino to
          spend up to a certain amount for your bets.
        </p>

        {/* Session Details */}
        <div className="bg-[#211F28] p-4 rounded-sm mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-sm">Session Duration</span>
            <span className="text-white font-medium">1 hour</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Max Spend Limit</span>
            <span className="text-white font-medium">
              {amount || "0.00"} SOL
            </span>
          </div>
        </div>

        {/* Renew Play Timer Button */}
        <div className="mt-auto">
          <button
            onClick={handleCreateSession}
            disabled={isConnecting}
            className="w-full bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-sm transition-colors duration-200 mb-4"
          >
            {isConnecting ? "Creating Session..." : "Create Play Session"}
          </button>

          {/* Info */}

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
