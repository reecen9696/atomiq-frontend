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

const MODAL_HEIGHT = "500px";
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

  // Fetch the most recent active allowance when modal opens
  useEffect(() => {
    if (!isOpen || !publicKey) return;

    const fetchAllowanceInfo = async () => {
      try {
        const mostRecent = await allowanceHook.getMostRecentActive();
        console.log("📊 Most recent allowance:", mostRecent);

        if (mostRecent?.data?.expiresAt) {
          setExpiresAt(mostRecent.data.expiresAt);
          console.log(
            "⏰ Setting expires at:",
            new Date(Number(mostRecent.data.expiresAt) * 1000).toLocaleString(),
          );
        } else {
          console.warn("⚠️ No active allowance found or missing expiresAt");
          setExpiresAt(null);
        }
      } catch (error) {
        console.error("❌ Failed to fetch allowance info:", error);
        setExpiresAt(null);
      }
    };

    fetchAllowanceInfo();
  }, [isOpen, publicKey, allowanceHook]);

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

        // Refresh the allowance info to get updated expiry time
        const mostRecent = await allowanceHook.getMostRecentActive();
        if (mostRecent?.data?.expiresAt) {
          setExpiresAt(mostRecent.data.expiresAt);
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
        className="bg-[#131216] border border-[#1E2938] rounded-md p-8 w-full max-w-md mx-4"
        style={{ height: MODAL_HEIGHT }}
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
        <div className="text-center mb-8">
          <h3 className="text-white text-lg font-medium mb-4">
            Extend Your Play Session
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Your current play session is about to expire. Would you like to
            extend it for another hour of gaming?
          </p>

          {/* Timer Display */}
          <div className="bg-[#211F28] rounded-sm p-4 mb-6">
            <div className="text-white/40 text-xs mb-1">TIME REMAINING</div>
            <div className="text-white text-2xl font-mono">{timeRemaining}</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
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
