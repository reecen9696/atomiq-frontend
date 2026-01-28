import { Container } from "@/components/layout/container";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen justify-center bg-casino-bg">
      <Container>
        <div className="pt-12 bg-amber-400 flex flex-row gap-2 p-4">
          <Image
            src="/games/game1.png"
            alt="Atomik"
            width={56}
            height={16}
            className="block"
            priority
          />
          <div className="flex flex-col pl-5 bg-amber-950 justify-end">
            <p>LuckyPoker</p>
            <div className="flex space-x-2 gap-1">
              <div className="rounded-full bg-red-600 w-6 h-6"></div>
              <p>0.092856</p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
