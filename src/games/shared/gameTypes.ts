// =========================================================
// SMART CAFE - GAME TYPES
// =========================================================
//
// Shared types for future games.
//
// Keeping these types separate allows us to add more games
// without duplicating common definitions.
//
// =========================================================

export type GameCategory =
  | "single-player"
  | "multiplayer";

export type GameDefinition = {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
};