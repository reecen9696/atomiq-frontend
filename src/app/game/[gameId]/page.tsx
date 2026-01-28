export default async function GamePage({
  params
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return (
    <main className="min-h-screen bg-casino-bg">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-2xl font-medium">Game: {gameId} (placeholder)</h1>
      </div>
    </main>
  );
}
