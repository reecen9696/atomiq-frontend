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
    <main className="flex min-h-screen w-full justify-center bg-casino-bg pt-12">
      <Container className="py-8 space-y-4">
        <RecentWins winners={mockWinners} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:h-96">
            <div className="relative h-64 lg:h-auto lg:w-[72.414%] overflow-hidden rounded-xlg">
              <Image
                src="/brand/banner.png"
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="lg:w-[27.586%] rounded-xlg bg-[#131216] border border-[#1E2938] p-6 flex flex-col">
              <div className="flex flex-row justify-between mb-4">
                <p className="text-base font-medium">Recent Blocks</p>
                <p className="text-sm font-medium text-[#8370E9] cursor-pointer">
                  See all
                </p>
              </div>
              <div className="flex flex-col h-full justify-between">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex flex-row justify-between">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="border border-[#1E2938] rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                        <Image
                          src="/icons/block.svg"
                          alt="Block"
                          width={16}
                          height={16}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          #{323211 - i * 100}
                        </p>
                        <p className="text-sm font-medium text-white/60">
                          43wD...IJ32q
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{i + 1} TX</p>
                      <p className="text-sm font-medium text-white/60">
                        {i * 3 + 3} secs ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StatsCarousel stats={statCards} />
        </div>
      </Container>
    </main>
  );
}
