import { Container } from "@/components/layout/container";
import { RecentWins } from "@/components/home/recent-wins";
import { StatsCarousel } from "@/components/home/stats-carousel";
import { RecentBlocks } from "@/components/home/recent-blocks";
import { GamesCarousel } from "@/components/home/games-carousel";
import { mockGames } from "@/mocks";
import Image from "next/image";

export default function HomePage() {
  return (
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
                  unoptimized
                />
              </div>
              <div className="lg:w-[27.586%]">
                <RecentBlocks />
              </div>
            </div>
          </div>
          <StatsCarousel />
          <div className="pt-8">
            <GamesCarousel games={mockGames} />
          </div>
        </div>
      </Container>
    </main>
  );
}
