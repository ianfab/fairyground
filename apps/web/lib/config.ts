/**
 * Get the game server URL based on the current environment
 * Works in both server and client components
 */
export function getGameServerUrl(): string {
  // For client-side, check the current hostname
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    return isLocalhost ? 'http://localhost:3001' : 'https://play.splork.io';
  }
  
  // For server-side, check environment variables
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:3001' : 'https://play.splork.io';
}

/**
 * Get the full game URL for a specific game name
 */
export function getGameUrl(gameName: string): string {
  return `${getGameServerUrl()}/game/${gameName}`;
}

