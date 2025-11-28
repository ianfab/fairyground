"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGameUrl, getGameServerApiUrl } from "@/lib/config";
import type { Game, GameStats } from "@/lib/types";

interface CommunityGameCardProps {
  game: Game;
}

export function CommunityGameCard({ game }: CommunityGameCardProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`${getGameServerApiUrl()}/game-stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const allStats: Record<string, GameStats> = await response.json();
        if (mounted) {
          setStats(allStats[game.name] || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching game stats:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [game.name]);

  return (
    <div
      className="p-6 rounded-xl border border-gray-800 bg-gray-900/30 hover:border-purple-500/50 transition-all relative cursor-pointer"
      onClick={() => router.push(`/play/${encodeURIComponent(game.name)}`)}
      suppressHydrationWarning
    >
      {/* Subtle stats in top-right corner */}
      <div className="absolute top-4 right-4 flex items-center gap-2" suppressHydrationWarning>
        {!loading && stats && stats.activePlayers > 0 && (
          <div className="flex items-center gap-1 bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-700/50">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-green-400">{stats.activePlayers}</span>
          </div>
        )}
        {!loading && stats && stats.totalPlayCount > 0 && (
          <div className="flex items-center gap-1 bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-700/50" title={`${stats.totalPlayCount} total plays`}>
            <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-purple-400">{stats.totalPlayCount}</span>
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-2 pr-20">
        {game.name}
      </h3>
      <p className="text-gray-400 text-sm line-clamp-2">
        {game.description || "No description"}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        By {game.creator_username || "Anonymous"}
      </p>
      
      <div className="flex gap-3 mt-4">
        <span className="text-xs text-purple-500 hover:text-purple-400">
          Play →
        </span>
        <a
          href={`/sandbox/${game.name}`}
          className="text-xs text-blue-500 hover:text-blue-400 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          Edit game
        </a>
      </div>
    </div>
  );
}

