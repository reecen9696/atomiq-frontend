import { Container } from "@/components/layout/container";
import { RecentWins } from "@/components/home/recent-wins";
import { StatsCarousel } from "@/components/home/stats-carousel";
import type { Winner } from "@/types/winner";
import type { StatCard } from "@/types/stat-card";
import Image from "next/image";

// TODO: Replace with API call using TanStack Query
const mockWinners: Winner[] = Array.from({ length: 7 }, (_, i) => ({
  id: `winner-${i + 1}`,
  gameName: "LuckyPoker",
  gameImage: "/games/game1.png",
  amount: "0.092856",
}));

// TODO: Replace with WebSocket data
const statCards: StatCard[] = [
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

export default function HomePage() {
  return (
    <main className="flex min-h-screen w-full justify-center bg-casino-bg">
      <Container className="pt-16 pb-8">
        <RecentWins winners={mockWinners} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 h-96">
            <div className="relative w-2/3 overflow-hidden rounded-md">
              <Image
                src="/brand/banner.png"
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="w-1/3 rounded-md bg-[#131216] border border-[#1E2938]"></div>
          </div>

          <StatsCarousel stats={statCards} />
        </div>
      </Container>
    </main>
  );
}
