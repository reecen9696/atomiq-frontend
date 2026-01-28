import { Container } from "@/components/layout/container";
import { WinnerCard } from "@/components/ui/winner-card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-casino-bg">
      <Container className="py-8">
        <div className="flex gap-4 overflow-x-auto">
          <WinnerCard
            gameName="LuckyPoker"
            gameImage="/games/game1.png"
            amount="0.092856"
          />
          <WinnerCard
            gameName="LuckyPoker"
            gameImage="/games/game1.png"
            amount="0.092856"
          />
          <WinnerCard
            gameName="LuckyPoker"
            gameImage="/games/game1.png"
            amount="0.092856"
          />
        </div>
      </Container>
    </main>
  );
}
