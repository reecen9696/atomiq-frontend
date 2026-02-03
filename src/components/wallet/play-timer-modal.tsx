"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAllowanceForCasino } from "@/lib/sdk/hooks/useAllowance";
import { createAllowanceService } from "@/lib/sdk/allowance/service";
import { toast } from "@/lib/toast";
import { solanaService } from "@/services/solana";

interface PlayTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODAL_HEIGHT = "600px";
const CLOSE_BUTTON_SVG_PATH = "M6 6l12 12M6 18L18 6";

export function PlayTimerModal({ isOpen, onClose }: PlayTimerModalProps) {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const allowanceService = createAllowanceService(
    solanaService.getConnection(),
  );
  const allowanceHook = useAllowanceForCasino(
    publicKey?.toBase58() || null,
    allowanceService,
    sendTransaction,
    signTransaction || undefined,
  );

  const [timeRemaining, setTimeRemaining] = useState<string>("--:--:--");
  const [expiresAt, setExpiresAt] = useState<bigint | null>(null);
  const [allowanceData, setAllowanceData] = useState<any>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Fetch the most recent active allowance when modal opens
  useEffect(() => {
    if (!isOpen || !publicKey) {
      return;
    }

    const fetchAllowanceInfo = async () => {
      setIsLoadingAllowance(true);
      setLoadingTimedOut(false);

      try {
        // First, try to get cached play session data
        const cachedSession = allowanceHook.getCachedPlaySession();

        if (cachedSession) {
          // Use cached PDA to fetch current balance from blockchain
          const allowanceInfo = await allowanceService.getAllowanceInfo(
            cachedSession.allowancePda,
            allowanceService.getConnection(),
          );

          if (allowanceInfo.accountExists && allowanceInfo.allowanceData) {
            const data = allowanceInfo.allowanceData;
            setExpiresAt(BigInt(data.expiresAt));
            setAllowanceData(data);

            // Calculate progress percentage from on-chain data
            const totalAmount = Number(data.amountLamports);
            const remainingAmount = Number(data.remainingLamports);
            const percentage =
              totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;
            setProgressPercentage(Math.max(0, Math.min(100, percentage)));

            setIsLoadingAllowance(false);
            return; // Exit early
          }
        }

        // If no valid cache, check if user has any allowances at all
        console.log(
          "📊 No cached data found, checking if user has any allowances...",
        );
        try {
          const nextNonce = await allowanceHook.getNextNonce("casino");
          console.log("🔢 Next nonce would be:", nextNonce);

          if (nextNonce === 0) {
            console.log(
              "❌ No allowances found - user needs to create one first",
            );
            setExpiresAt(null);
            setAllowanceData(null);
            setProgressPercentage(0);
            setIsLoadingAllowance(false);
            return;
          }
        } catch (nonceError) {
          console.warn("⚠️ Could not get next nonce:", nonceError);
        }

        // Fallback: Only use slow on-chain scanning as last resort
        console.log(
          "🐌 No cache available, falling back to slow on-chain scan...",
        );
        console.log("⚠️ This is slow and should only happen once per user");

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000),
        );

        let mostRecent;
        try {
          mostRecent = await Promise.race([
            allowanceHook.getMostRecentActive(),
            timeoutPromise,
          ]);
        } catch (error) {
          if ((error as Error)?.message === "Timeout") {
            console.warn(
              "⏰ On-chain scan timed out - this is expected with many allowances",
            );
            setLoadingTimedOut(true);
            setExpiresAt(null);
            setAllowanceData(null);
            setProgressPercentage(0);
            setIsLoadingAllowance(false);
            return;
          }
          throw error;
        }

        if (
          mostRecent &&
          typeof mostRecent === "object" &&
          "data" in mostRecent &&
          mostRecent.data
        ) {
          setExpiresAt((mostRecent.data as any).expiresAt);
          setAllowanceData(mostRecent.data as any);

          // Calculate progress percentage
          const totalAmount = Number((mostRecent.data as any).amountLamports);
          const remainingAmount = Number(
            (mostRecent.data as any).remainingLamports,
          );
          const percentage =
            totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;
          setProgressPercentage(Math.max(0, Math.min(100, percentage)));

          // Cache the PDA for future instant loading
          const playSessionData = {
            allowancePda: (mostRecent as any).allowancePda,
            expiresAt: Number((mostRecent.data as any).expiresAt),
            nonce: (mostRecent as any).nonce,
          };
          allowanceHook.savePlaySessionData(playSessionData);
        } else {
          console.warn("⚠️ No active allowance found");
          setExpiresAt(null);
          setAllowanceData(null);
          setProgressPercentage(0);
        }
      } catch (error) {
        console.error("❌ Failed to fetch allowance info:", error);
        setExpiresAt(null);
        setAllowanceData(null);
        setProgressPercentage(0);
      } finally {
        setIsLoadingAllowance(false);
      }
    };

    fetchAllowanceInfo();
  }, [isOpen, publicKey?.toBase58()]); // Fixed dependency to prevent infinite re-renders

  // Update countdown timer every second
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining("--:--:--");
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const expirySeconds = Number(expiresAt);
      const remaining = expirySeconds - now;

      if (remaining <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleExtendTimer = useCallback(async () => {
    if (!publicKey || !sendTransaction) {
      toast.error(
        "Wallet not connected",
        "Please connect your wallet to extend session",
      );
      return;
    }

    try {
      // Extend allowance for another 10000 seconds (same as initial duration)
      const result = await allowanceHook.extend(10000);

      if (result) {
        toast.success(
          "Session extended",
          "Your play session has been extended successfully",
        );
        console.log("🔄 Session extended:", result.signature);
        console.log("📍 Allowance PDA:", result.allowancePda);

        // Get updated cached data (should be available immediately after extension)
        const updatedCache = allowanceHook.getCachedPlaySession();
        if (updatedCache) {
          // Fetch fresh balance from blockchain using cached PDA
          const allowanceInfo = await allowanceService.getAllowanceInfo(
            updatedCache.allowancePda,
            allowanceService.getConnection(),
          );

          if (allowanceInfo.accountExists && allowanceInfo.allowanceData) {
            const data = allowanceInfo.allowanceData;
            setExpiresAt(BigInt(data.expiresAt));
            setAllowanceData(data);

            // Update progress percentage
            const totalAmount = Number(data.amountLamports);
            const remainingAmount = Number(data.remainingLamports);
            const percentage =
              totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;
            setProgressPercentage(Math.max(0, Math.min(100, percentage)));
          }
        } else {
          // Fallback to slow refresh if cache not available
          const mostRecent = await allowanceHook.getMostRecentActive();
          if (mostRecent?.data) {
            setExpiresAt(mostRecent.data.expiresAt);
            setAllowanceData(mostRecent.data);

            const totalAmount = Number(mostRecent.data.amountLamports);
            const remainingAmount = Number(mostRecent.data.remainingLamports);
            const percentage =
              totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;
            setProgressPercentage(Math.max(0, Math.min(100, percentage)));
          }
        }

        onClose();
      } else {
        // Error was already handled in the hook and displayed in toast
        console.error("Failed to extend session - no result returned");
      }
    } catch (error) {
      console.error("❌ Failed to extend session:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to extend session";
      toast.error("Extension failed", errorMsg);
    }
  }, [publicKey, sendTransaction, allowanceHook, onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleCloseClick}
    >
      <div
        className="bg-[#131216] border border-[#1E2938] rounded-md p-8 w-full max-w-md mx-4 flex flex-col"
        style={{ minHeight: MODAL_HEIGHT, maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white text-xl font-medium">
            Extend Play Session
          </h2>
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

        {/* Timer Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#674AE5]/20 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="32px"
              viewBox="0 -960 960 960"
              width="32px"
              fill="#674AE5"
            >
              <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8 flex-1">
          <h3 className="text-white text-lg font-medium mb-4">
            Extend Your Play Session
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Your current play session is about to expire. Would you like to
            extend it for another hour of gaming?
          </p>

          {/* Timer Display */}
          <div className="bg-[#211F28] rounded-sm p-4 mb-6">
            <div className="text-white/40 text-xs mb-2">TIME REMAINING</div>
            <div className="text-white text-2xl font-mono mb-4">
              {timeRemaining}
            </div>

            {/* Progress Bar for Remaining Funds */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/40 text-xs">REMAINING FUNDS</span>
                <span className="text-white text-xs">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-[#131216] rounded-sm h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#674AE5] to-[#8B75F6] transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {allowanceData ? (
                <div className="flex justify-between items-center mt-2 text-xs text-white/60">
                  <span>
                    {(Number(allowanceData.remainingLamports) / 1e9).toFixed(4)}{" "}
                    SOL
                  </span>
                  <span>
                    of {(Number(allowanceData.amountLamports) / 1e9).toFixed(4)}{" "}
                    SOL
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-xs text-white/60 text-center">
                  No active allowance found
                </div>
              )}
            </div>
          </div>

          {/* Loading Timeout Warning */}
          {loadingTimedOut && (
            <div className="bg-orange-900/20 border border-orange-600/30 rounded-sm p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <div className="text-orange-300 text-sm font-medium mb-1">
                    No Cached Data
                  </div>
                  <div className="text-orange-400/80 text-xs">
                    On-chain scan timed out. Use "Test Direct PDA" or create a
                    new allowance to enable instant loading.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Allowance Warning */}
          {!allowanceData &&
            timeRemaining === "--:--:--" &&
            !isLoadingAllowance &&
            !loadingTimedOut && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-sm p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-yellow-300 text-sm font-medium mb-1">
                      No Active Session
                    </div>
                    <div className="text-yellow-400/80 text-xs">
                      You don't have an active play session. Create an allowance
                      in your wallet to start playing.
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Loading State */}
          {isLoadingAllowance && (
            <div className="bg-[#211F28] rounded-sm p-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-3 text-white/60">
                <svg
                  className="animate-spin h-5 w-5 text-[#674AE5]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm">Loading session data...</span>
              </div>
              <div className="text-xs text-white/40 mt-2">
                Checking localStorage cache first, then blockchain if needed
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto flex-shrink-0">
          <button
            onClick={handleExtendTimer}
            disabled={allowanceHook.extending || !publicKey}
            className="w-full px-6 py-3 bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm transition-colors"
          >
            {allowanceHook.extending ? "Extending..." : "Extend Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
