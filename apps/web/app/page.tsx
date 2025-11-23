import Link from "next/link";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";

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
            <a
              href="http://localhost:3001/game/chess"
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all"
            >
              <h3 className="text-xl font-bold mb-2">♟️ Chess</h3>
              <p className="text-gray-100 text-sm">Classic Chess - click pieces to select and move them</p>
              <p className="text-xs text-amber-200 mt-4">Ready to play →</p>
            </a>
            <a
              href="http://localhost:3001/game/clicker"
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <h3 className="text-xl font-bold mb-2">🎮 Click Battle</h3>
              <p className="text-gray-100 text-sm">Simple clicker game - compete with friends to get the highest score!</p>
              <p className="text-xs text-purple-200 mt-4">Ready to play →</p>
            </a>
            <a
              href="http://localhost:3001/game/pong"
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all"
            >
              <h3 className="text-xl font-bold mb-2">🏓 Pong</h3>
              <p className="text-gray-100 text-sm">Classic Pong game - use W/S keys to move your paddle</p>
              <p className="text-xs text-green-200 mt-4">Ready to play →</p>
            </a>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-gray-200">Community Games</h2>
          
          {games.length === 0 ? (
            <div className="p-12 border border-gray-800 rounded-xl bg-gray-900/50 text-center text-gray-500">
              No games created yet. Be the first!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <a 
                  key={game.id} 
                  href={`http://localhost:3001/game/${game.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-6 rounded-xl border border-gray-800 bg-gray-900/30 hover:border-purple-500/50 hover:bg-gray-900/50 transition-all"
                >
                  <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{game.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{game.description || "No description"}</p>
                  <p className="text-xs text-purple-500 mt-4">Play on localhost:3001 →</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
