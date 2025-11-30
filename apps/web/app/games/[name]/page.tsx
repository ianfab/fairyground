import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { query, getGamesTableName } from "@/lib/db";
import type { Game } from "@/lib/types";
import { CreateGameButton } from "@/app/components/CreateGameButton";
import { CommunityGameCard } from "@/app/components/CommunityGameCard";

export const dynamic = "force-static";

type Params = { name: string };

interface GamePageProps {
  params: Params | Promise<Params>;
}

export async function generateStaticParams() {
  const tableName = getGamesTableName();
  const { rows } = await query<{ name: string }>(
    `SELECT name FROM ${tableName} WHERE play_count > 50 AND preview IS NOT TRUE`
  );

  return rows.map((row) => ({ name: row.name }));
}

export async function generateMetadata(
  props: GamePageProps
): Promise<Metadata> {
  const params = await Promise.resolve(props.params);
  const decodedName = decodeURIComponent(params.name);

  return {
    title: `${decodedName} | splork.io`,
    description: `Play ${decodedName} as a fast multiplayer browser game on splork.io. Queue up with friends in seconds and compete online.`,
    openGraph: {
      title: `${decodedName} | splork.io`,
      description: `Play ${decodedName} instantly in your browser with friends – no installs required.`,
      url: `https://splork.io/games/${encodeURIComponent(params.name)}`,
    },
  };
}

async function getPageData(gameName: string) {
  const tableName = getGamesTableName();

  const [gameResult, topResult, popularResult] = await Promise.all([
    query<Game>(
      `SELECT * FROM ${tableName} WHERE name = $1 AND preview IS NOT TRUE`,
      gameName
    ),
    query<Game>(
      `SELECT * FROM ${tableName} WHERE play_count > 0 AND preview IS NOT TRUE ORDER BY play_count DESC, last_played_at DESC LIMIT 1`
    ),
    query<Game>(
      `SELECT * FROM ${tableName} WHERE preview IS NOT TRUE ORDER BY play_count DESC, last_played_at DESC LIMIT 6`
    ),
  ]);

  const game = gameResult.rows[0] || null;
  const topGame = topResult.rows[0] || null;
  const popularGames = popularResult.rows;

  return { game, topGame, popularGames };
}

function getHeroImageForGame(game: Game): string {
  const tags = (game.tags || []).map((t) => t.toLowerCase());

  if (tags.includes("chess")) return "/game-images/chess-default.webp";
  if (tags.includes("tetris")) return "/game-images/tetris-default.webp";
  if (tags.includes("3d shooter")) return "/game-images/3d-shooter-default.webp";
  if (tags.includes("2d shooter")) return "/game-images/2d-shooter-default.webp";

  return "/game-images/open-ended-default.webp";
}

export default async function GameDetailPage(props: GamePageProps) {
  const params = await Promise.resolve(props.params);
  const decodedName = decodeURIComponent(params.name);

  const { game, topGame, popularGames } = await getPageData(decodedName);

  if (!game) {
    notFound();
  }

  const heroImage = getHeroImageForGame(game);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Hero section with game info */}
        <section className="grid grid-cols-1 md:grid-cols-[3fr,2fr] gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">
              Featured community game
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
              style={{
                background:
                  "linear-gradient(to right, rgb(96, 165, 250), rgb(147, 51, 234))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {game.name}
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              {game.description || "Multiplayer browser game created with splork.io."}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Link
                href={`/play/${encodeURIComponent(game.name)}`}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                ▶ Play this game
              </Link>
              {typeof game.play_count === "number" && game.play_count > 0 && (
                <span className="text-xs text-gray-400">
                  {game.play_count.toLocaleString()} plays total
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Built and hosted on{" "}
              <span className="font-semibold text-gray-300">splork.io</span> – play
              instantly in your browser, no installs required.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="relative z-10 h-full w-full bg-gradient-to-tr from-black/80 via-black/10 to-transparent flex items-end">
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Live in your browser
                </p>
                <p className="text-sm text-gray-200">
                  Supports instant matchmaking and multiplayer rooms. Share the URL
                  with friends to jump into a lobby together.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-action row: top game + create */}
        <section className="border border-gray-900 rounded-2xl bg-gray-950/70 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-1">
              Keep playing
            </p>
            <p className="text-sm text-gray-300">
              Jump into the most popular game on the site or spin up your own idea in
              seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {topGame && (
              <Link
                href={`/play/${encodeURIComponent(topGame.name)}`}
                className="px-6 py-5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-md font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center"
              >
                🔥 Play the #1 game
              </Link>
            )}
            <CreateGameButton />
          </div>
        </section>

        {/* Popular games grid */}
        <section className="w-full text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-200">
            Most popular games on splork.io
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            These games have the highest play counts across the platform. Click any
            card to join a matchmaking lobby and start a new room.
          </p>

          {popularGames.length === 0 ? (
            <div className="p-8 border border-gray-800 rounded-xl bg-gray-900/40 text-center text-gray-500">
              No other games found yet. Be the first to{" "}
              <Link
                href="/create"
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                create a new game
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularGames.map((g) => (
                <CommunityGameCard key={g.id} game={g} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


