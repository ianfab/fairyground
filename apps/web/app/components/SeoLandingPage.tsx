import Link from "next/link";
import { query, getGamesTableName } from "@/lib/db";
import type { Game } from "@/lib/types";
import { CommunityGameCard } from "./CommunityGameCard";
import { CreateGameButton } from "./CreateGameButton";
import type { GameTag } from "@/lib/game-tags";

interface SeoLandingPageProps {
  title: string;
  description: string;
  tagFilters?: GameTag[];
}

async function getSeoGames(tagFilters?: GameTag[]): Promise<Game[]> {
  const tableName = getGamesTableName();

  if (tagFilters && tagFilters.length > 0) {
    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} 
       WHERE preview IS NOT TRUE 
         AND tags && $1::text[] 
       ORDER BY play_count DESC NULLS LAST, last_played_at DESC NULLS LAST, created_at DESC`,
      tagFilters
    );
    return rows;
  }

  const { rows } = await query<Game>(
    `SELECT * FROM ${tableName} 
     WHERE preview IS NOT TRUE 
     ORDER BY play_count DESC NULLS LAST, last_played_at DESC NULLS LAST, created_at DESC`
  );
  return rows;
}

export async function SeoLandingPage({
  title,
  description,
  tagFilters,
}: SeoLandingPageProps) {
  const games = await getSeoGames(tagFilters);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="max-w-6xl mx-auto px-4 py-20">
        <header className="text-left mb-12">
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            style={{
              background:
                "linear-gradient(to right, rgb(96, 165, 250), rgb(147, 51, 234))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CreateGameButton />
              <Link
                href={`/`}
                className="px-6 py-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-md font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center"
              >
                🔥 Play more games
              </Link>
          </div>
        </header>

        <section className="w-full text-left">
          <h2 className="text-2xl font-bold mb-6 text-gray-200">
            {tagFilters && tagFilters.length > 0
              ? "Best matching community games"
              : "Best community games to try"}
          </h2>

          {games.length === 0 ? (
            <div className="p-10 border border-gray-800 rounded-xl bg-gray-900/50 text-center text-gray-500">
              No games match this category yet. Be the first to{" "}
              <Link
                href="/create"
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                create one
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <CommunityGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


