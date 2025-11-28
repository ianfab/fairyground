"use client";

import { useEffect, useState } from "react";
import { getGameServerUrl, safeEncodeURIComponent } from "@/lib/config";

interface MatchmakingStatsProps {
  gameName: string;
}

export function MatchmakingStats({ gameName }: MatchmakingStatsProps) {
  const [playersInQueue, setPlayersInQueue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const url = `${getGameServerUrl()}/api/matchmaking/stats/${safeEncodeURIComponent(gameName)}`;
        console.log('[MatchmakingStats] Fetching from:', url);

        const response = await fetch(url);

        if (!response.ok) {
          console.error('[MatchmakingStats] Failed to fetch stats:', response.status);
          setPlayersInQueue(null);
          return;
        }

        const data = await response.json();
        console.log('[MatchmakingStats] Received data:', data);
        setPlayersInQueue(data.playersInQueue || 0);
      } catch (err) {
        console.error("[MatchmakingStats] Error fetching stats:", err);
        setPlayersInQueue(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Poll every 5 seconds to keep the count updated
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [gameName]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (playersInQueue === null) {
    return null; // Don't show if fetch failed
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${playersInQueue > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-gray-300">
          {playersInQueue === 0 && "No players in queue"}
          {playersInQueue === 1 && "1 player searching"}
          {playersInQueue > 1 && `${playersInQueue} players searching`}
        </span>
      </div>
    </div>
  );
}
