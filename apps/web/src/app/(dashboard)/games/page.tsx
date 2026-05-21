import { PageHeader } from "@/components/shared/PageHeader";
import { GamesClient } from "./GamesClient";
import { GameRepository } from "@/server/repositories/GameRepository";

export const metadata = { title: "Game Feeds — GamePulse Hub" };
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const repo = new GameRepository();
  const games = await repo.findAll();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Game Feeds"
        description="Watch games and auto-discover their RSS feeds"
      />
      <GamesClient initialGames={games} />
    </div>
  );
}
