// Premade Games for Easy Testing
// These games are hardcoded in the server and always available

import clicker from './premade-games/clicker.js';
import pong from './premade-games/pong.js';
import tetris from './premade-games/tetris.js';
import tetrisBattle from './premade-games/tetris-battle.js';
import shooter from './premade-games/shooter.js';
import chess from './premade-games/chess.js';
import snake from './premade-games/snake.js';
import voxelFps from './premade-games/voxel-fps.js';

export const PREMADE_GAMES = {
  clicker,
  pong,
  tetris,
  'tetris-battle': tetrisBattle,
  shooter,
  chess,
  snake,
  'voxel-fps': voxelFps
};
