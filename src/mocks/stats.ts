import type { StatCard } from "@/types/stat-card";

/**
 * Mock data for stat cards
 * TODO: Replace with actual WebSocket data
 */
export const mockStatCards: StatCard[] = [
  {
    id: "bets",
    title: "BETS",
    value: "12M",
    icon: "/icons/diceicon.svg",
  },
  {
    id: "bankroll",
    title: "BANKROLL",
    value: "9.2M",
    icon: "/icons/moneyicon.svg",
  },
  {
    id: "wagered",
    title: "WAGERED",
    value: "$2.3M",
    icon: "/icons/winicon.svg",
  },
  {
    id: "gross-rtp",
    title: "GROSS RTP",
    value: "97.7%",
    icon: "/icons/diceicon.svg",
  },
];
