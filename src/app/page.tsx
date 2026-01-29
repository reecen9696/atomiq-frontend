"use client";

import { Container } from "@/components/layout/container";
import { RecentWins } from "@/components/home/recent-wins";
import { StatsCarousel } from "@/components/home/stats-carousel";
import { RecentBlocks } from "@/components/home/recent-blocks";
import { GamesCarousel } from "@/components/home/games-carousel";
import { BetsTable } from "@/components/ui/bets-table";
import { TabSelector, type TabItem } from "@/components/ui/tab-selector";
import { mockGames } from "@/mocks";
import { latestBetsData } from "@/mocks/bets";
import { colors } from "@/design-system/tokens";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("latest-bets");

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
          <TabSelector
            tabs={betsTabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Latest Bets Table */}
          <BetsTable bets={latestBetsData} />
        </Container>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#131216] mt-26">
        <div className="flex justify-between items-start  px-4 sm:px-6 lg:px-10 2xl:px-12 py-6 h-24">
          <div className="flex gap-8 ">
            <span className="text-[14px] font-bold text-white/40">
              How It Works
            </span>
            <span className="text-[14px] font-bold text-white/40">FAQ</span>
            <span className="text-[14px] font-bold text-white/40">Support</span>
            <span className="text-[14px] font-bold text-white/40">X</span>
          </div>
          <div className="opacity-20">
            <Image
              src="/brand/logo.svg"
              alt="Atomik"
              width={70}
              height={20}
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </div>
      </footer>
    </>
  );
}
