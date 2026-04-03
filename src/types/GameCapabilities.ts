// =============================================================================
// GameCapabilities.ts -- packages/game-ui/src/types/GameCapabilities.ts
//
// Describes what a game supports. Set by the developer in the Developer Portal.
// Fetched from GET /api/v1/games/:gameId and passed to EsportGameSettings
// and SocialGameSettings to filter options the game cannot support.
//
// Examples:
//   Bubble Battle: supports1v1=false, supportsFFA=true, supportsAsync=false
//   Candy Duel:    supports1v1=false, supportsFFA=true, supportsAsync=false
//   Big 2:         minPlayers=4, maxPlayers=4, supportsSuddenDeath=false
//   Mahjong:       minPlayers=4, maxPlayers=4, supportsSuddenDeath=false
// =============================================================================

export interface GameCapabilities {
  // ── Player modes ──────────────────────────────────────────────────────────

  /** Supports 1v1 head-to-head matches */
  supports1v1: boolean

  /** Supports FFA (3+ players simultaneously, ranked by score) */
  supportsFFA: boolean

  /** Supports single-player score attack (async solo run) */
  supportsSinglePlayer: boolean

  // ── Match modes ───────────────────────────────────────────────────────────

  /** Supports synchronous (real-time) multiplayer */
  supportsSync: boolean

  /** Supports asynchronous (play before deadline) matches */
  supportsAsync: boolean

  // ── Tournament formats ────────────────────────────────────────────────────

  /** Supports single elimination bracket structure */
  supportsSingleElimination: boolean

  // ── Player count ──────────────────────────────────────────────────────────

  /** Minimum number of players required to start a match */
  minPlayers: number

  /** Maximum number of players allowed in a single match */
  maxPlayers: number

  // ── Duration constraints ──────────────────────────────────────────────────

  /** Minimum match duration in seconds (0 = no minimum) */
  minMatchDurationSeconds: number

  /** Maximum match duration in seconds (0 = no maximum) */
  maxMatchDurationSeconds: number
}

// =============================================================================
// PRESET CAPABILITIES for known Deskillz games
// Used as defaults when capabilities are not yet fetched from the API.
// =============================================================================

export const DEFAULT_CAPABILITIES: GameCapabilities = {
  supports1v1:              true,
  supportsFFA:              true,
  supportsSinglePlayer:     true,
  supportsSync:             true,
  supportsAsync:            true,
  supportsSingleElimination:true,
  minPlayers:               2,
  maxPlayers:               32,
  minMatchDurationSeconds:  30,
  maxMatchDurationSeconds:  0,
}

export const BUBBLE_BATTLE_CAPABILITIES: GameCapabilities = {
  supports1v1:              false,
  supportsFFA:              true,
  supportsSinglePlayer:     false,
  supportsSync:             true,
  supportsAsync:            false,
  supportsSingleElimination:false,
  minPlayers:               2,
  maxPlayers:               8,
  minMatchDurationSeconds:  60,
  maxMatchDurationSeconds:  600,
}

export const CANDY_DUEL_CAPABILITIES: GameCapabilities = {
  supports1v1:              false,
  supportsFFA:              true,
  supportsSinglePlayer:     false,
  supportsSync:             true,
  supportsAsync:            false,
  supportsSingleElimination:false,
  minPlayers:               2,
  maxPlayers:               8,
  minMatchDurationSeconds:  60,
  maxMatchDurationSeconds:  600,
}

export const BIG_TWO_CAPABILITIES: GameCapabilities = {
  supports1v1:              false,
  supportsFFA:              true,
  supportsSinglePlayer:     false,
  supportsSync:             true,
  supportsAsync:            false,
  supportsSingleElimination:true,
  minPlayers:               4,
  maxPlayers:               4,
  minMatchDurationSeconds:  0,
  maxMatchDurationSeconds:  0,
}

export const MAHJONG_CAPABILITIES: GameCapabilities = {
  supports1v1:              false,
  supportsFFA:              true,
  supportsSinglePlayer:     false,
  supportsSync:             true,
  supportsAsync:            false,
  supportsSingleElimination:true,
  minPlayers:               4,
  maxPlayers:               4,
  minMatchDurationSeconds:  0,
  maxMatchDurationSeconds:  0,
}

export const CHINESE_POKER_13_CAPABILITIES: GameCapabilities = {
  supports1v1:              true,
  supportsFFA:              true,
  supportsSinglePlayer:     false,
  supportsSync:             true,
  supportsAsync:            false,
  supportsSingleElimination:true,
  minPlayers:               2,
  maxPlayers:               4,
  minMatchDurationSeconds:  0,
  maxMatchDurationSeconds:  0,
}