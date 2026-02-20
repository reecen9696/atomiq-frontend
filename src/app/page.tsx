"use client";

import { Container } from "@/components/layout/container";
import { RecentWins } from "@/components/home/recent-wins";
import { StatsCarousel } from "@/components/home/stats-carousel";
import { RecentBlocks } from "@/components/home/recent-blocks";
import { GamesCarousel } from "@/components/home/games-carousel";
import { BetsTable } from "@/components/ui/bets-table";
import { TabSelector, type TabItem } from "@/components/ui/tab-selector";
import { mockGames } from "@/mocks";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import { useState } from "react";
import { useLiveBets } from "@/hooks/use-live-bets";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("latest-bets");
  const [limit, setLimit] = useState(20);
  const { bets, isLoading } = useLiveBets(limit);

  const betsTabItems: TabItem[] = [
    { id: "latest-bets", label: "Latest Bets" },
    { id: "high-rollers", label: "High Rollers" },
    { id: "my-bets", label: "My Bets" },
    { id: "lucky-wins", label: "Lucky Wins" },
  ];

  return (
    <>
      <main className="flex min-h-screen w-full justify-center bg-casino-bg pt-12">
        <Container>
          <RecentWins />
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:h-96">
                <div className="relative w-full lg:w-[72.414%] aspect-[16/9] overflow-hidden rounded-xlg">
                  <Image
                    src="/brand/banner.png"
                    alt="Banner"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 72vw, 900px"
                  />
                </div>
                <div className="lg:w-[27.586%]">
                  <RecentBlocks />
                </div>
              </div>
            </div>
            <StatsCarousel />
            <div className="pt-4">
              <GamesCarousel games={mockGames} />
            </div>
          </div>
          {/* This is the selector button */}
          <div className="flex items-center justify-between">
            <TabSelector
              tabs={betsTabItems}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-[38px] rounded-sm border border-[#1e2938] bg-[#211f28] px-3 text-sm text-[#828998] focus:outline-none focus:border-[#7717ff] transition-colors cursor-pointer"
            >
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Latest Bets Table */}
          <BetsTable bets={bets} isLoading={isLoading} />
        </Container>
      </main>

      <Footer />
    </>
  );
}
