"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getGameServerUrl } from "@/lib/config";
import { Matchmaking } from "@/app/components/Matchmaking";
import { GameLeaderboard } from "@/app/components/GameLeaderboard";
import { useAuthSafe } from "@/lib/useAuthSafe";

export default function GameModePage() {
  const params = useParams();
  const router = useRouter();
  const gameName = params.game as string;
  const [roomName, setRoomName] = useState("");
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const authInfo = useAuthSafe();

  const handlePlayWithFriend = () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }
    // Navigate to the game server with the room name, user ID, and username
    const userId = authInfo.user?.userId || '';
    const username = authInfo.user?.username || authInfo.user?.email || '';
    let url = `${getGameServerUrl()}/game/${encodeURIComponent(gameName)}/${encodeURIComponent(roomName)}`;
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
      if (username) {
        url += `&username=${encodeURIComponent(username)}`;
      }
    }
    window.open(url, '_blank');
  };

  const handleMatchmaking = () => {
    setShowMatchmaking(true);
  };

  if (showMatchmaking) {
    return (
      <Matchmaking 
        gameName={gameName} 
        onCancel={() => setShowMatchmaking(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans py-8">
      <div className="max-w-6xl w-full mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Choose Game Mode
          </h1>
          <p className="text-xl text-gray-400">
            How would you like to play {gameName}?
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-1 order-last lg:order-first">
            <GameLeaderboard gameName={gameName} />
          </div>

          {/* Game Mode Options */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          {/* Matchmaking Option */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer"
               onClick={handleMatchmaking}>
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-3">Matchmaking</h2>
              <p className="text-gray-100 mb-6">
                Get automatically matched with another player
              </p>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-200">
                  ⚡ Quick match<br />
                  🎲 Random opponent<br />
                  🏆 Competitive play
                </p>
              </div>
            </div>
          </div>

          {/* Play with Friend Option */}
          <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold mb-3">Play with a Friend</h2>
              <p className="text-gray-100 mb-6">
                Share a room name with your friend
              </p>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <input
                  type="text"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePlayWithFriend();
                    }
                  }}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 mb-4"
                />
                <button
                  onClick={handlePlayWithFriend}
                  className="w-full px-6 py-3 bg-white text-teal-700 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to games
          </button>
        </div>
      </div>
    </div>
  );
}

