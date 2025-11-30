import type { GameTemplate } from "./game-templates";

export const GAME_TAGS = {
  TWO_D_SHOOTER: "2d shooter",
  THREE_D_SHOOTER: "3d shooter",
  STRATEGY: "strategy",
  TETRIS: "tetris",
  CHESS: "chess",
} as const;

export type GameTag = (typeof GAME_TAGS)[keyof typeof GAME_TAGS];

/**
 * Return the default tag set for a given game template/category.
 * These tags are stored on the game record and used for SEO filtering.
 */
export function getDefaultTagsForTemplate(template: GameTemplate): GameTag[] {
  switch (template) {
    case "2d-shooter":
      return [GAME_TAGS.TWO_D_SHOOTER];
    case "3d-shooter":
      return [GAME_TAGS.THREE_D_SHOOTER];
    case "tetris-duels":
      return [GAME_TAGS.TETRIS, GAME_TAGS.STRATEGY];
    case "chess-variant":
      return [GAME_TAGS.CHESS, GAME_TAGS.STRATEGY];
    case "open-ended":
    default:
      return [];
  }
}


