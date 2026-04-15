# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).







## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-12

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- TournamentLobbyCard, useTournamentLobby, QuickPlay future-proofing, NPC escrow fixes
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)




## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.3] - 2026-04-11

### Changed
- Game mode capabilities, DDZ support, timer future-proofing, empty state UI, blitz/duel/single-player/turn-based modes
- Synced components, hooks, types from packages/game-ui
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)
- workbox-config.js retired





## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-12

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- TournamentLobbyCard, useTournamentLobby, QuickPlay future-proofing, NPC escrow fixes
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)




## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.0.0] - 2026-02-03

### Added

#### Core
- Framework-agnostic SDK architecture (works with React, Vue, Angular, vanilla JS)
- Native `fetch` HTTP client with automatic token refresh
- Storage adapter pattern for flexible token storage
- Typed event emitter for SDK-wide events
- Comprehensive error classes (DeskillzError, AuthError, NetworkError, ValidationError)

#### Authentication
- Email/password authentication (login, register, logout)
- Social authentication (Google, Apple, Discord, Twitter, Twitch)
- Wallet-based authentication (SIWE - Sign-In with Ethereum)
- Two-factor authentication (TOTP setup, verify, recovery codes)
- Automatic token refresh on 401 responses

#### Wallet
- Multi-currency balance management (BNB, USDT, USDC)
- Deposit address generation per currency
- Withdrawal requests with address validation
- Transaction history with pagination
- Support for BSC and TRON networks

#### Real-Time
- WebSocket connection with automatic reconnection
- Matchmaking queue events (join, leave, found, ready)
- Tournament real-time updates
- Private room events (player joined/left, ready status, launch)
- Notification system

#### Lobby & Matchmaking
- Game catalog browsing with filters
- Tournament queue management
- Match details retrieval
- Deep link support for game launches
- Live stats (online players, active matches)

#### Tournaments
- Tournament listing with filters (status, game, entry fee)
- Tournament details and rules
- Join/leave tournaments
- Score submission with anti-cheat signatures
- Real-time leaderboards

#### Private Rooms
- Esports room creation and management
- Social game rooms with rake mechanics
- Join by code functionality
- Host controls (kick, start, cancel)
- Spectator mode support

#### Host System
- 6-tier host progression (Bronze to Elite)
- Badge system with achievements
- Earnings dashboard and history
- Withdrawal requests
- Leaderboard rankings

#### Developer Portal
- Dashboard with game analytics
- Revenue reports and payouts
- SDK key management
- Game build uploads (presigned URL and direct)
- API key rotation

#### Users & Leaderboard
- User profile management
- Settings (notifications, preferences, privacy)
- Role upgrade (Player to Developer)
- Global and per-game leaderboards
- Platform statistics

#### Security
- HMAC-SHA256 score signing
- SHA-256 file hashing for uploads
- Timestamp validation utilities
- Nonce generation for replay protection

#### Build System
- ESM and CommonJS dual builds
- TypeScript declaration files
- Tree-shakeable exports
- Subpath imports for selective bundling
- Vite-based build pipeline

### Changed
- Migrated from axios to native fetch API
- Replaced Zustand state management with custom event emitter
- Socket.io-client is now a peer dependency (not bundled)

### Security
- All scores are cryptographically signed before submission
- Constant-time comparison for signature verification
- Secure nonce generation using Web Crypto API







## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-12

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- TournamentLobbyCard, useTournamentLobby, QuickPlay future-proofing, NPC escrow fixes
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)




## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.3] - 2026-04-11

### Changed
- Game mode capabilities, DDZ support, timer future-proofing, empty state UI, blitz/duel/single-player/turn-based modes
- Synced components, hooks, types from packages/game-ui
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)
- workbox-config.js retired





## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-12

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- TournamentLobbyCard, useTournamentLobby, QuickPlay future-proofing, NPC escrow fixes
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)




## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.4] - 2026-04-13

### Added
- TournamentLobbyCard: post-check-in tournament lifecycle UI (8 states)
- useTournamentLobby: tournament lobby state machine hook
- DeskillzBridge.getTournamentSchedule(): bracket schedule API method
- 5 tournament schedule TypeScript types
- QuickPlay: fetchSocialGameTypes(), getSocialGameLabel() helpers
- QuickPlay: DOU_DIZHU added to SocialGameType enum

