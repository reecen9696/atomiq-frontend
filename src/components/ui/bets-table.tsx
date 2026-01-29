/**
 * BetsTable Component
 * Displays latest betting data in a responsive table format
 */

import React from "react";
import Image from "next/image";
import { BetData } from "@/mocks/bets";
import { colors, components } from '@/design-system/tokens';

interface BetsTableProps {
  bets: BetData[];
  className?: string;
}

interface TableRowProps {
  bet: BetData;
  index: number;
}

const TableHeader = React.memo(() => (
  <div className="grid grid-cols-[1fr_1fr] md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr] gap-4 px-4 py-3 border-b border-[#2A2E38]">
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
  </div>
));

TableHeader.displayName = "TableHeader";

const TableRow = React.memo<TableRowProps>(({ bet, index }) => (
  <div
    className={`grid grid-cols-[1fr_1fr] md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr] gap-4 px-4 h-[55px] ${
      index % 2 === 1 ? "bg-[#131216]/60" : ""
    }`}
  >
    <div className="flex items-center justify-start gap-2">
      <Image
        src="/icons/user.svg"
        alt="User"
        width={16}
        height={16}
        style={{ width: "auto", height: "auto" }}
      />
      <span className="text-[14px] font-medium text-white">{bet.user}</span>
    </div>
    <div className="hidden md:flex items-center justify-start gap-2">
      <Image
        src="/icons/coinflip.svg"
        alt="CoinFlip"
        width={24}
        height={24}
        style={{ width: "auto", height: "auto" }}
      />
      <span className="text-[14px] font-medium text-white">{bet.game}</span>
    </div>
    <div className="hidden md:flex items-center justify-start gap-2">
      <Image
        src="/icons/sol.svg"
        alt="SOL"
        width={14}
        height={14}
        style={{ width: "auto", height: "auto" }}
      />
      <span className="text-[14px] font-medium text-white">{bet.bet}</span>
    </div>
    <div className="hidden md:flex items-center justify-start">
      <span className="text-[14px] font-medium text-white">
        {bet.multiplier}
      </span>
    </div>
    <div className="flex items-center justify-start gap-2">
      <Image
        src="/icons/sol.svg"
        alt="SOL"
        width={14}
        height={14}
        style={{ width: "auto", height: "auto" }}
      />
      <span
        className={`text-[14px] font-medium ${bet.positive ? "text-[#03BD6C]" : "text-white"}`}
      >
        {bet.payout}
      </span>
    </div>
  </div>
));

TableRow.displayName = "TableRow";

export const BetsTable = React.memo<BetsTableProps>(
  ({ bets, className = "" }) => {
    return (
      <div className={`mt-4 ${className}`}>
        <TableHeader />
        {bets.map((bet, index) => (
          <TableRow key={bet.id} bet={bet} index={index} />
        ))}
      </div>
    );
  },
);

BetsTable.displayName = "BetsTable";
