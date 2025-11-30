import { GAME_TAGS, type GameTag } from "./game-tags";

export interface SeoPageConfig {
  slug: string;
  keyword: string; // Exact keyword phrase for H1
  metaTitle: string;
  metaDescription: string;
  bodyDescription: string;
  tagFilters?: GameTag[];
}

export const SEO_PAGES: SeoPageConfig[] = [
  {
    slug: "multiplayer",
    keyword: "Unblocked multiplayer games",
    metaTitle: "Unblocked multiplayer games | splork.io",
    metaDescription:
      "Discover the best unblocked multiplayer games you can play instantly in your browser – perfect for school, work breaks, or hanging out with friends online.",
    bodyDescription:
      "Browse a curated collection of the best unblocked multiplayer games you can launch from any modern browser. Every game here runs without installs, works great on school and work networks, and is built for fast matchmaking with your friends.",
  },
  {
    slug: "multiplayer-shooters",
    keyword: "Unblocked multiplayer shooting games",
    metaTitle: "Unblocked multiplayer shooting games | splork.io",
    metaDescription:
      "Play the best unblocked multiplayer shooting games – from 2D arena blasters to 3D FPS battles – all in your browser and great for school or quick breaks.",
    bodyDescription:
      "Jump into fast, competitive lobbies with unblocked multiplayer shooting games that run directly in your browser. From top-down twin‑stick shooters to arena‑style blasters, everything here is tuned for low friction matchmaking and quick rounds with friends.",
    tagFilters: [GAME_TAGS.TWO_D_SHOOTER, GAME_TAGS.THREE_D_SHOOTER],
  },
  {
    slug: "multiplayer-strategy",
    keyword: "Unblocked multiplayer strategy games",
    metaTitle: "Unblocked multiplayer strategy games | splork.io",
    metaDescription:
      "Find the best unblocked multiplayer strategy games – thinky board games, competitive puzzlers, and tactics arenas that are perfect for school laptops.",
    bodyDescription:
      "If you like planning three moves ahead, this page highlights the most strategic multiplayer experiences on splork.io. These games focus on tactics, positioning, and clever decision‑making instead of raw aim, and they all run smoothly in a school or work browser.",
    tagFilters: [GAME_TAGS.STRATEGY],
  },
  {
    slug: "3d-action",
    keyword: "Unblocked 3d games",
    metaTitle: "Unblocked 3D games in your browser | splork.io",
    metaDescription:
      "Play smooth, unblocked 3D browser games with fast movement and modern controls – perfect for short sessions at school, work, or home.",
    bodyDescription:
      "Step into fully 3D arenas with first‑person and third‑person action that runs right in your browser. These unblocked 3D games are tuned for quick loading, responsive controls, and smooth online play on everyday laptops and school devices.",
    tagFilters: [GAME_TAGS.THREE_D_SHOOTER],
  },
  {
    slug: "fps-shooters",
    keyword: "first person unblocked shooter games",
    metaTitle: "First person unblocked shooter games | splork.io",
    metaDescription:
      "Queue into the best first person unblocked shooter games in your browser – fast, fluid FPS matches that work great for school or low‑end PCs.",
    bodyDescription:
      "This collection focuses on first‑person style shooters with fast strafing, jump tricks, and crisp aiming – all playable from a plain browser tab. They’re ideal when you want that FPS feel in a lightweight, unblocked format that still works on school and work networks.",
    tagFilters: [GAME_TAGS.THREE_D_SHOOTER],
  },
  {
    slug: "like-agario",
    keyword: "games like agario",
    metaTitle: "Online games like Agario | splork.io",
    metaDescription:
      "Find online games like Agario with chaotic lobbies, simple controls, and competitive leaderboards – all playable for free in your browser.",
    bodyDescription:
      "If you love that “grow, chase, survive” feeling from Agario, these browser games capture the same chaotic energy. Expect crowded rooms, quick respawns, and simple controls that are easy to learn but hard to master with friends.",
    tagFilters: [GAME_TAGS.TWO_D_SHOOTER],
  },
  {
    slug: "like-slitherio",
    keyword: "games like slitherio",
    metaTitle: "Online games like Slither.io | splork.io",
    metaDescription:
      "Play free online games like Slither.io with smooth movement, risky plays, and tense chases – perfect for quick sessions at school or home.",
    bodyDescription:
      "These multiplayer browser games take inspiration from Slither.io: smooth movement, crowded arenas, and that constant push to grow without getting trapped. They’re perfect for short, high‑intensity sessions with friends on almost any device.",
  },
  {
    slug: "like-tetris-battle",
    keyword: "Online Games Like tetris battle",
    metaTitle: "Online games like Tetris Battle | splork.io",
    metaDescription:
      "Challenge friends in online games like Tetris Battle – competitive line‑clear duels, garbage attacks, and clutch comebacks in your browser.",
    bodyDescription:
      "Queue into head‑to‑head block battles that feel like classic Tetris Battle: combo chains, garbage lines, and tight comebacks at the last second. These online games are lightweight, competitive, and great for school laptops or casual play with friends.",
    tagFilters: [GAME_TAGS.TETRIS],
  },
  {
    slug: "like-fortnite",
    keyword: "Online Games Like fortnite",
    metaTitle: "Online games like Fortnite in your browser | splork.io",
    metaDescription:
      "Drop into online games like Fortnite with fast movement, aiming, and chaotic fights – no installs required, just your browser.",
    bodyDescription:
      "These experiences channel the spirit of Fortnite into lightweight browser‑friendly arenas: quick matches, fast movement tech, and high‑energy fights with your squad. They’re perfect when you want Fortnite‑style pacing without giant downloads.",
    tagFilters: [GAME_TAGS.THREE_D_SHOOTER],
  },
  {
    slug: "like-krunkerio",
    keyword: "Online Games Like krunkerio",
    metaTitle: "Online games like Krunker.io | splork.io",
    metaDescription:
      "Play online games like Krunker.io with slide hops, tight movement, and crisp aim – built for school Chromebooks and quick browser sessions.",
    bodyDescription:
      "If you enjoy Krunker.io’s fast strafing and bhop‑style movement, this page highlights similarly speedy shooters. These matches emphasize raw mechanical skill and smooth FPS feel while still running comfortably in a basic browser.",
    tagFilters: [GAME_TAGS.THREE_D_SHOOTER],
  },
  {
    slug: "like-splixio",
    keyword: "Online Games Like splixio",
    metaTitle: "Online games like Splix.io | splork.io",
    metaDescription:
      "Carve out territory in online games like Splix.io – simple to learn, brutally competitive, and perfect for school or work breaks.",
    bodyDescription:
      "These online games borrow Splix.io’s mix of territory control and sneaky traps. You’ll loop around maps, steal space from other players, and try not to get cut off at the last second – all from a low‑friction browser experience.",
    tagFilters: [GAME_TAGS.TWO_D_SHOOTER],
  },
  {
    slug: "funny-chess-variants",
    keyword: "funny chess variants online",
    metaTitle: "Funny chess variants online | splork.io",
    metaDescription:
      "Experiment with funny chess variants online – chaotic piece rules, surprise checks, and multiplayer twists you can play in your browser.",
    bodyDescription:
      "This page showcases experimental and funny chess variants you can play online with friends. Mix classic strategy with wild rules, custom boards, and unexpected win conditions – all running inside your browser, great for school laptops and casual play.",
    tagFilters: [GAME_TAGS.CHESS],
  },
  {
    slug: "like-smash-bros",
    keyword: "Online Games Like smash bros",
    metaTitle: "Online games like Smash Bros | splork.io",
    metaDescription:
      "Queue into online games like Smash Bros – fast platform fighters and arena brawlers you can play instantly with friends.",
    bodyDescription:
      "If you love chaotic knock‑back, edge guards, and last‑stock clutch moments, these browser games feel like a lightweight take on Smash Bros. They focus on quick rounds, expressive movement, and big swings that keep every match entertaining.",
    tagFilters: [GAME_TAGS.TWO_D_SHOOTER],
  },
];