### Changed
- Free event tracking, community badges, TournamentLobbyCard, QuickPlay future-proofing
- Synced components, hooks, types from packages/game-ui
- SOCIAL_GAME_LABELS changed to dynamic Record<string,string>
- QuickPlaySettingsTab: social game type selector fetches from backend
- QuickPlayAdminTab: uses getSocialGameLabel() for config labels
- Developer docs updated (v1.8, v1.9, v3.4, v5.6)
- Plugin: vite-plugin-sw-version.mjs (retired .ts)
- Service worker: deskillz-sw.js (retired sw.js)



## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.5] - 2026-04-13

### Added
- DisputeModal: full dispute filing component (7 reasons, 3 types, success/error states)
- DeskillzBridge.fileDispute(): POST /api/v1/disputes (rate limited, duplicate prevention)
- DeskillzBridge.getMyDisputes(status?): GET /api/v1/disputes/me
- DeskillzBridge.getDisputeDetails(id): GET /api/v1/disputes/:id
- DeskillzBridge.addDisputeEvidence(id, evidence[]): POST /api/v1/disputes/:id/evidence
- DisputeRecord type (13 fields) in DeskillzBridge

### Changed
- Dispute system: DisputeModal, 4 bridge methods, 4 API endpoints, 4 docs updated
- Synced components, hooks, types from packages/game-ui
- tournaments component count 3->4 (DisputeModal added)
- Developer docs updated (v1.9, v2.0, v3.5, v5.7)


## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [3.4.6] - 2026-04-13

### Added
- DisputeModal: 4-layer match context (auto-attach, recent matches, localStorage, roomCode)
- DeskillzBridge.persistLastMatch(): save match context to localStorage
- DeskillzBridge.getLastMatch(): read last match from localStorage (7-day expiry)
- DeskillzBridge.getRecentMatchesForDispute(): last 10 matches for dispute selector
- fileDispute() accepts roomCode, DisputeRecord adds roomCode field
- Admin QuickPlay inline editing (Edit/Save/Cancel for all config fields)
- Free mode placement ranking in SocialGameSettings + EsportGameSettings
- Dispute socket notifications (dispute:status-changed, dispute:notification)

### Fixed
- L5: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- L6: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- L7: Admin dispute notification path -> /admin/disputes/:id/notify

### Changed
- Dispute 4-layer context, L5/L6/L7 fixes, admin inline edit, free mode placement, socket notifications
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.0, v2.1, v3.6, v5.8)

## [3.4.7] - 2026-04-14

### Added
- Dynamic QuickPlay category seeding: buildSeedData() reads Game.gameCategory
  to auto-create configs with correct Social/Esport defaults
- SocialGameTypeDto: DOU_DIZHU + OTHER enum values, socialGameTypeCustom field
- Admin QuickPlay: category toggle (Esport<->Social), social game type selector,
  developer-configured awareness banner, session duration for social
- CreateRoomModal category-aware: reads game.gameCategory, shows correct
  SocialGameSettings or EsportGameSettings component
- GameWithLobbyStats.gameCategory field in lobby API interface

### Fixed
- EsportGameSettings Custom button in ChipPlusFreeInput (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- GameDetailPage + GlobalLobbyPage now pass category to CreateRoomModal
- Admin QuickPlay can switch game category inline with auto-seeded defaults

### Changed
- Sync from packages/game-ui
- Synced components, hooks, types from packages/game-ui
- Developer docs updated (v2.1, v2.2, v3.7, v5.9)
## [2.x.x] - Previous Versions

Previous versions were platform-specific SDKs (Unity, Unreal Engine).
Version 3.0.0 is the first web-specific release with a unified API.

---

## Migration Guide

### From Unity/Unreal SDK

The Web SDK follows the same API patterns as the mobile SDKs but is designed for browser environments:

1. **Initialization**: Use `createDeskillzSDK()` instead of native SDK initialization
2. **Authentication**: Email/password is primary; wallet connection is optional
3. **Score Submission**: Use `sdk.scoreSigner.signScore()` before submitting
4. **Real-Time**: Connect via `sdk.realtime.connect()` after authentication

### Key Differences

| Feature | Mobile SDK | Web SDK |
|---------|-----------|---------|
| Storage | Native secure storage | localStorage / custom adapter |
| WebSocket | Native implementation | socket.io-client |
| Crypto | Platform-specific | Web Crypto API |
| Build Output | Native library | ES/CJS modules |

---

[3.0.0]: https://github.com/deskillz/web-sdk/releases/tag/v3.0.0