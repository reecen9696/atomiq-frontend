import { Container } from "@/components/layout/container";
import { RecentWins } from "@/components/home/recent-wins";
import { StatsCarousel } from "@/components/home/stats-carousel";
import { RecentBlocks } from "@/components/home/recent-blocks";
import { GamesCarousel } from "@/components/home/games-carousel";
import { mockGames } from "@/mocks";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <main className="flex min-h-screen w-full justify-center bg-casino-bg pt-12">
        <Container>
          <RecentWins />
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:h-96">
                <div className="relative h-64 lg:h-auto lg:w-[72.414%] overflow-hidden rounded-xlg">
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
          <div className="bg-[#131216] p-2 rounded-sm flex gap-1 w-full md:w-fit">
            <button className="bg-[#211F28] px-4 py-2 rounded-sm text-sm font-medium text-white">
              Latest Bets
            </button>
            <button className="px-4 py-2 rounded-sm text-sm font-medium text-[#BEC6D1]">
              High Rollers
            </button>
            <button className="px-4 py-2 rounded-sm text-sm font-medium text-[#BEC6D1]">
              My Bets
            </button>
            <button className="px-4 py-2 rounded-sm text-sm font-medium text-[#BEC6D1]">
              Lucky Wins
            </button>
          </div>

          {/* Latest Bets Table */}
          <div className="mt-4">
            {/* Header Row */}
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
              <div className="text-[12px] font-normal text-[#828998]">
                Payout
              </div>
            </div>

            {/* Data Rows */}
            {[
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "1.50x",
                payout: "-0.02850400",
                positive: false,
                userColor: "bg-purple-500",
                gameColor: "bg-gray-500",
                betColor: "bg-green-500",
                payoutColor: "bg-blue-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "1.15x",
                payout: "0.02850400",
                positive: true,
                userColor: "bg-pink-500",
                gameColor: "bg-yellow-500",
                betColor: "bg-green-500",
                payoutColor: "bg-green-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "2.50x",
                payout: "0.02850400",
                positive: true,
                userColor: "bg-cyan-500",
                gameColor: "bg-gray-500",
                betColor: "bg-green-500",
                payoutColor: "bg-cyan-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "1.25x",
                payout: "-0.02850400",
                positive: false,
                userColor: "bg-blue-500",
                gameColor: "bg-gray-500",
                betColor: "bg-blue-500",
                payoutColor: "bg-blue-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "6.50x",
                payout: "0.02850400",
                positive: true,
                userColor: "bg-purple-500",
                gameColor: "bg-yellow-500",
                betColor: "bg-green-500",
                payoutColor: "bg-green-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "12.50x",
                payout: "-0.02850400",
                positive: false,
                userColor: "bg-cyan-500",
                gameColor: "bg-gray-500",
                betColor: "bg-blue-500",
                payoutColor: "bg-blue-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "1.25x",
                payout: "0.02850400",
                positive: true,
                userColor: "bg-blue-500",
                gameColor: "bg-gray-500",
                betColor: "bg-green-500",
                payoutColor: "bg-green-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "1.15x",
                payout: "0.02850400",
                positive: true,
                userColor: "bg-pink-500",
                gameColor: "bg-yellow-500",
                betColor: "bg-green-500",
                payoutColor: "bg-green-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "10.00x",
                payout: "-0.02850400",
                positive: false,
                userColor: "bg-cyan-500",
                gameColor: "bg-gray-500",
                betColor: "bg-green-500",
                payoutColor: "bg-cyan-500",
              },
              {
                user: "Robert Fox",
                game: "CoinFlip",
                bet: "0.02850400",
                multiplier: "0.00x",
                payout: "-0.02850400",
                positive: false,
                userColor: "bg-blue-500",
                gameColor: "bg-gray-500",
                betColor: "bg-green-500",
                payoutColor: "bg-green-500",
              },
            ].map((row, index) => (
              <div
                key={index}
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
                  <span className="text-[14px] font-medium text-white">
                    {row.user}
                  </span>
                </div>
                <div className="hidden md:flex items-center justify-start gap-2">
                  <Image
                    src="/icons/coinflip.svg"
                    alt="CoinFlip"
                    width={24}
                    height={24}
                    style={{ width: "auto", height: "auto" }}
                  />
                  <span className="text-[14px] font-medium text-white">
                    {row.game}
                  </span>
                </div>
                <div className="hidden md:flex items-center justify-start gap-2">
                  <Image
                    src="/icons/sol.svg"
                    alt="SOL"
                    width={14}
                    height={14}
                    style={{ width: "auto", height: "auto" }}
                  />
                  <span className="text-[14px] font-medium text-white">
                    {row.bet}
                  </span>
                </div>
                <div className="hidden md:flex items-center justify-start">
                  <span className="text-[14px] font-medium text-white">
                    {row.multiplier}
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
                    className={`text-[14px] font-medium ${row.positive ? "text-[#03BD6C]" : "text-white"}`}
                  >
                    {row.payout}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
