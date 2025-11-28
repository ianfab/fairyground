"use client";

import { useEffect, useState } from "react";
import { getGameServerUrl } from "@/lib/config";

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  username: string;
  elo_rating: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  tier: string;
  winRate: string;
  last_played_at: string;
}

interface GameLeaderboardProps {
  gameName: string;
}

export function GameLeaderboard({ gameName }: GameLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);

        // Decode the game name if it's already URL encoded
        const decodedGameName = gameName.includes('%20') ? decodeURIComponent(gameName) : gameName;
        console.log('[GameLeaderboard] Raw gameName from props:', JSON.stringify(gameName));
        console.log('[GameLeaderboard] Decoded gameName:', JSON.stringify(decodedGameName));

        const url = `${getGameServerUrl()}/api/elo/leaderboard/${encodeURIComponent(decodedGameName)}?limit=10`;
        console.log('[GameLeaderboard] Final URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
          console.error('[GameLeaderboard] Response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('[GameLeaderboard] Error response:', errorText);
          throw new Error(`Failed to fetch leaderboard: ${response.status}`);
        }

        const data = await response.json();
        console.log('[GameLeaderboard] Received data:', data);
        console.log('[GameLeaderboard] Leaderboard length:', data.leaderboard?.length || 0);

        if (!data.leaderboard || data.leaderboard.length === 0) {
          console.warn('[GameLeaderboard] Empty leaderboard returned for game:', gameName);
        }

        setLeaderboard(data.leaderboard || []);
        setError(null);
      } catch (err) {
        console.error("[GameLeaderboard] Error fetching leaderboard:", err);
        setError("Unable to load leaderboard");
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [gameName]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h2>
        <div className="text-center text-gray-400">Loading rankings...</div>
      </div>
    );
  }

  if (error || leaderboard.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h2>
        <div className="text-center text-gray-400">
          {error || "No rankings yet. Be the first to play!"}
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'Grandmaster': 'text-purple-400',
      'Master': 'text-blue-400',
      'Expert': 'text-cyan-400',
      'Advanced': 'text-green-400',
      'Intermediate': 'text-yellow-400',
      'Competent': 'text-orange-400',
      'Beginner': 'text-gray-400',
      'Novice': 'text-gray-500'
    };
    return colors[tier] || 'text-gray-400';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
        🏆 Leaderboard
      </h2>

      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.player_id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
              entry.rank <= 3
                ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/30'
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            }`}
          >
            {/* Rank */}
            <div className="text-2xl font-bold w-12 text-center">
              {getRankEmoji(entry.rank)}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm text-white truncate">
                  {entry.username || entry.player_id.substring(0, 12) + '...'}
                </span>
                <span className={`text-xs font-semibold ${getTierColor(entry.tier)}`}>
                  {entry.tier}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {entry.games_played} games • {entry.wins}W {entry.losses}L {entry.draws}D • {entry.winRate}% WR
              </div>
            </div>

            {/* ELO Rating */}
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {entry.elo_rating}
              </div>
              <div className="text-xs text-gray-500">ELO</div>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length >= 10 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Showing top 10 players
        </div>
      )}
    </div>
  );
}
