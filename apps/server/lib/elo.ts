/**
 * ELO Rating System
 * Standard ELO calculation for competitive games
 */

// K-factor determines how much ratings can change per game
// Higher K = more volatile ratings (good for new players)
// Lower K = more stable ratings (good for established players)
const K_FACTOR = 32;

// Starting ELO for new players
export const DEFAULT_ELO = 1000;

/**
 * Calculate expected score (win probability) for a player
 * @param playerRating - Player's current ELO rating
 * @param opponentRating - Opponent's current ELO rating
 * @returns Expected score between 0 and 1 (1 = certain win, 0 = certain loss)
 */
function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a game
 * @param currentRating - Player's current ELO rating
 * @param expectedScore - Expected score (from calculateExpectedScore)
 * @param actualScore - Actual score (1 = win, 0.5 = draw, 0 = loss)
 * @param kFactor - K-factor (optional, defaults to K_FACTOR)
 * @returns New ELO rating
 */
export function calculateNewElo(
  currentRating: number,
  expectedScore: number,
  actualScore: number,
  kFactor: number = K_FACTOR
): number {
  return Math.round(currentRating + kFactor * (actualScore - expectedScore));
}

/**
 * Calculate ELO changes for a 1v1 game
 * @param player1Elo - Player 1's current ELO
 * @param player2Elo - Player 2's current ELO
 * @param result - Game result: 'player1' | 'player2' | 'draw'
 * @returns Object with new ELO ratings and changes for both players
 */
export function calculate1v1EloChange(
  player1Elo: number,
  player2Elo: number,
  result: 'player1' | 'player2' | 'draw'
): {
  player1NewElo: number;
  player2NewElo: number;
  player1Change: number;
  player2Change: number;
} {
  const expected1 = calculateExpectedScore(player1Elo, player2Elo);
  const expected2 = calculateExpectedScore(player2Elo, player1Elo);

  let actual1: number;
  let actual2: number;

  if (result === 'player1') {
    actual1 = 1;
    actual2 = 0;
  } else if (result === 'player2') {
    actual1 = 0;
    actual2 = 1;
  } else {
    // draw
    actual1 = 0.5;
    actual2 = 0.5;
  }

  const player1NewElo = calculateNewElo(player1Elo, expected1, actual1);
  const player2NewElo = calculateNewElo(player2Elo, expected2, actual2);

  return {
    player1NewElo,
    player2NewElo,
    player1Change: player1NewElo - player1Elo,
    player2Change: player2NewElo - player2Elo,
  };
}

/**
 * Calculate ELO changes for a multiplayer game (3+ players)
 * Uses the average opponent rating method
 * @param playerRatings - Map of player IDs to their current ELO ratings
 * @param winnerId - ID of the winning player (null for draw/tie)
 * @returns Map of player IDs to their ELO changes
 */
export function calculateMultiplayerEloChanges(
  playerRatings: Record<string, number>,
  winnerId: string | null
): Record<string, { newElo: number; change: number }> {
  const playerIds = Object.keys(playerRatings);
  const results: Record<string, { newElo: number; change: number }> = {};

  // If no winner (draw), everyone gets 0.5 score
  // If there's a winner, they get 1, everyone else gets 0
  for (const playerId of playerIds) {
    const currentElo = playerRatings[playerId];
    if (currentElo === undefined) continue;

    // Calculate average opponent rating
    const opponents = playerIds.filter(id => id !== playerId);
    const avgOpponentElo = opponents.reduce((sum, id) => sum + (playerRatings[id] || DEFAULT_ELO), 0) / opponents.length;

    // Calculate expected score against average opponent
    const expectedScore = calculateExpectedScore(currentElo, avgOpponentElo);

    // Determine actual score
    let actualScore: number;
    if (winnerId === null) {
      // Draw - everyone gets equal score
      actualScore = 1 / playerIds.length;
    } else if (winnerId === playerId) {
      // This player won
      actualScore = 1;
    } else {
      // This player lost
      actualScore = 0;
    }

    const newElo = calculateNewElo(currentElo, expectedScore, actualScore);
    results[playerId] = {
      newElo,
      change: newElo - currentElo,
    };
  }

  return results;
}

/**
 * Get ELO tier/rank name based on rating
 * @param elo - ELO rating
 * @returns Tier name
 */
export function getEloTier(elo: number): string {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2200) return 'Master';
  if (elo >= 2000) return 'Expert';
  if (elo >= 1800) return 'Advanced';
  if (elo >= 1600) return 'Intermediate';
  if (elo >= 1400) return 'Competent';
  if (elo >= 1200) return 'Beginner';
  return 'Novice';
}
