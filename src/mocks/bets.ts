/**
 * Mock data for Latest Bets table
 * Contains sample betting data for display purposes
 */

export interface BetData {
  id: string;
  user: string;
  game: string;
  bet: string;
  multiplier: string;
  payout: string;
  positive: boolean;
  timestamp: Date;
  userColor: string;
  gameColor: string;
  betColor: string;
  payoutColor: string;
}

export const latestBetsData: BetData[] = [
  {
    id: "1",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "1.50x",
    payout: "-0.02850400",
    positive: false,
    timestamp: new Date("2026-01-29T10:00:00Z"),
    userColor: "bg-purple-500",
    gameColor: "bg-gray-500",
    betColor: "bg-green-500",
    payoutColor: "bg-blue-500",
  },
  {
    id: "2",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "1.15x",
    payout: "0.02850400",
    positive: true,
    timestamp: new Date("2026-01-29T10:01:00Z"),
    userColor: "bg-pink-500",
    gameColor: "bg-yellow-500",
    betColor: "bg-green-500",
    payoutColor: "bg-green-500",
  },
  {
    id: "3",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "2.50x",
    payout: "0.02850400",
    positive: true,
    timestamp: new Date("2026-01-29T10:02:00Z"),
    userColor: "bg-cyan-500",
    gameColor: "bg-gray-500",
    betColor: "bg-green-500",
    payoutColor: "bg-cyan-500",
  },
  {
    id: "4",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "1.25x",
    payout: "-0.02850400",
    positive: false,
    timestamp: new Date("2026-01-29T10:03:00Z"),
    userColor: "bg-blue-500",
    gameColor: "bg-gray-500",
    betColor: "bg-blue-500",
    payoutColor: "bg-blue-500",
  },
  {
    id: "5",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "6.50x",
    payout: "0.02850400",
    positive: true,
    timestamp: new Date("2026-01-29T10:04:00Z"),
    userColor: "bg-purple-500",
    gameColor: "bg-yellow-500",
    betColor: "bg-green-500",
    payoutColor: "bg-green-500",
  },
  {
    id: "6",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "12.50x",
    payout: "-0.02850400",
    positive: false,
    timestamp: new Date("2026-01-29T10:05:00Z"),
    userColor: "bg-cyan-500",
    gameColor: "bg-gray-500",
    betColor: "bg-blue-500",
    payoutColor: "bg-blue-500",
  },
  {
    id: "7",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "1.25x",
    payout: "0.02850400",
    positive: true,
    timestamp: new Date("2026-01-29T10:06:00Z"),
    userColor: "bg-blue-500",
    gameColor: "bg-gray-500",
    betColor: "bg-green-500",
    payoutColor: "bg-green-500",
  },
  {
    id: "8",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "1.15x",
    payout: "0.02850400",
    positive: true,
    timestamp: new Date("2026-01-29T10:07:00Z"),
    userColor: "bg-pink-500",
    gameColor: "bg-yellow-500",
    betColor: "bg-green-500",
    payoutColor: "bg-green-500",
  },
  {
    id: "9",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "10.00x",
    payout: "-0.02850400",
    positive: false,
    timestamp: new Date("2026-01-29T10:08:00Z"),
    userColor: "bg-cyan-500",
    gameColor: "bg-gray-500",
    betColor: "bg-green-500",
    payoutColor: "bg-cyan-500",
  },
  {
    id: "10",
    user: "Robert Fox",
    game: "CoinFlip",
    bet: "0.02850400",
    multiplier: "0.00x",
    payout: "-0.02850400",
    positive: false,
    timestamp: new Date("2026-01-29T10:09:00Z"),
    userColor: "bg-blue-500",
    gameColor: "bg-gray-500",
    betColor: "bg-green-500",
    payoutColor: "bg-green-500",
  },
];
