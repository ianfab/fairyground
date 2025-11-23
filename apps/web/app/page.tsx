import Link from "next/link";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";
import { GameCard } from "./components/GameCard";
import { CommunityGameCard } from "./components/CommunityGameCard";

// Force dynamic to ensure we fetch fresh data
export const dynamic = 'force-dynamic';

async function getGames(): Promise<Game[]> {
  try {
    const { rows } = await query<Game>`SELECT * FROM games ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return [];
  }
}

export default async function Home() {
  const games = await getGames();

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Vibe code any multiplayer game
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl">
          Play with your friends instantly. Build, test, and ship in seconds.
        </p>
        
        <div className="flex gap-4 mb-20">
          <Link 
            href="/create" 
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Create a Game
          </Link>
        </div>

        <div className="w-full text-left">
          <h2 className="text-2xl font-bold mb-6 text-gray-200">🎮 Premade Games (Try These First!)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <GameCard
              gameName="chess"
              title="Chess"
              description="Classic Chess - click pieces to select and move them"
              emoji="♟️"
              gradient="from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              isPremade
            />
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
            <GameCard
              gameName="tetris-battle"
              title="Tetris Battle"
              description="Competitive 2-player Tetris - clear lines to attack your opponent!"
              emoji="⚔️"
              gradient="from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
              isPremade
            />
            <GameCard
              gameName="shooter"
              title="3D Shooter"
              description="First-person shooter - WASD to move, mouse to look, click to shoot"
              emoji="🔫"
              gradient="from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              isPremade
            />
          </div>

          <h2 className="text-2xl font-bold mb-6 text-gray-200">Community Games</h2>
          
          {games.length === 0 ? (
            <div className="p-12 border border-gray-800 rounded-xl bg-gray-900/50 text-center text-gray-500">
              No games created yet. Be the first!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <CommunityGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
