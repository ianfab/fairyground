"use client";

import { useEffect, useState } from "react";
import { getGameUrl, getGameServerApiUrl } from "@/lib/config";
import type { GameStats } from "@/lib/types";

interface GameCardProps {
  gameName: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  isPremade?: boolean;
}

export function GameCard({ 
  gameName, 
  title, 
  description, 
  emoji, 
  gradient,
  isPremade = false 
}: GameCardProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`${getGameServerApiUrl()}/game-stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const allStats: Record<string, GameStats> = await response.json();
        if (mounted) {
          setStats(allStats[gameName] || null);
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
  }, [gameName]);

  // Convert Tailwind gradient to inline style for Safari compatibility
  const gradientMap: Record<string, string> = {
    'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700': 'linear-gradient(to bottom right, rgb(217, 119, 6), rgb(234, 88, 12))',
    'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700': 'linear-gradient(to bottom right, rgb(147, 51, 234), rgb(37, 99, 235))',
    'from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700': 'linear-gradient(to bottom right, rgb(22, 163, 74), rgb(13, 148, 136))',
    'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700': 'linear-gradient(to bottom right, rgb(220, 38, 38), rgb(219, 39, 119))',
    'from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700': 'linear-gradient(to bottom right, rgb(219, 39, 119), rgb(225, 29, 72))',
    'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700': 'linear-gradient(to bottom right, rgb(234, 88, 12), rgb(220, 38, 38))',
    'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700': 'linear-gradient(to bottom right, rgb(37, 99, 235), rgb(8, 145, 178))',
  };

  return (
    <a
      href={`/play/${gameName}`}
      className="group block p-6 rounded-xl transition-all relative text-white"
      style={{ background: gradientMap[gradient] || gradient }}
    >
      {/* Subtle stats in top-right corner */}
      {!loading && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {stats && stats.activePlayers > 0 && (
            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-white">{stats.activePlayers}</span>
            </div>
          )}
          {!isPremade && stats && stats.totalPlayCount > 0 && (
            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full" title={`${stats.totalPlayCount} total plays`}>
              <svg className="w-3 h-3 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-white/90">{stats.totalPlayCount}</span>
            </div>
          )}
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-2 pr-20">{emoji} {title}</h3>
      <p className="text-gray-100 text-sm">{description}</p>
      <p className="text-xs opacity-80 mt-4">Ready to play →</p>
    </a>
  );
}

