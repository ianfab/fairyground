"use client";

import { useEffect, useState, useRef } from "react";
import { getGameServerUrl } from "@/lib/config";
import { useAuthSafe } from "@/lib/useAuthSafe";

interface MatchmakingProps {
  gameName: string;
  onCancel: () => void;
}

export function Matchmaking({ gameName, onCancel }: MatchmakingProps) {
  const [status, setStatus] = useState<'searching' | 'matched' | 'error'>('searching');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const playerIdRef = useRef<string>(crypto.randomUUID());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const authInfo = useAuthSafe();

  useEffect(() => {
    const playerId = playerIdRef.current;

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
            
            if (data.status === 'matched' && data.roomId) {
              setStatus('matched');
              // Redirect to the game with the matched room
              setTimeout(() => {
                const userId = authInfo.user?.userId || '';
                const username = authInfo.user?.username || authInfo.user?.email || '';
                let url = `${getGameServerUrl()}/game/${gameName}/${data.roomId}`;

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
              }, 1000);
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

    // Cleanup function
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      // Leave queue when component unmounts
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
              <p className="text-green-400 mb-8">
                Loading game...
              </p>
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

