"use client";

import { Container } from "@/components/layout/container";
import { GamesCarousel } from "@/components/home/games-carousel";
import { BetsTable } from "@/components/ui/bets-table";
import { TabSelector, type TabItem } from "@/components/ui/tab-selector";
import { GameLoader } from "@/components/games/game-loader";
import { GameNotFound } from "@/components/games/game-not-found";
import { getGameBySlug, getAvailableGames } from "@/config/games";
import { mockGames } from "@/mocks";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useLiveBets } from "@/hooks/use-live-bets";

export default function CasinoGamePage() {
  const [activeTab, setActiveTab] = useState("latest-bets");
  const [limit, setLimit] = useState(20);
  const { bets, isLoading } = useLiveBets(limit);
  const params = useParams();
  const gamename = params.gamename as string;

  // Get game configuration from registry
  const game = getGameBySlug(gamename);
  const availableGames = getAvailableGames();

  const betsTabItems: TabItem[] = [
    { id: "latest-bets", label: "Latest Bets" },
    { id: "high-rollers", label: "High Rollers" },
    { id: "my-bets", label: "My Bets" },
    { id: "lucky-wins", label: "Lucky Wins" },
  ];

  // If game doesn't exist or is disabled, show 404
  if (!game || !game.enabled) {
    return (
      <>
        <main className="flex min-h-screen w-full justify-center bg-casino-bg pt-12">
          <Container>
            <GameNotFound requestedGame={gamename} />
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-screen w-full justify-center bg-casino-bg pt-12">
        <Container>
          {/* Game Container */}
          <div
            className="w-full bg-black/30 rounded-t-md"
            style={{ height: "650px" }}
          >
            <GameLoader game={game} />
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
