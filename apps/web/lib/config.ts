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
 * Safely encode a URI component by first decoding it if already encoded
 * This prevents double encoding (e.g., "My%20Game" -> "My%2520Game")
 */
export function safeEncodeURIComponent(str: string): string {
  // Check if the string appears to be already encoded
  // by looking for % followed by two hex digits
  const isEncoded = /%[0-9A-Fa-f]{2}/.test(str);
  
  if (isEncoded) {
    // Decode first, then encode to ensure single encoding
    try {
      return encodeURIComponent(decodeURIComponent(str));
    } catch (e) {
      // If decoding fails, just encode as-is
      return encodeURIComponent(str);
    }
  }
  
  return encodeURIComponent(str);
}

/**
 * Get the full game URL for a specific game name
 */
export function getGameUrl(gameName: string): string {
  return `${getGameServerUrl()}/game/${safeEncodeURIComponent(gameName)}`;
}

/**
 * Get the game server API URL for fetching stats
 */
export function getGameServerApiUrl(): string {
  return `${getGameServerUrl()}/api`;
}

