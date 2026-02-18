"use client";

import { useGameAvailability } from "@/hooks/use-game-availability";

interface GameAvailabilityWrapperProps {
  children: React.ReactNode;
}

export function GameAvailabilityWrapper({
  children,
}: GameAvailabilityWrapperProps) {
  const { isAvailable, reason } = useGameAvailability();

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Overlay when game is not available */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="text-center px-8 py-6 bg-[#1A1820] rounded-lg border border-white/10 max-w-md">
            <p className="text-white text-lg font-medium leading-relaxed">
              {reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
