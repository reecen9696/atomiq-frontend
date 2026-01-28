import { Container } from "@/components/layout/container";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return (
    <main className="flex min-h-screen justify-center bg-casino-bg">
      <Container className="py-12">
        <h1 className="text-2xl font-medium">Game: {gameId} (placeholder)</h1>
      </Container>
    </main>
  );
}
