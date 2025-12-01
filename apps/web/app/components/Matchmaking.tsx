"use client";

import { useEffect, useState, useRef } from "react";
import { getGameServerUrl, safeEncodeURIComponent } from "@/lib/config";
import { useAuthSafe } from "@/lib/useAuthSafe";

interface MatchmakingProps {
  gameName: string;
  onCancel: () => void;
  minPlayersPerRoom?: number;
  maxPlayersPerRoom?: number;
  hasWinCondition?: boolean;
  canJoinLate?: boolean;
}

export function Matchmaking({
  gameName,
  onCancel,
  minPlayersPerRoom = 2,
  maxPlayersPerRoom = 2,
  hasWinCondition = true,
  canJoinLate = false,
}: MatchmakingProps) {
  const [status, setStatus] = useState<'searching' | 'matched' | 'error'>('searching');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const playerIdRef = useRef<string>(crypto.randomUUID());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const authInfo = useAuthSafe();

  useEffect(() => {
    const playerId = playerIdRef.current;

    // Helper to redirect into the matched game room
    const redirectToGame = (rawRoomId: string) => {
      // For late-join into an existing live room we may receive a full room
      // identifier like "gameName/roomName". Normalize this so the URL path
      // structure remains /game/:gameName/:roomName.
      let roomId = rawRoomId;
      const parts = rawRoomId.split("/");
      if (parts.length === 2 && parts[0] === gameName) {
        roomId = parts[1];
      }
      const userId = authInfo.user?.userId || '';
      const username = authInfo.user?.username || authInfo.user?.email || '';
      let url = `${getGameServerUrl()}/game/${safeEncodeURIComponent(gameName)}/${safeEncodeURIComponent(roomId)}`;

      // Build query parameters
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
        if (username) {
          params.append('username', username);
        }
      }
      params.append('matchmakingPlayerId', playerId);

      url += `?${params.toString()}`;
      window.location.href = url;
    };

    // Join matchmaking queue
    const joinQueue = async () => {
      if (hasJoinedRef.current) return;
      
      try {
        const response = await fetch(`${getGameServerUrl()}/api/matchmaking/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameName, playerId })
        });

        if (!response.ok) {
          throw new Error('Failed to join matchmaking');
        }

        hasJoinedRef.current = true;

        // Start polling for match
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `${getGameServerUrl()}/api/matchmaking/status/${playerId}`
            );
            
            if (!statusResponse.ok) {
              throw new Error('Failed to check status');
            }

            const data = await statusResponse.json();

            if (data.status === 'not_in_queue') {
              // Server cleaned us up - show error and exit
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              setStatus('error');
              setErrorMessage('Matchmaking timed out. Your opponent may have disconnected. Please try again.');
              return;
            }

            if (data.status === 'matched' && data.roomId) {
              setStatus('matched');

              // Play notification sound
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
                audio.play().catch(err => console.log('Could not play sound:', err));
              } catch (err) {
                console.log('Audio not supported:', err);
              }

              // If late-join is allowed for this game, go straight into the match.
              // Otherwise, wait 5 seconds with a countdown to give more players a chance to join.
              if (canJoinLate) {
                setTimeout(() => {
                  redirectToGame(data.roomId as string);
                }, 1000);
              } else {
                if (countdownRef.current) {
                  clearInterval(countdownRef.current);
                }

                let remaining = 5;
                setCountdown(remaining);

                countdownRef.current = setInterval(() => {
                  remaining -= 1;
                  if (remaining <= 0) {
                    if (countdownRef.current) {
                      clearInterval(countdownRef.current);
                      countdownRef.current = null;
                    }
                    setCountdown(0);
                    redirectToGame(data.roomId as string);
                  } else {
                    setCountdown(remaining);
                  }
                }, 1000);
              }
            }
          } catch (error) {
            console.error('Error checking matchmaking status:', error);
          }
        }, 1000); // Poll every second

      } catch (error) {
        console.error('Error joining matchmaking:', error);
        setStatus('error');
        setErrorMessage('Failed to join matchmaking. Please try again.');
      }
    };

    joinQueue();

    // Cleanup function - only runs when component unmounts (Cancel button or back navigation)
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      // Leave queue when component unmounts (user clicked Cancel or navigated back)
      if (hasJoinedRef.current) {
        fetch(`${getGameServerUrl()}/api/matchmaking/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId })
        }).catch(err => console.error('Error leaving queue:', err));
      }
    };
  }, [gameName]);

  const handleCancel = () => {
    const playerId = playerIdRef.current;
    
    // Leave the queue
    if (hasJoinedRef.current) {
      fetch(`${getGameServerUrl()}/api/matchmaking/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      }).catch(err => console.error('Error leaving queue:', err));
    }

    // Clear any local countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);

    onCancel();
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl border border-red-800 p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-3xl font-bold mb-4">Error</h2>
              <p className="text-red-400 mb-8">{errorMessage}</p>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'matched') {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl border border-green-800 p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-4">Match Found!</h2>
              {countdown !== null && !canJoinLate ? (
                <p className="text-green-400 mb-8">
                  Starting in {countdown} second{countdown === 1 ? '' : 's'}...
                </p>
              ) : (
                <p className="text-green-400 mb-8">
                  Loading game...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-purple-500"></div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Finding a match...</h2>
            <p className="text-gray-400 mb-8">
              Searching for other players playing {gameName}
            </p>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

