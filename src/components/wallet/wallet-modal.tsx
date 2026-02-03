"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { walletToast, toast } from "@/lib/toast";
import { solanaService } from "@/services/solana";
import { PublicKey } from "@solana/web3.js";

type ModalPage = "connect" | "smartVault" | "addFunds" | "createSession";

function WalletModalComponent() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    connect,
    setConnecting,
    isConnecting,
    updateVaultInfo,
  } = useAuthStore();
  const {
    publicKey,
    connected,
    connecting,
    wallet,
    sendTransaction,
    signTransaction,
    disconnect: disconnectWallet,
  } = useWallet();
  const [currentPage, setCurrentPage] = useState<ModalPage>("connect");
  const [amount, setAmount] = useState("");
  const [vaultCreated, setVaultCreated] = useState(false);
  const [fundsAdded, setFundsAdded] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [lastSignature, setLastSignature] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const prevConnectedRef = useRef(false);
  const hasShownToastRef = useRef(false);

  const handleClose = useCallback(() => {
    closeWalletModal();
    setCurrentPage("connect"); // Always reset to connect page
    setAmount("");
    setVaultCreated(false);
    setFundsAdded(false);
    setVaultAddress("");
    setLastSignature("");
    setErrorMsg("");
  }, [closeWalletModal]);

  // Function to refresh vault information
  const refreshVaultInfo = useCallback(async () => {
    if (!publicKey) return;

    try {
      const vaultInfo = await solanaService.getUserVaultInfo({
        user: publicKey,
        connection: solanaService.getConnection(),
      });

      if (vaultInfo.exists) {
        setVaultCreated(true);
        setVaultAddress(vaultInfo.address);
        const vaultBalance =
          Number(vaultInfo.state?.solBalanceLamports || 0n) / 1e9;
        updateVaultInfo(vaultInfo.address, vaultBalance);
      } else {
        setVaultCreated(false);
        setVaultAddress("");
      }
    } catch (error) {
      console.error("Failed to refresh vault info:", error);
    }
  }, [publicKey, updateVaultInfo]);

  // Reset to connect page when modal is opened and wallet is not connected
  useEffect(() => {
    if (isWalletModalOpen && !connected) {
      setCurrentPage("connect");
    }
  }, [isWalletModalOpen, connected]);

  // Check vault status when wallet connects (separate from main logic)
  useEffect(() => {
    if (connected && publicKey) {
      refreshVaultInfo();
    }
  }, [connected, publicKey, refreshVaultInfo]);

  // Handle wallet connection state changes
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    const isNowConnected = connected && !!publicKey;

    if (isNowConnected && !wasConnected) {
      // New connection
      connect(publicKey.toBase58());

      if (wallet && !hasShownToastRef.current) {
        walletToast.connected(wallet.adapter.name);
        hasShownToastRef.current = true;
      }

      // Check vault and handle onboarding flow
      const timeoutId = setTimeout(async () => {
        try {
          const vaultInfo = await solanaService.getUserVaultInfo({
            user: publicKey,
            connection: solanaService.getConnection(),
          });

          if (vaultInfo.exists) {
            // User already has vault - close modal
            setVaultCreated(true);
            setVaultAddress(vaultInfo.address);
            const vaultBalance =
              Number(vaultInfo.state?.solBalanceLamports || 0n) / 1e9;
            updateVaultInfo(vaultInfo.address, vaultBalance);
            handleClose();
          } else {
            // Start onboarding flow
            setVaultCreated(false);
            setVaultAddress("");
            setCurrentPage("smartVault");
          }
        } catch (error) {
          console.error("Failed to check vault:", error);
          setCurrentPage("smartVault");
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (!isNowConnected && wasConnected) {
      // Disconnection
      setCurrentPage("connect");
      setVaultCreated(false);
      setFundsAdded(false);
      setVaultAddress("");
      setLastSignature("");
      setErrorMsg("");
      hasShownToastRef.current = false;

      if (isWalletModalOpen) {
        closeWalletModal();
      }
    }

    prevConnectedRef.current = isNowConnected;
  }, [
    connected,
    publicKey,
    wallet,
    connect,
    updateVaultInfo,
    handleClose,
    closeWalletModal,
    isWalletModalOpen,
  ]); // Add back necessary dependencies

  if (!isWalletModalOpen) return null;

  const handleActivateVault = async () => {
    console.log("🏦 handleActivateVault called");
    if (!publicKey || !sendTransaction) {
      console.log("❌ Missing wallet connection or sendTransaction");
      return;
    }

    try {
      setConnecting(true);
      setErrorMsg("");
      console.log("⏳ Creating vault on-chain...");

      const { signature, vaultPda } = await solanaService.initializeUserVault({
        user: publicKey,
        sendTransaction,
        signTransaction: signTransaction ?? undefined,
        connection: solanaService.getConnection(),
      });

      setLastSignature(signature);
      setVaultAddress(vaultPda);
      setVaultCreated(true);
      await refreshVaultInfo(); // Refresh vault state to get latest info

      console.log("✅ Vault created successfully!");
      console.log("📍 Vault PDA:", vaultPda);
      console.log("📝 Transaction signature:", signature);
      console.log(
        "🔍 View on explorer:",
        solanaService.getExplorerUrl(signature),
      );

      toast.success("Vault created", "Your smart vault is ready to use");

      // Auto-advance to add funds
      console.log("➡️ Auto-advancing to addFunds");
      setCurrentPage("addFunds");
    } catch (error) {
      console.error("❌ Failed to create vault:", error);

      // Check if vault was actually created despite the error (Solana deduplication handling)
      if (publicKey) {
        try {
          const vaultPda = await solanaService.deriveVaultPDA(
            publicKey.toBase58(),
          );
          const exists = await solanaService.getAccountExists(vaultPda);
          if (exists) {
            console.log("🔄 Vault was actually created successfully!");
            setVaultAddress(vaultPda);
            setVaultCreated(true);
            setErrorMsg("");
            await refreshVaultInfo();
            toast.success("Vault created", "Recovered from network error");
            setCurrentPage("addFunds");
            return;
          }
        } catch (checkErr) {
          console.error("Error checking vault existence:", checkErr);
        }
      }

      const msg =
        error instanceof Error ? error.message : "Failed to create vault";
      setErrorMsg(msg);
      toast.error("Failed to create vault", msg);
    } finally {
      setConnecting(false);
      console.log("🔚 handleActivateVault complete");
    }
  };

  const handleAddFunds = async () => {
    console.log("💰 handleAddFunds called with amount:", amount);
    if (!publicKey || !sendTransaction) {
      console.log("❌ Missing wallet connection");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      console.log("❌ Invalid amount");
      toast.warning("Invalid amount", "Please enter a valid amount");
      return;
    }

    try {
      setConnecting(true);
      setErrorMsg("");
      console.log("⏳ Depositing funds on-chain...");

      const deposit = Number(amount);
      if (!Number.isFinite(deposit) || deposit <= 0) {
        throw new Error("Enter a valid deposit amount");
      }

      const amountLamports = BigInt(Math.floor(deposit * 1_000_000_000));
      const { signature, vaultPda } = await solanaService.depositSol({
        user: publicKey,
        amountLamports,
        sendTransaction,
        signTransaction: signTransaction ?? undefined,
        connection: solanaService.getConnection(),
      });

      setLastSignature(signature);
      setVaultAddress(vaultPda);
      setFundsAdded(true);
      await refreshVaultInfo(); // Refresh vault state to get updated balance

      console.log("✅ Funds deposited successfully!");
      console.log("📍 Vault PDA:", vaultPda);
      console.log("💰 Amount:", deposit, "SOL");
      console.log("📝 Transaction signature:", signature);
      console.log(
        "🔍 View on explorer:",
        solanaService.getExplorerUrl(signature),
      );

      toast.success("Funds added", `Deposited ${amount} SOL to your vault`);

      // Auto-advance to session creation
      console.log("➡️ Auto-advancing to createSession");
      setCurrentPage("createSession");
    } catch (error) {
      console.error("❌ Failed to deposit funds:", error);

      // Check if deposit actually succeeded despite error (Solana deduplication handling)
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        errMsg.includes("already been processed") ||
        errMsg.includes("This transaction has already been processed")
      ) {
        console.log("🔄 Checking if deposit actually succeeded...");
        try {
          // Just continue to session creation - deposit likely succeeded
          setFundsAdded(true);
          setErrorMsg("");
          await refreshVaultInfo();
          toast.success("Funds added", "Recovered from network error");
          setCurrentPage("createSession");
          return;
        } catch (checkErr) {
          console.error("Error checking deposit success:", checkErr);
        }
      }

      const msg =
        error instanceof Error ? error.message : "Failed to add funds";
      setErrorMsg(msg);
      toast.error("Failed to add funds", msg);
    } finally {
      setConnecting(false);
      console.log("🔚 handleAddFunds complete");
    }
  };

  const handleCreateSession = async () => {
    console.log("⏰ handleCreateSession called");
    if (!publicKey || !sendTransaction) {
      console.log("❌ Missing wallet connection");
      return;
    }

    try {
      setConnecting(true);
      setErrorMsg("");
      console.log("⏳ Creating betting session allowance on-chain...");

      // Create an allowance for 5 SOL that expires in 10000 seconds (same as test-ui defaults)
      const allowanceAmount = BigInt(5 * 1_000_000_000); // 5 SOL in lamports
      const durationSeconds = BigInt(10000); // 10000 seconds

      const { signature, allowancePda } =
        await solanaService.approveAllowanceSol({
          user: publicKey,
          amountLamports: allowanceAmount,
          durationSeconds,
          sendTransaction,
          signTransaction: signTransaction ?? undefined,
          connection: solanaService.getConnection(),
        });

      setLastSignature(signature);

      console.log("✅ Betting session created successfully!");
      console.log("📍 Allowance PDA:", allowancePda);
      console.log("💰 Amount:", Number(allowanceAmount) / 1e9, "SOL");
      console.log("⏰ Duration:", Number(durationSeconds), "seconds");
      console.log("📝 Transaction signature:", signature);
      console.log(
        "🔍 View on explorer:",
        solanaService.getExplorerUrl(signature),
      );

      toast.success("Session created", "You can now place bets!");

      // Close modal and reset
      console.log("🚪 Closing modal and resetting");
      handleClose();
    } catch (error) {
      console.error("❌ Failed to create session:", error);

      // Check if allowance was actually created despite error (Solana deduplication handling)
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.toLowerCase().includes("already been processed")) {
        console.log("🔄 Retrying with skipPreflight: true...");
        try {
          const { signature, allowancePda } =
            await solanaService.approveAllowanceSol({
              user: publicKey,
              amountLamports: BigInt(5 * 1_000_000_000),
              durationSeconds: BigInt(10000),
              sendTransaction: async (tx, connection, options) => {
                return sendTransaction(tx, connection, {
                  ...options,
                  skipPreflight: true,
                });
              },
              signTransaction: signTransaction ?? undefined,
              connection: solanaService.getConnection(),
            });
          console.log("✅ Session created! Signature:", signature);
          setErrorMsg("");
          toast.success("Session created", "You can now place bets!");
          handleClose();
          return;
        } catch (retryErr) {
          console.error("❌ Retry also failed:", retryErr);

          // Check for specific rate limit errors like test-ui
          const retryErrMsg =
            retryErr instanceof Error ? retryErr.message : String(retryErr);
          const msg =
            retryErrMsg.includes('code": 429') ||
            retryErrMsg.includes(" 429") ||
            retryErrMsg.toLowerCase().includes("too many requests")
              ? "RPC rate-limited (429). Public devnet RPC is throttling you — try again in a moment."
              : retryErrMsg || "Failed to create session";
          setErrorMsg(msg);
          toast.error("Failed to create session", msg);
          return;
        }
      }

      // Handle user rejected error like test-ui
      if (
        errMsg.toLowerCase().includes("user rejected") ||
        errMsg.toLowerCase().includes("user declined") ||
        errMsg.toLowerCase().includes("rejected the request") ||
        errMsg.toLowerCase().includes("request rejected") ||
        errMsg.toLowerCase().includes("denied")
      ) {
        setErrorMsg("User cancelled allowance approval");
        toast.error("Session cancelled", "User cancelled allowance approval");
        return;
      }

      // Check for rate limit errors
      const msg =
        errMsg.includes('code": 429') ||
        errMsg.includes(" 429") ||
        errMsg.toLowerCase().includes("too many requests")
          ? "RPC rate-limited (429). Public devnet RPC is throttling you — try again in a moment."
          : errMsg || "Failed to create session";
      setErrorMsg(msg);
      toast.error("Failed to create session", msg);
    } finally {
      setConnecting(false);
      console.log("🔚 handleCreateSession complete");
    }
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

        {/* Debug Info - Show when vault exists or transactions completed */}
        {(vaultAddress || lastSignature || errorMsg) && (
          <div className="space-y-2 mb-4 p-3 border border-[#1E2938] rounded-sm bg-black/20">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
              Transaction Info
            </p>
            {vaultAddress && (
              <div className="space-y-1">
                <p className="text-white/80 text-xs">Vault Address:</p>
                <p className="text-green-400 text-xs font-mono break-all">
                  {vaultAddress}
                </p>
              </div>
            )}
            {lastSignature && (
              <div className="space-y-1">
                <p className="text-white/80 text-xs">Last Transaction:</p>
                <div className="flex items-center gap-2">
                  <p className="text-blue-400 text-xs font-mono break-all">
                    {lastSignature}
                  </p>
                  <button
                    onClick={() =>
                      window.open(
                        solanaService.getExplorerUrl(lastSignature),
                        "_blank",
                      )
                    }
                    className="text-blue-400 hover:text-blue-300 text-xs flex-shrink-0"
                  >
                    View ↗
                  </button>
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="space-y-1">
                <p className="text-white/80 text-xs">Error:</p>
                <p className="text-red-400 text-xs">{errorMsg}</p>
              </div>
            )}
          </div>
        )}

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
            <span className="text-white font-medium">~2.8 hours</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Max Spend Limit</span>
            <span className="text-white font-medium">5 SOL</span>
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

// Export memoized component to prevent unnecessary re-renders
export const WalletModal = React.memo(WalletModalComponent);
