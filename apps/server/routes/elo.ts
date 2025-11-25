import { Router } from 'express';
import { query } from '../lib/db.js';
import { getEloTier } from '../lib/elo.js';

const router = Router();

// Get ELO stats for a specific player across all games
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const { rows } = await query`
      SELECT
        game_name,
        username,
        elo_rating,
        games_played,
        wins,
        losses,
        draws,
        last_played_at
      FROM player_elo
      WHERE player_id = ${playerId}
      ORDER BY elo_rating DESC
    `;

    const stats = rows.map(row => ({
      ...row,
      tier: getEloTier(row.elo_rating),
      winRate: row.games_played > 0 ? ((row.wins / row.games_played) * 100).toFixed(1) : '0.0'
    }));

    res.json({
      playerId,
      games: stats,
      totalGamesPlayed: stats.reduce((sum, s) => sum + s.games_played, 0)
    });
  } catch (error) {
    console.error('Error fetching player ELO:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get ELO leaderboard for a specific game
router.get('/leaderboard/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const { rows } = await query`
      SELECT
        player_id,
        username,
        elo_rating,
        games_played,
        wins,
        losses,
        draws,
        last_played_at
      FROM player_elo
      WHERE game_name = ${gameName}
      ORDER BY elo_rating DESC
      LIMIT ${limit}
    `;

    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      ...row,
      tier: getEloTier(row.elo_rating),
      winRate: row.games_played > 0 ? ((row.wins / row.games_played) * 100).toFixed(1) : '0.0'
    }));

    res.json({
      gameName,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get global ELO leaderboard (highest ELO across any game)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const { rows } = await query`
      SELECT DISTINCT ON (player_id)
        player_id,
        username,
        game_name,
        elo_rating,
        games_played,
        wins,
        losses,
        draws,
        last_played_at
      FROM player_elo
      ORDER BY player_id, elo_rating DESC
      LIMIT ${limit}
    `;

    // Sort by ELO descending
    rows.sort((a, b) => b.elo_rating - a.elo_rating);

    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      ...row,
      tier: getEloTier(row.elo_rating),
      winRate: row.games_played > 0 ? ((row.wins / row.games_played) * 100).toFixed(1) : '0.0'
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get recent game results for a specific game
router.get('/recent-games/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await query`
      SELECT *
      FROM game_results
      WHERE game_name = ${gameName}
      ORDER BY ended_at DESC
      LIMIT ${limit}
    `;

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching recent games:', error);
    res.status(500).json({ error: 'Failed to fetch recent games' });
  }
});

// Get all recent game results
router.get('/recent-games', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await query`
      SELECT *
      FROM game_results
      ORDER BY ended_at DESC
      LIMIT ${limit}
    `;

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching recent games:', error);
    res.status(500).json({ error: 'Failed to fetch recent games' });
  }
});

export default router;
