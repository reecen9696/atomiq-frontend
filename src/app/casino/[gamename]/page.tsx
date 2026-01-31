"use client";

import { Container } from "@/components/layout/container";
import { GamesCarousel } from "@/components/home/games-carousel";
import { BetsTable } from "@/components/ui/bets-table";
import { TabSelector, type TabItem } from "@/components/ui/tab-selector";
import { mockGames } from "@/mocks";
import { latestBetsData } from "@/mocks/bets";
import Image from "next/image";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function CasinoGamePage() {
  const [activeTab, setActiveTab] = useState("latest-bets");
  const params = useParams();
  const gamename = params.gamename as string;

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
          {/* Game Container */}
          <div
            className="w-full bg-black/30 rounded-t-md"
            style={{ height: "628px" }}
          >
            {/* Placeholder for game content */}
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-2">
                  {gamename ? gamename.replace(/-/g, " ") : "Game"}
                </h2>
                <p className="text-white/60">
                  Game interface will be implemented here
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#131216] w-full h-18 mb-3 rounded-b-md flex items-center justify-center">
            <div className="opacity-5">
              <Image
                src="/brand/logo.svg"
                alt="Atomik"
                width={50}
                height={15}
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          </div>

          {/* Atomiq Games Section */}
          <div className="pt-4 mb-8">
            <GamesCarousel games={mockGames} />
          </div>

          {/* Bets Selector */}
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
          <div className="opacity-5">
            <Image
              src="/brand/logo.svg"
              alt="Atomik"
              width={50}
              height={15}
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </div>
      </footer>
    </>
  );
}
