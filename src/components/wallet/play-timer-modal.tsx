"use client";

import { useState, useCallback } from "react";

interface PlayTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODAL_HEIGHT = "500px";
const CLOSE_BUTTON_SVG_PATH = "M6 6l12 12M6 18L18 6";

export function PlayTimerModal({ isOpen, onClose }: PlayTimerModalProps) {
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendTimer = useCallback(async () => {
    setIsExtending(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsExtending(false);
    onClose();
  }, [onClose]);

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
            <div className="text-white text-2xl font-mono">00:05:32</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={handleExtendTimer}
            disabled={isExtending}
            className="w-full px-6 py-3 bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm transition-colors"
          >
            {isExtending ? "Extending..." : "Extend Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
