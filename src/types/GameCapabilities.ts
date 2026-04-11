// =============================================================================
// GameCapabilities.ts -- packages/game-ui/src/types/GameCapabilities.ts
//
// Describes what a game supports. Capabilities are set by the developer in the
// Developer Portal (My Games > Edit > Gameplay tab) and stored in the database.
//
// At runtime, standalone games fetch capabilities via:
//   bridge.getGameCapabilities()  ->  GET /api/v1/games/:gameId
//
// The response is passed to SocialGameSettings or EsportGameSettings as the
// capabilities prop. The component then hides/disables options the game
// does not support.
//
// DEFAULT_CAPABILITIES is used as a fallback when the API call fails
// (offline, guest mode, network error). It is permissive -- all options
// enabled -- so the host sees every option until the real config loads.
//
// Developers do NOT hardcode capability values in their game code.
// All capability values come from the Developer Portal via the API.
// =============================================================================

export interface GameCapabilities {
  // -- Player modes ----------------------------------------------------------

  /** Supports 1v1 head-to-head matches */
  supports1v1: boolean

  /** Supports FFA (3+ players simultaneously, ranked by score) */
  supportsFFA: boolean

  /** Supports single-player score attack (async solo run) */
  supportsSinglePlayer: boolean

  // -- Match modes -----------------------------------------------------------

  /** Supports synchronous (real-time) multiplayer */
  supportsSync: boolean

  /** Supports asynchronous (play before deadline) matches */
  supportsAsync: boolean

  /** Supports Blitz 1v1 (short burst real-time duel, e.g. 60s Candy Duel) */
  supportsBlitz1v1: boolean

  /** Supports Duel 1v1 (full-length real-time head-to-head, e.g. Bubble Battle) */
  supportsDuel1v1: boolean

  /** Supports single-player mode (solo score attack, no opponent) */
  supportsSinglePlayerMode: boolean

  /** Supports turn-based multiplayer (players take turns, not real-time) */
  supportsTurnBased: boolean

  // -- Tournament formats ----------------------------------------------------

  /** Supports single elimination bracket structure */
  supportsSingleElimination: boolean

  /** Maximum players in a single elimination bracket (e.g. 32, 64, 128, 256) */
  maxTournamentSize: number

  // -- Player count ----------------------------------------------------------

  /** Minimum number of players required to start a match */
  minPlayers: number

  /** Maximum number of players allowed in a single match */
  maxPlayers: number

  // -- Duration constraints --------------------------------------------------

  /** Minimum match duration in seconds (0 = no minimum) */
  minMatchDurationSeconds: number

  /** Maximum match duration in seconds (0 = no maximum) */
  maxMatchDurationSeconds: number
}

// =============================================================================
// DEFAULT CAPABILITIES -- fallback when API has not yet responded.
// Permissive: all modes enabled, wide player range, no duration limits.
// This ensures the settings UI shows all options until the real config loads.
// =============================================================================

export const DEFAULT_CAPABILITIES: GameCapabilities = {
  supports1v1:               true,
  supportsFFA:               true,
  supportsSinglePlayer:      true,
  supportsSync:              true,
  supportsAsync:             true,
  supportsBlitz1v1:          false,
  supportsDuel1v1:           false,
  supportsSinglePlayerMode:  false,
  supportsTurnBased:         false,
  supportsSingleElimination: true,
  maxTournamentSize:         256,
  minPlayers:                2,
  maxPlayers:                32,
  minMatchDurationSeconds:   0,
  maxMatchDurationSeconds:   0,
}