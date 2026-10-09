import type { GameDefinition } from "./shared/gameTypes";

export const singlePlayerGames: GameDefinition[] = [
  {
    id: "target-tap",
    name: "Target Tap",
    description: "Tap the moving target as many times as possible.",
    category: "single-player",
  },

  {
    id: "memory-match",
    name: "Memory Match",
    description:
    "Find all matching pairs with as few move as possible.",
    category: "single-player",
  }
];

export const multiplayerGames: GameDefinition[] = [
  {
    id: "reaction-battle",
    name: "Reaction Battle",
    description: "Compete with another player in a fast reaction game.",
    category: "multiplayer",
  },

  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Play a classic two-player X and O game.",
    category: "multiplayer",
  }
];

export const allGames: GameDefinition[] = [
  ...singlePlayerGames,
  ...multiplayerGames,
];