import Link from "next/link";
import { query, getGamesTableName } from "@/lib/db";
import { Game } from "@/lib/types";
import { GameCard } from "./components/GameCard";
import { CommunityGameCard } from "./components/CommunityGameCard";
import { CreateGameButton } from "./components/CreateGameButton";

// Force dynamic to ensure we fetch fresh data
export const dynamic = "force-dynamic";

async function getGames(): Promise<Game[]> {
  try {
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} WHERE preview IS NOT TRUE ORDER BY created_at DESC`
    );
    return rows;
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return [];
  }
}

async function getTrendingGames(): Promise<Game[]> {
  try {
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} WHERE play_count > 0 AND preview IS NOT TRUE ORDER BY play_count DESC, last_played_at DESC LIMIT 3`
    );
    return rows;
  } catch (error) {
    console.error("Failed to fetch trending games:", error);
    return [];
  }
}

async function getTopGame(): Promise<Game | null> {
  try {
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} WHERE play_count > 0 AND preview IS NOT TRUE ORDER BY play_count DESC, last_played_at DESC LIMIT 1`
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to fetch top game:", error);
    return null;
  }
}

export default async function Home() {
  const games = await getGames();
  const trendingGames = await getTrendingGames();
  const topGame = await getTopGame();

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-6"
          style={{
            background:
              "linear-gradient(to right, rgb(96, 165, 250), rgb(147, 51, 234))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Vibe code any multiplayer game
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl">
          Play with your friends instantly. Build, test, and ship in seconds.
        </p>

        <div className="flex flex-col items-center gap-3 mb-20">
          <div className="flex items-center gap-4">
            {topGame && (
              <Link
                href={`/play/${topGame.name}`}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                🔥 Play the #1 Game
              </Link>
            )}
            <CreateGameButton />
          </div>
          <a
            href="https://discord.gg/pkePxyNsn5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-400 transition-colors text-xs"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            join the discord
          </a>
        </div>

        <div className="w-full text-left">
          <h2 className="text-2xl font-bold mb-6 text-gray-200">
            🔥 Trending Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Featured premade games */}
            <GameCard
              gameName="voxel-fps"
              title="Voxel FPS"
              description="3D multiplayer shooter with destructible terrain - Minecraft meets Krunker!"
              emoji="🧱"
              gradient="from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              isPremade
            />
            <GameCard
              gameName="tetris-battle"
              title="Tetris Battle"
              description="Competitive 2-player Tetris - clear lines to attack your opponent!"
              emoji="⚔️"
              gradient="from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
              isPremade
            />
            <GameCard
              gameName="chess"
              title="Chess"
              description="Classic Chess - click pieces to select and move them"
              emoji="♟️"
              gradient="from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              isPremade
            />
            {/* Top 3 trending community games */}
            {trendingGames.map((game) => (
              <CommunityGameCard key={game.id} game={game} />
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-6 text-gray-200">
            All Community Games
          </h2>

          {games.length === 0 ? (
            <div className="p-12 border border-gray-800 rounded-xl bg-gray-900/50 text-center text-gray-500">
              No games created yet. Be the first!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {games.map((game) => (
                <CommunityGameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6 text-gray-200">
            More Premade Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCard
              gameName="clicker"
              title="Click Battle"
              description="Simple clicker game - compete with friends to get the highest score!"
              emoji="🎮"
              gradient="from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              isPremade
            />
            <GameCard
              gameName="pong"
              title="Pong"
              description="Classic Pong game - use W/S keys to move your paddle"
              emoji="🏓"
              gradient="from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              isPremade
            />
            <GameCard
              gameName="tetris"
              title="Tetris"
              description="Classic Tetris - arrow keys to move, up to rotate, space to drop"
              emoji="🟦"
              gradient="from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              isPremade
            />
          </div>
        </div>
      </main>
    </div>
  );
}
