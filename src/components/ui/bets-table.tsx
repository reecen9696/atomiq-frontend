"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { LiveBet } from "@/hooks/use-live-bets";
import { BetVerifyModal } from "@/components/ui/bet-verify-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface BetsTableProps {
  bets: LiveBet[];
  isLoading?: boolean;
  className?: string;
}

const TableHeader = React.memo(() => (
  <div className="grid grid-cols-[1fr_1fr_auto] md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#2A2E38]">
    <div className="text-[12px] font-normal text-[#828998]">User</div>
    <div className="hidden md:block text-[12px] font-normal text-[#828998]">
      Game
    </div>
    <div className="hidden md:block text-[12px] font-normal text-[#828998]">
      Bet Amount
    </div>
    <div className="hidden md:block text-[12px] font-normal text-[#828998]">
      Multiplier
    </div>
    <div className="text-[12px] font-normal text-[#828998]">Payout</div>
    <div className="text-[12px] font-normal text-[#828998]">Verify</div>
  </div>
));
TableHeader.displayName = "TableHeader";

const TableRow = React.memo<{
  bet: LiveBet;
  onVerify: (bet: LiveBet) => void;
}>(({ bet, onVerify }) => (
  <div className="grid grid-cols-[1fr_1fr_auto] md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_auto] gap-4 px-4 h-[55px] items-center">
    {/* User */}
    <div className="flex items-center gap-2 min-w-0">
      <Image
        src="/icons/user.svg"
        alt="User"
        width={16}
        height={16}
        style={{ width: "auto", height: "auto" }}
      />
      <span className="text-[14px] font-medium text-white truncate">
        {bet.userDisplay}
      </span>
    </div>

    {/* Game */}
    <div className="hidden md:flex items-center gap-2">
      <Image
        src={bet.gameImage}
        alt={bet.gameType}
        width={22}
        height={22}
        className="rounded-sm object-cover"
      />
      <span className="text-[14px] font-medium text-white">{bet.gameType}</span>
    </div>

    {/* Bet Amount */}
    <div className="hidden md:flex items-center gap-2">
      <Image
        src="/icons/sol.svg"
        alt="SOL"
        width={14}
        height={14}
        style={{ width: "auto", height: "auto" }}
      />
      <span className="text-[14px] font-medium text-white">
        {bet.betAmount}
      </span>
    </div>

    {/* Multiplier */}
    <div className="hidden md:flex items-center">
      <span className="text-[14px] font-medium text-white">
        {bet.multiplier}
      </span>
    </div>

    {/* Payout */}
    <div className="flex items-center gap-2">
      <Image
        src="/icons/sol.svg"
        alt="SOL"
        width={14}
        height={14}
        style={{ width: "auto", height: "auto" }}
      />
      <span
        className={`text-[14px] font-medium ${
          bet.isWin ? "text-[#03BD6C]" : "text-white"
        }`}
      >
        {bet.payout}
      </span>
    </div>

    {/* Verify */}
    <div className="flex items-center justify-end">
      <button
        onClick={() => onVerify(bet)}
        title="View provable fairness proof"
        className="w-7 h-7 flex items-center justify-center rounded-md text-[#828998] hover:text-[#7717ff] hover:bg-[#7717ff]/10 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.5 2.5H2.5C1.948 2.5 1.5 2.948 1.5 3.5V11.5C1.5 12.052 1.948 12.5 2.5 12.5H10.5C11.052 12.5 11.5 12.052 11.5 11.5V8.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 1.5H12.5M12.5 1.5V5.5M12.5 1.5L6.5 7.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
));
TableRow.displayName = "TableRow";

export const BetsTable = React.memo<BetsTableProps>(
  ({ bets, isLoading = false, className = "" }) => {
    const [selectedBet, setSelectedBet] = useState<LiveBet | null>(null);

    if (isLoading) {
      return (
        <div className={`mt-4 ${className}`}>
          <TableHeader />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_auto] gap-4 px-4 h-[55px] items-center"
            >
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <Skeleton className="h-4 w-12 rounded hidden md:block" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (bets.length === 0) {
      return (
        <div className={`mt-4 ${className}`}>
          <TableHeader />
          <div className="flex items-center justify-center h-32 text-[#828998] text-sm">
            No bets yet
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`mt-4 ${className}`}>
          <TableHeader />
          {bets.map((bet) => (
            <TableRow
              key={bet.id}
              bet={bet}
              onVerify={setSelectedBet}
            />
          ))}
        </div>

        {selectedBet && (
          <BetVerifyModal
            bet={selectedBet}
            onClose={() => setSelectedBet(null)}
          />
        )}
      </>
    );
  },
);

BetsTable.displayName = "BetsTable";
