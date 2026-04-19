# DESKILLZ STANDALONE GAME UI BUILD HANDOFF
## Universal UI Guide for Self-Sufficient Game Apps

**Version:** 3.11
**Date:** April 18, 2026
**SDK Version:** Deskillz SDK v3.4.11 + @deskillz/game-ui v3.4.11
**Architecture:** Self-Sufficient (No External App Dependency)
**Supported Game Types:** Esports (Competitive) + Social Games (Cash Game + Tournament)
**Supported Web Engine:** React/Vite only (all standalone web games)

---

## CHANGELOG

### v3.11 (April 18, 2026)
- CREATEROOM DEFAULTS: createDefaultSocialGameConfig accepts an optional 3rd
  arg `qpConfig: SocialQuickPlayDefaults` and createDefaultEsportGameConfig
  accepts an optional 2nd arg `qpConfig: EsportQuickPlayDefaults`. Both seed
  the Create Room form defaults from the developer's QuickPlayConfig row --
  rake %, rake cap USD, turn timer, point value tiers, entry fee tiers,
  currencies, platform fee, min/max players. null/undefined falls back to
  the pre-v3.4.11 hardcoded defaults. Fully backward compatible -- games
  adopt by fetching GET /api/v1/quick-play/games/:gameId on CreateRoomScreen
  mount and passing the result. See Section 27b for the reference pattern.
- NEW EXPORTS: SocialQuickPlayDefaults + EsportQuickPlayDefaults type
  interfaces exported from @deskillz/game-ui barrel and from the component
  files. SOCIAL_GAMES constant re-exported for games that want to render
  their own game-type pickers.
- BACKFILLED EXPORTS: DisputeModal (v3.4.5), TournamentLobbyCard +
  useTournamentLobby with full type surface TournamentLobbyStatus, TablePlayer,
  CurrentTableInfo, BracketRound, TournamentLobbyState (v3.4.4),
  useAgeVerification hook + UseAgeVerificationOptions +
  UseAgeVerificationResult, QuickPlayStatus + AvailableGame +
  QuickPlayQueueState. These were file-level named exports that were
  never re-exported from the barrel.
- AGE VERIFICATION: useAgeVerification is now a parameterized hook --
  takes an injected `checkVerified: () => Promise<boolean>` option so it
  works in both standalone games (pass `() => bridge.checkAgeVerified()`)
  and the main app (which passes hostApi.checkAgeVerified). Single
  localStorage cache key `deskillz_age_verified` preserved across both
  environments.
- STRICT ERROR HANDLING: BuyInModal, CashOutModal, RebuyModal,
  PauseRequestModal, AgeVerificationModal now use `err: unknown` with
  typed narrowing instead of loose `err: any` in their catch blocks.
  No user-visible change; TypeScript safety only.

### v3.10 (April 18, 2026)
- SSO TOKEN HANDOFF: DeskillzBridge.initialize() now reads `?token=` from
  the launch URL and consumes it into TokenManager BEFORE restoreSession()
  runs. Eliminates the re-login flow when the main Deskillz app deep-links
  into a standalone game. consumeSSOToken() strips the token from the
  visible URL via history.replaceState() after consumption so it does not
  leak via screenshots, browser history, or document.referrer. Other query
  params (matchId, gameSessionId, custom params) are preserved.
- NO GAME-DEV ACTION REQUIRED: consumption happens inside Bridge.initialize()
  which every integration already calls. Direct launches without `?token=`
  fall through to normal restoreSession() using prior localStorage tokens --
  existing behavior unchanged.

### v3.9 (April 16, 2026)
- HOSTROLE: CreateEsportRoomOpts and CreateSocialRoomOpts accept
  `hostRole: 'PLAYER' | 'SPECTATOR'` (replaces earlier boolean hostAsPlayer,
  backward compatible). Host can spectate without occupying a player seat.
- Backend migration #41: SPECTATING added to PrivateRoomPlayerStatus enum;
  service skips player slot when hostRole is SPECTATOR.
- ASSET PATH RULES documented: public/ assets must use
  import.meta.env.BASE_URL, src/ assets use normal ES module imports.

### v3.8 (April 17, 2026)
- QUICKPLAY: Dynamic category seeding from Game.gameCategory on auto-create
  (buildSeedData seeds Social defaults: 4 players, $0.25-$5 tiers, 5% rake,
  90s timeout, 20 min session; Esport defaults: 1v1, $1-$25 tiers, 10% fee)
- QUICKPLAY DTO: DOU_DIZHU + OTHER added to SocialGameTypeDto, socialGameTypeCustom
  field added for developer-defined custom game types
- ADMIN QUICKPLAY: Category toggle (Esport<->Social) in edit mode, social game
  type dropdown with OTHER custom input, developer-configured awareness banner,
  session duration field for social games
- CREATEROOM: Category-aware on main deskillz.games app -- GameDetailPage and
  GlobalLobbyPage now pass game.gameCategory to CreateRoomModal so social games
  show SocialGameSettings and esport games show EsportGameSettings
- ESPORT SETTINGS: Fixed ChipPlusFreeInput Custom button (was onClick={() => {}),
  now sets value to non-preset to reveal free input field
- LOBBY API: GameWithLobbyStats interface now includes gameCategory field
- BACKEND: formatConfig() returns socialGameTypeCustom, updateConfig/updateConfigAdmin
  sync socialGameType + socialGameTypeCustom back to Game model

### v3.6 (April 13, 2026)
- DISPUTE ENHANCEMENT: DisputeModal rewritten with 4-layer match context:
  Layer 1 auto-attach (props from ResultsScreen), Layer 2 recent matches
  selector (last 10 matches as selectable cards), Layer 3 localStorage
  last-match suggestion (7-day expiry), Layer 4 manual roomCode fallback
- NEW: DeskillzBridge.persistLastMatch() -- persist match context to localStorage
- NEW: DeskillzBridge.getLastMatch() -- read last match from localStorage
- NEW: DeskillzBridge.getRecentMatchesForDispute() -- last 10 matches for dispute
- DeskillzBridge: fileDispute() accepts roomCode, DisputeRecord adds roomCode
- Backend: CreateDisputeDto accepts roomCode (stored in metadata JSON)
- Backend: GET /matches/history/me adds tournamentId + matchType per match
- Backend: dispute:status-changed + dispute:notification socket events
- FIX: getPublicRooms() -> /private-rooms (was /private-rooms/public, 404)
- FIX: getMatchHistory() -> /matches/history/me (was /users/match-history)
- FIX: Admin dispute notification path -> /admin/disputes/:id/notify
- FREE MODE: SocialGameSettings + EsportGameSettings show "Placement Ranking"
  with ordinal labels instead of prize % inputs when entryFee is 0
- FREE MODE: PrizeDistributionEditor shows placement UI when prizePool is 0
- Admin: QuickPlayAdminTab inline editing (Edit/Save/Cancel for all fields)
- Updated Section 19 API reference: dispute endpoints include roomCode
- Updated Section 22 testing: dispute context layer tests added

### v3.5 (April 13, 2026)
- NEW: DisputeModal -- full dispute filing component for results screens.
  7 reasons (WRONG_SCORE, CHEATING, DISCONNECTION, NPC_ISSUE, PAYMENT_ISSUE,
  UNFAIR_MATCHMAKING, OTHER), 3 types (TOURNAMENT, QUICK_PLAY, PRIVATE_ROOM),
  description textarea (10-2000 chars), context badge with colour coding,
  submitting/success/error states, 24-48hr review notice, reference ID display.
- NEW: DeskillzBridge.fileDispute() -- POST /api/v1/disputes
  (rate limited: 5 open per user, prevents duplicate disputes on same event)
- NEW: DeskillzBridge.getMyDisputes(status?) -- GET /api/v1/disputes/me
- NEW: DeskillzBridge.getDisputeDetails(id) -- GET /api/v1/disputes/:id
- NEW: DeskillzBridge.addDisputeEvidence(id, evidence[]) -- POST /api/v1/disputes/:id/evidence
- NEW: DisputeRecord type (13 fields: id, disputeType, tournamentId,
  tournamentName, matchId, reason, description, evidence, status,
  resolution, reviewerName, resolvedAt, createdAt)
- Updated Section 4 screen structure: added dispute modal note
- Updated Section 16: tournaments count 3->4 (DisputeModal added)
- Updated Section 19: 4 dispute API endpoints added
- Updated Section 22: dispute testing checklist added

### v3.4 (April 12, 2026)
- NEW: TournamentLobbyCard -- post-check-in tournament lifecycle component
  States: WAITING_FOR_START, TABLE_ASSIGNED, MATCH_READY, PLAYING,
  BETWEEN_ROUNDS, ELIMINATED, CHAMPION. Seat dots fill in real-time.
  3-second countdown on MATCH_READY -> onMatchStart callback fires.
- NEW: useTournamentLobby hook -- polls /tournaments/:id/my-status and
  /tournaments/:id/schedule, subscribes to tournament:starting,
  room:table-assigned, room:table-closed socket events
- NEW: DeskillzBridge.getTournamentSchedule(tournamentId) method
- NEW: 5 TypeScript types: TournamentSchedule, TournamentScheduleRound,
  TournamentScheduleTable, TournamentSchedulePlayer, TournamentPlayerStatus
- FREE ENTRY: TournamentCard shows green "Free" pill badge when entryFee=0
- FREE ENTRY: CreateTournamentModal Free/Paid chip toggle, currency greyed out
  when Free, helper text "no wallet required, no rake collected"
- FREE ENTRY: QuickPlayCard hides currency when FREE chip selected, shows
  "Free Entry -- No wallet required" banner, "No rake", "For fun" labels
- FREE ENTRY: QuickPlaySettingsTab allows $0 entry fee tier
- FREE ENTRY: Backend auto-confirms free tournament registrations (no tx hash)
- FREE ENTRY: QuickPlay escrow skips wallet deduction for $0 entry fees
- HOST DASHBOARD: HostProfile adds freeEventsHosted, freePlayersHosted,
  monthlyFreeEvents, monthlyFreePlayers (Prisma migration + API + hook)
- HOST DASHBOARD: 3 new community badges: COMMUNITY_CHAMPION (10 free events),
  FREE_FOR_ALL (50 free players), OPEN_DOORS (100 free events)
- HOST DASHBOARD: tournaments.processor now counts rooms/players for free events
  (previously the entire increment block was skipped when entryFee <= 0)
- NPC FIX: QuickPlay entry fee escrow added (was missing -- phantom prize pools)
- NPC FIX: Tournament NPC fill uses escrowAddress from tournament record
  (was empty string causing on-chain tx failure)
- QuickPlay future-proofing: SocialGameType enum includes DOU_DIZHU,
  SOCIAL_GAME_LABELS is now Record<string,string> (extensible),
  fetchSocialGameTypes() fetches from GET /api/v1/games/social-types,
  getSocialGameLabel() for safe label lookup
- QuickPlaySettingsTab: social game type selector dynamically fetched from backend
- QuickPlayAdminTab: config details use getSocialGameLabel()
- Updated Section 9 (QuickPlay) with future-proof social game type note
- Updated Section 16 (game-ui package) with 2 new files
- Updated Section 22 (testing checklist) with tournament lobby tests

### v3.3 (April 11, 2026)
- SDK v3.4.3 released
- GameCapabilities: 4 new mode flags (supportsBlitz1v1, supportsDuel1v1, supportsSinglePlayerMode, supportsTurnBased)
- SocialGameSettings: DOU_DIZHU added as game type with 3-player defaults
- SocialGameSettings: timer, rake, point-target all use ChipPlusFreeInput (custom freeform values)
- EsportGameSettings: duration/rounds use ChipPlusFreeInput, platformFeePercent configurable, 6 game modes
- EsportGameConfig: new platformFeePercent field (default 10, was hardcoded)
- GameMode type expanded: SYNC, ASYNC, BLITZ_1V1, DUEL_1V1, SINGLE_PLAYER, TURN_BASED
- QuickPlayCard: skeleton preview empty state when no QuickPlayConfig exists
- LobbyOverlay: tournament tab filter bar, stats summary, auto-refresh, retry button, skeleton empty state
- DeskillzBridge: roomRebuy(), submitRound(), triggerSettlement(), 5 social QuickPlay methods added
- vite-plugin-sw-version.mjs applied to all 4 React games (Big 2, Mahjong, Thirteen Cards, DDZ)
- release-sdk.ps1 rewritten: workbox retired, .mjs, deskillz-sw.js, version bump, CHANGELOG auto-entry

### v3.2 (April 4, 2026)
- PWA Cache-Bust: deskillz-sw.js replaces sw.js to avoid Workbox generateSW overwrite
- New shared files: public/deskillz-sw.js, src/plugins/vite-plugin-sw-version.ts
- index.html template updated: registers deskillz-sw.js, removed confirm() dialog
- maxTournamentSize added to GameCapabilities interface + DEFAULT_CAPABILITIES
- Developer Portal Gameplay tab reorganized with tooltips and label fixes
- Build command updated: manual hash stamp for deskillz-sw.js after npm run build
- Cloud Build confirmed: Docker worker deploys PWA files to hosted/{gameId}/pwa/ on R2
- Game Builds tab confirmed: updates live hosted game (not just downloadable artifacts)

### v3.1 (April 3, 2026)
- GameCapabilities feature wired end-to-end (database -> API -> frontend -> standalone)
- 6 new fields on Game model: supports1v1, supportsFFA, supportsSinglePlayer,
  supportsSingleElimination, minMatchDurationSeconds, maxMatchDurationSeconds
- DeveloperPortal Edit Game modal: Gameplay tab with capability toggles
- NewGamePage: Game Capabilities section in Step 4 (Tournament Settings)
- DeskillzBridge v3.3: getGameCapabilities() method
- SocialGameSettings v3.3.3: accepts capabilities prop
- SDK v3.3 released with GameCapabilities.ts + updated guides

### v3.0 (March 30, 2026)
- DeskillzBridge updated to v3.2 (2,483 lines, 50 methods -- 20 new)
- Added 8 shared room components to @deskillz/game-ui: BuyInModal, CashOutModal, RebuyModal, LowBalanceWarning, TurnTimer, PauseRequestModal, SocialGameSettings, AgeVerificationModal
- Added useHostDashboard hook for standalone host dashboard screens
- Updated Section 3: architecture stack now shows 3 layers (bridge + game-ui + rooms)
- Updated Section 10: room components are shared templates (not rebuilt per game)
- Updated Section 13: useHostDashboard hook replaces manual API calls
- Updated Section 16: package structure adds rooms/ directory + useHostDashboard
- Updated Section 19: 16 new API endpoints documented
- Updated Section 22: host dashboard + room component + score signing test items
- Updated Section 24: 9 new files added to integration scope table
- New bridge methods: getHostProfile, getHostEarnings, getHostBadges, getActiveRooms, getEsportsTier, getSocialTier, getLevelInfo, verifyAge, checkAgeVerified, requestHostWithdrawal, getGameLeaderboard, getMyRank, getMyGameRank, getUserRank, getUserStats, getMyProfile, getTransactions, signScore, verifyScore, startRoom

### v2.9 (March 30, 2026)
- Updated Section 9 (QuickPlay Page) to v3.4.3 — full rewrite
- QuickPlayCard is now a shared, ready-to-use template — game developers drop it in, do not build from scratch
- Social games: point value and currency are dropdown selectors driven by admin config
- Social games: live Available Games board (quick-play:lobby-update socket)
- Social games: Create Game + JOIN flow; new 'waiting' state
- Esport games: entry fee + player mode remain chips; currency now dropdown
- Updated Section 16 (@deskillz/game-ui) to v3.4.3 — added AvailableGame interface
- Updated Section 18 SDK Events — added quickPlayLobbyUpdate + quickPlayWaiting
- Updated Section 21 Phase 4 to reflect new QuickPlay states
- Updated Section 22 testing checklist for QuickPlay v3.2
- Updated Section 27 (QuickPlay visual spec) to v3.2 — esport vs social flow table

### v2.8 (March 28, 2026)
- [BREAKING] UMD bundle (`DeskillzUI.js`) retired. All standalone web games are React/Vite.
- Fixed all UI components: replaced custom Tailwind tokens with standard Tailwind utilities.
- Fixed QuickPlayCard: removed useNavigate dependency, navigation via onMatchStart callback.

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Game Type Reference](#2-game-type-reference)
3. [Architecture: Self-Sufficient Mode](#3-architecture-self-sufficient-mode)
4. [Screen Structure](#4-screen-structure)
5. [Auth Screens](#5-auth-screens)
6. [Lobby Screen](#6-lobby-screen)
7. [Tournament Page - Three Card Types](#7-tournament-page-three-card-types)
8. [Enrollment Flow - Register, Check In, Join](#8-enrollment-flow-register-check-in-join)
9. [QuickPlay Page](#9-quickplay-page)
10. [Private Rooms](#10-private-rooms)
11. [Profile Screen](#11-profile-screen)
12. [Wallet Screen](#12-wallet-screen)
13. [Host Dashboard (Social Games)](#13-host-dashboard-social-games)
14. [Results Screen](#14-results-screen)
15. [Common UI Components](#15-common-ui-components)
16. [Shared UI Library: @deskillz/game-ui](#16-shared-ui-library-deskillzgame-ui)
17. [Design Tokens](#17-design-tokens)
18. [SDK Events (v3.0 Full Reference)](#18-sdk-events-v30-full-reference)
19. [API Endpoint Reference](#19-api-endpoint-reference)
20. [Cloud Build Requirements](#20-cloud-build-requirements)
21. [Implementation Phases](#21-implementation-phases)
22. [Testing Checklist](#22-testing-checklist)
23. [Migration Guide: v2.x to v3.0](#23-migration-guide-v2x-to-v30)
24. [Existing Game Integration Scope](#24-existing-game-integration-scope)
25. [Standard Architecture: React/Vite + Canvas](#25-standard-architecture-reactvite--canvas)
26. [Web SDK Compatibility - SDK v3.0 Changes](#26-web-sdk-compatibility)
27. [Unified QuickPlayCard - Visual Spec](#27-quickplay-config-templates)

---

## 1. OVERVIEW

### Purpose

This document is the complete UI implementation guide for building self-sufficient
Deskillz standalone game apps. It covers every screen, component, card type,
enrollment state, and SDK event a developer needs to ship a fully integrated game.

**All standalone web games use React/Vite. There is no non-React path.**

### What "Self-Sufficient" Means

Every standalone game is a complete, independent app. Players never need to leave
your game to register, pay, enter a tournament, or collect winnings.

### Supported Game Types

| Category | Description | Modes Available |
|----------|-------------|-----------------|
| Esports | Competitive synchronous / asynchronous | Tournaments, QuickPlay, Private Rooms |
| Social | Skill-based social games (Big 2, Mahjong, etc.) | Cash Game, Social Tournament, Private Rooms |

---

## 2. GAME TYPE REFERENCE

Before building any UI, identify which category and modes your game supports.

### Esport Games

Examples: Connect-3, arcade games, puzzle games, endless runners.

| Must Implement | Optional |
|----------------|----------|
| Auth screens | Private Rooms |
| Lobby with Tournament tab | Host Dashboard |
| TournamentCard (esport variant) | Spectator mode |
| QuickPlayPage | |
| Profile + Wallet | |
| Results screen | |

### Social Games

Examples: Big 2, Mahjong, Dou Dizhu, Thirteen Cards.

| Must Implement | Optional |
|----------------|----------|
| Auth screens | QuickPlay |
| Lobby with Tournament tab | Spectator mode |
| TournamentCard (social tournament variant) | |
| TournamentCard (cash game variant) | |
| Enrollment flow (Register/Check In/Join) | |
| Buy-in modal + Cash-out flow | |
| Host Dashboard | |
| Profile + Wallet | |
| Results screen | |

---

## 3. ARCHITECTURE: SELF-SUFFICIENT MODE

### Stack

All standalone web games use this exact stack:

```
React 18 + TypeScript + Vite
  |
  +-- DeskillzBridge.ts          <- SDK v3.2, embedded in src/sdk/ (2,483 lines, 50 methods)
  +-- @deskillz/game-ui          <- Shared component library (ES module)
  |     +-- tournaments/         <- TournamentCard, QuickPlayCard
  |     +-- rooms/               <- BuyInModal, CashOutModal, RebuyModal, TurnTimer, etc.
  |     +-- hooks/               <- useEnrollmentStatus, useQuickPlayQueue, useHostDashboard
  +-- Your gameplay engine       <- Canvas, PixiJS, Three.js, or React game logic
```

### How the Flow Works

```
App starts
  |
  v
DeskillzBridge.init()   (before React renders, in main.tsx)
  |
  v
React renders App.tsx
  |
  +-- Not authenticated --> AuthScreen
  |
  +-- Authenticated     --> LobbyScreen (Tournaments | QuickPlay | Profile | Rooms)
                                |
                                +-- Player joins tournament/quickplay
                                |
                                v
                            GameScreen (your gameplay canvas/engine)
                                |
                                v
                            ResultsScreen
                                |
                                v
                            Back to LobbyScreen
```

### SDK Architecture — Two Layers

```
Layer 1: DeskillzBridge.ts  (src/sdk/DeskillzBridge.ts)
  ALL API calls -- tournaments, enrollment, QuickPlay, auth, wallet,
  host dashboard, leaderboard, user profiles, score signing, rooms
  v3.2: 50 methods (20 new: host, leaderboard, user, score, rooms)
  DO NOT MODIFY -- replace wholesale when a new version is released

Layer 2: @deskillz/game-ui  (npm package, ES module)
  React UI -- TournamentCard, QuickPlayCard, 8 room components, 3 hooks
  Calls DeskillzBridge at runtime via window.DeskillzBridge.getInstance()
  No direct HTTP calls -- the bridge handles everything

Layer 3: Room components  (src/components/rooms/)  [NEW in v3.2]
  8 shared components for social game rooms -- identical to main Deskillz app
  Pure display: accept props, render UI. Parent calls bridge methods.
  BuyInModal, CashOutModal, RebuyModal, LowBalanceWarning,
  TurnTimer, PauseRequestModal, SocialGameSettings, AgeVerificationModal
```

**Every standalone game must update DeskillzBridge.ts first.**
Without the updated bridge, none of the enrollment or QuickPlay features work.

---

## 4. SCREEN STRUCTURE

### Required Screens

| Screen | Esport | Social | Route |
|--------|--------|--------|-------|
| AuthScreen | YES | YES | /auth |
| LobbyScreen | YES | YES | /lobby |
| TournamentPage | YES | YES | /tournaments |
| QuickPlayPage | YES | Optional | /quick-play |
| GameScreen | YES | YES | /game |
| ResultsScreen | YES | YES | /results |
| ProfileScreen | YES | YES | /profile |
| WalletScreen | YES | YES | /wallet |
| CreateRoomScreen | Optional | YES | /rooms/create |
| RoomLobbyScreen | Optional | YES | /rooms/:id |
| HostDashboard | No | YES | /host |
| HowToPlay | Optional | Optional | /how-to-play |

### App.tsx Route Structure

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DeskillzBridge } from './sdk/DeskillzBridge'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth"        element={<AuthScreen />} />
        <Route path="/lobby"       element={<LobbyScreen />} />
        <Route path="/tournaments" element={<TournamentPage />} />
        <Route path="/quick-play"  element={<QuickPlayPage />} />
        <Route path="/game"        element={<GameScreen />} />
        <Route path="/results"     element={<ResultsScreen />} />
        <Route path="/profile"     element={<ProfileScreen />} />
        <Route path="/wallet"      element={<WalletScreen />} />
        <Route path="/rooms/create" element={<CreateRoomScreen />} />
        <Route path="/rooms/:id"   element={<RoomLobbyScreen />} />
        <Route path="/host"        element={<HostDashboard />} />
        <Route path="*"            element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### main.tsx — Bridge Init Pattern

```tsx
// src/main.tsx
// CRITICAL: DeskillzBridge.init() BEFORE ReactDOM.render()

import { DeskillzBridge } from './sdk/DeskillzBridge'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

DeskillzBridge.init({
  gameId:     import.meta.env.VITE_GAME_ID     || 'YOUR_GAME_ID',
  gameKey:    import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://newdeskillzgames-production.up.railway.app',
  socketUrl:  import.meta.env.VITE_SOCKET_URL   || 'wss://newdeskillzgames-production.up.railway.app',
  debug:      import.meta.env.VITE_ENABLE_DEBUG === 'true',
})

// CRITICAL: expose bridge on window BEFORE React renders.
// useEnrollmentStatus and useQuickPlayQueue access the bridge via:
//   (window as any).DeskillzBridge?.getInstance?.()
// Without this line every shared hook returns null and no data loads.
// If your game uses a bridge subclass, replace DeskillzBridge with your subclass.
const instance = DeskillzBridge.getInstance()
;(window as any).DeskillzBridge = { getInstance: () => instance }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 5. AUTH SCREENS

### Required Auth Methods

| Method | Bridge call | Endpoint |
|--------|-------------|----------|
| Email login | `bridge.login(email, password)` | POST /api/v1/auth/login |
| Email register | `bridge.register(username, email, password)` | POST /api/v1/auth/register |
| Wallet (SIWE) | `bridge.loginWithWallet(addr, chainId, signFn)` | GET /auth/nonce + POST /auth/wallet/verify |
| Guest | `bridge.loginAsGuest()` | None (local only) |

### Session Restore

```tsx
useEffect(() => {
  const bridge = DeskillzBridge.getInstance()
  if (bridge.getIsAuthenticated()) {
    navigate('/lobby')
  }
}, [])
```

### Guest Guards

Wrap competitive sections in a guest guard. Guests may only access free practice.

```tsx
function GuestGuard({ isGuest, onLogin, message, children }) {
  if (!isGuest) return <>{children}</>
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ filter: 'blur(6px)', opacity: 0.4, pointerEvents: 'none' }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'rgba(5,10,24,0.6)', backdropFilter: 'blur(2px)', borderRadius: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e8f0' }}>{message}</div>
        <button onClick={onLogin} style={{
          padding: '10px 32px',
          background: 'linear-gradient(135deg, #06b6d4, #9d4edd)',
          color: '#fff', fontWeight: 700, fontSize: 14,
          border: 'none', borderRadius: 10, cursor: 'pointer',
        }}>Log In / Register</button>
      </div>
    </div>
  )
}
```

---

## 6. LOBBY SCREEN

### Tab Structure

```
[Tournaments]  [Quick Play]  [Private Rooms]  [Host Dashboard]
```

The lobby is the navigation hub. Each tab leads to a dedicated screen/page.

### Tournaments Tab

Fetches tournaments via bridge and renders them with `TournamentCard`:

```tsx
import { TournamentCard } from '@deskillz/game-ui'
import { useEnrollmentStatus } from '@deskillz/game-ui'

function TournamentRow({ tournament, index }) {
  const { status, dqCountdown, loading, register, checkIn } =
    useEnrollmentStatus(tournament.id, {
      enabled: tournament.status !== 'COMPLETED',
    })

  return (
    <TournamentCard
      tournament={tournament}
      userStatus={status}
      dqCountdown={dqCountdown}
      enrollmentLoading={loading}
      onRegister={() => register()}
      onCheckIn={() => checkIn()}
      appUrl={undefined}
    />
  )
}

// Fetch tournaments
useEffect(() => {
  DeskillzBridge.getInstance()
    .getTournaments({ gameId })
    .then(setTournaments)
}, [gameId])
```

### Quick Play Tab

Navigates to `/quick-play`. The full QuickPlay card is on that dedicated page.
The lobby tab is just a navigation trigger — no QuickPlay logic lives in the lobby.

```tsx
// In LobbyScreen — Quick Play tab
const handleQuickPlayTab = () => navigate('/quick-play')
```

---

## 7. TOURNAMENT PAGE - THREE CARD TYPES

`TournamentCard` from `@deskillz/game-ui` handles all three types automatically.
The card type is derived from `tournament.gameCategory` and `tournament.socialMode`.

| gameCategory | socialMode | Card style | Left border |
|-------------|-----------|------------|------------|
| ESPORTS | any | Entry fee + prize pool | Cyan |
| SOCIAL | TOURNAMENT | Entry fee + prize pool | Purple |
| SOCIAL | CASH_GAME | Buy-in range + rake % | Pink |

Do NOT build separate card components. `TournamentCard` is the single source.

---

## 8. ENROLLMENT FLOW - REGISTER, CHECK IN, JOIN

### Timeline

```
T - infinity  Player registers          -> status: REGISTERED
T - 30 min    Check-in window opens     -> status: CHECKIN_OPEN
              DQ countdown starts
T - 10 min    No-show DQ fires          -> status: DQ_NO_SHOW
              Entry FORFEITED - no refund
T - 0         Tournament starts         -> CHECKED_IN players: STARTING
```

### Bridge Methods

```typescript
// Step 1: Register (anytime before T-30)
await bridge.registerTournament(tournamentId)

// Step 2: Check in (T-30 to T-10 window only)
await bridge.checkInTournament(tournamentId)

// Status polling (use hook instead — it handles polling + socket)
const state = await bridge.getEnrollmentStatus(tournamentId)

// All registrations (sorted by urgency — nearest DQ first)
const registrations = await bridge.getMyRegistrations()
```

### useEnrollmentStatus Hook

```typescript
const { status, dqCountdown, loading, register, checkIn } =
  useEnrollmentStatus(tournamentId, { enabled: true })

// status: 'NOT_REGISTERED' | 'REGISTERED' | 'CHECKIN_OPEN' | 'CHECKED_IN'
//       | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED' | 'DQ_NO_SHOW' | 'STANDBY' | 'CANCELLED'

// dqCountdown: live seconds remaining until DQ (only during CHECKIN_OPEN)
```

The hook polls every 60 seconds and subscribes to all 5 tournament socket events.
No manual socket wiring needed.

### Socket Events (auto-handled by hook)

| Socket event | Bridge event emitted | When |
|-------------|---------------------|------|
| `tournament:registered` | `tournamentRegistered` | Player registered |
| `tournament:checked-in` | `tournamentCheckedIn` | Player checked in |
| `tournament:checkin-open` | `tournamentCheckinOpen` | T-30: window opens |
| `tournament:dq-noshow` | `tournamentDQNoShow` | T-10: no-show DQ'd |
| `tournament:starting` | `tournamentStarting` | T-0: tournament starts |

---

## 9. QUICKPLAY PAGE

### The Core Principle

`QuickPlayCard` and `useQuickPlayQueue` are **shared, ready-to-use components**
distributed in the SDK ZIP. Game developers drop them in — they do NOT build
their own QuickPlay UI from scratch.

All options (point value tiers, entry fee tiers, currencies, player modes, rake,
NPC settings) are set by the admin/developer in the Deskillz admin panel and
stored as a `QuickPlayConfig` record for that gameId. The card fetches this config
via the bridge and renders the correct UI automatically. Adding or changing a tier
or currency in the admin panel reflects in the game immediately — no code change.

### How It Works — Who Controls What

```
Admin/Developer (Deskillz Admin Panel)
  Configures: point value tiers, currencies, NPC settings, rake, timeout
      |
      v
Backend stores QuickPlayConfig for the gameId
      |
      v
useQuickPlayQueue calls bridge.getQuickPlayConfig(gameId) on mount
      |
      v
QuickPlayCard renders dropdowns and selectors from that config
      |
      v
Player sees exactly what admin configured — nothing hardcoded
```

### Esport vs Social — Two Different Flows

The card reads `config.gameCategory` and branches automatically:

**ESPORTS flow (Candy Duel, Bubble Battle, future arcade/puzzle games):**

```
IDLE       Entry fee chips (from esportEntryFeeTiers)
           Player mode chips (from esportPlayerModes) — only if > 1 mode
           Currency dropdown (from esportCurrencies)
           Prize preview + platform fee % + prize type + duration (2x2 grid)
           [Play Now] button
           |
           v
SEARCHING  Animated progress bar, elapsed timer, players in queue
           [Cancel] button
           |
           v
FILLING    "Filling match..." — NPC filling remaining slots
           (NEVER say bot / AI / NPC to players)
           |
           v
FOUND      "Match Found!" — auto-navigates via onMatchStart after 2.5s
```

**SOCIAL flow (Big 2, Mahjong, Thirteen Cards, Dou Dizhu):**

```
IDLE       Point value dropdown (from socialPointValueTiers)
           Currency dropdown (from socialCurrencies)
           Buy-in range preview (calculated from multipliers)
           Rake % info (from socialRakePercent + socialRakeCapUsd)
           Available Games board (live from quick-play:lobby-update socket)
             -- Shows open games other players created
             -- Each entry: point value / seats filled / countdown / [JOIN] button
             -- Empty state: "No open games — create one below"
           [Create $X/pt Game] button
           |
     ------+------
     |            |
     v            v
WAITING         Player JOINed existing game
  Player         -> goes straight to WAITING
  created
  a game,
  others
  see it
  on board
     |
     v
FILLING    "Filling match..." (NPC fills if timeout reached)
     |
     v
FOUND      "Match Found!" — auto-navigates via onMatchStart after 2.5s
```

### QuickPlayPage.tsx — identical for all games

```tsx
// src/screens/QuickPlayPage.tsx
import { useNavigate } from 'react-router-dom'
import QuickPlayCard from '../components/tournaments/QuickPlayCard'
import { useQuickPlayQueue } from '../hooks/useQuickPlayQueue'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

export default function QuickPlayPage() {
  const navigate = useNavigate()
  const gameId   = DeskillzBridge.getInstance().getConfig().gameId
  const qp       = useQuickPlayQueue(gameId)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem' }}>
      <QuickPlayCard
        qp={qp}
        onMatchStart={(matchData) => {
          // onMatchStart fires when match is ready for ALL game types and states.
          // The card has no router dependency — you handle navigation here.
          navigate('/game', { state: { matchData } })
          // OR for custom state-based router:
          // navigateTo('game', { matchData })
        }}
      />
    </div>
  )
}
```

This is the COMPLETE QuickPlayPage for any game type. The card handles all
rendering, state transitions, socket subscriptions, and API calls internally.

### Empty States Are Correct

| Game type | Empty state | Meaning |
|-----------|-------------|---------|
| Esport | Selectors visible, "Play Now" ready | No players in queue yet — works correctly when tapped |
| Social | "No open games — create one below" | No games created yet — player creates first game |

Neither state requires a code change. Both resolve when players use the feature.

### Admin Must Activate First

`QuickPlayCard` renders a loading spinner until `bridge.getQuickPlayConfig(gameId)`
returns data. If it spins indefinitely, the admin has not yet created a QuickPlay
config for the game's gameId in the admin panel. Once activated, the card renders
with the configured options immediately.

---

## 10. PRIVATE ROOMS

Private Rooms use a separate flow from tournament enrollment. The host's
Create Room modal supports two modes for social games:

### Social Room Modes

**Cash Game (socialMode: 'CASH_GAME'):**
- Rake-based, open-ended, players join/leave freely
- Host sets: point value ($0.01-$100), rake % (5-10%), rake cap, turn timer
- Game end: Big 2/13 Card = race to X points, Mahjong = wind rounds (4/8/16)
- Additional: max bid (1/2/3), spring bonus toggle
- Host chooses: play in room or monitor only

**Tournament (socialMode: 'TOURNAMENT'):**
- Bracket structure, entry fee goes into prize pool, elimination
- Host sets: entry fee, prize distribution, number of tables, seats per table
- Turn timer and point target still apply per round
- No rake — revenue comes from platform fee on prize pool

### Room Creation

```typescript
// Esport room (entry-fee based, fixed payout)
await bridge.createRoom({
  entryFee, maxPlayers, currency, matchDuration,
  esportMatchMode,  // 'BLITZ_1V1' | 'DUEL_1V1' | 'TURN_BASED' | 'ASYNC' | 'SYNC' | 'SINGLE_PLAYER'
  hostRole,         // 'PLAYER' | 'SPECTATOR'
})

// Social room -- Cash Game
await bridge.createSocialRoom({
  socialMode: 'CASH_GAME',
  gameType, pointValue, rakePercent, rakeCap, pointTarget,
  maxBid, springBonus, turnTimerSeconds, currency,
  visibility, hostRole
})

// Social room -- Tournament
await bridge.createSocialRoom({
  socialMode: 'TOURNAMENT',
  gameType, entryFee, entryCurrency, prizeDistribution,
  numberOfTables, seatsPerTable, pointTarget, turnTimerSeconds,
  visibility, hostRole
})
```

> **esportMatchMode** replaces the legacy `mode` (SYNC/ASYNC) field for
> esport rooms. The backend auto-derives legacy mode for backward compat
> (ASYNC stays ASYNC, everything else maps to SYNC). Social rooms always
> use SYNC.

> **hostRole vs hostAsPlayer:** The new `hostRole: 'PLAYER' | 'SPECTATOR'`
> field is preferred over the boolean `hostAsPlayer`. Both are accepted --
> `hostRole` takes precedence when both are sent. When SPECTATOR, the host
> receives all socket events but does not consume a player seat.

### EsportMatchMode Quick Reference

| Mode | Description | Capability Flag |
|------|-------------|-----------------|
| `BLITZ_1V1` | Simultaneous 1v1, own screens | `supportsBlitz1v1` |
| `DUEL_1V1` | Real-time 1v1, same map | `supportsDuel1v1` |
| `TURN_BASED` | Turn-based, shared board, both online | `supportsTurnBased` |
| `ASYNC` | Score-attack, play before deadline | `supportsAsync` |
| `SYNC` | Real-time queue matching | `supportsSync` |
| `SINGLE_PLAYER` | Solo score attack | `supportsSinglePlayerMode` |

### Room Join

```typescript
await bridge.joinRoom(roomCode)
```

### Shared Components for Room Creation

Use `SocialGameSettings` (with `lockedGameType` prop in standalone apps) for social
rooms. Use `EsportGameSettings` for esport rooms. Both components handle the full
form with mode toggle, all configurable fields, and preview cards.
See React Game Update Guide v1.3 Step 7a/7b for complete integration code.

Private Room and Host Dashboard screens do NOT use TournamentCard or QuickPlayCard.
They are fully separate concerns.

---

## 11. PROFILE SCREEN

```typescript
// Load profile
const profile = await bridge.getProfile()           // GET /api/v1/users/me

// Load stats (requires UUID param)
const stats = await bridge.getPlayerStats()         // GET /api/v1/users/:userId/stats

// Load history
const history = await bridge.getMatchHistory()      // GET /api/v1/users/match-history
```

### toNum() Helper — Required

Backend returns Prisma Decimal fields as strings. Wrap all `.toFixed()` calls:

```typescript
const toNum = (v: unknown): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

// Usage:
toNum(stats.totalEarnings).toFixed(2)   // NOT stats.totalEarnings.toFixed(2)
```

---

## 12. WALLET SCREEN

```typescript
// Balances (NOT /wallet/total — that endpoint does not exist)
const balances = await bridge.getWalletBalance()    // GET /api/v1/wallet/balances
// Compute total: balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0)

// Deposit / Withdraw
await bridge.deposit(currency, amount)
await bridge.withdraw(currency, amount)
```

### Currency Enum

Always use the full chain-suffixed value. Backend rejects plain `USDT` or `USDC`.

| Display | Backend enum value |
|---------|-------------------|
| USDT (BSC) | `USDT_BSC` |
| USDT (Tron) | `USDT_TRON` |
| USDC (BSC) | `USDC_BSC` |
| USDC (Tron) | `USDC_TRON` |
| BNB | `BNB` |

---

## 13. HOST DASHBOARD (SOCIAL GAMES)

### Design Principle: Focused Operational View

The standalone host dashboard shows **just enough for the host to operate their rooms**.
The full dashboard (badges, level progression, tier comparisons, room templates,
settings) lives on the main Deskillz app at `https://deskillz.games/host`.

**Standalone app shows:**
- Tier name + level + revenue share percentage
- Earnings (all-time, this month, pending withdrawal)
- Active rooms for THIS game (player count, room code, status, rake earned)
- Create Room button
- Withdraw button (when pending > 0)
- Recent settlements (last 5)
- Deep link to full dashboard

**Standalone app does NOT show:**
- Dual tier cards (esport + social) -- show only the relevant tier for this game
- Badges section
- Settings tab
- Earnings breakdown by esport vs social
- Host level progression dots / next level preview
- Room templates

### Deep Link to Full Dashboard

```tsx
const FULL_DASHBOARD_URL = 'https://deskillz.games/host'

<a href={FULL_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
  View Full Host Dashboard on Deskillz
</a>
```

The user is authenticated via the same wallet, so they land directly on their
full dashboard with badges, level progression, tier comparisons, and settings.

### useHostDashboard Hook (v3.2 -- Recommended)

```typescript
import { useHostDashboard, getTierDisplay } from '../hooks/useHostDashboard'

const {
  profile, earnings, badges, activeRooms, recentSettlements,
  activeTierDisplay, totalEarnings, monthlyEarnings, pendingSettlement,
  isLoading, error, isAgeVerified, refresh, verifyAge, requestWithdrawal,
} = useHostDashboard()
```

The hook handles safe defaults, 60-second polling, and fallback to individual
endpoints if the aggregate endpoint fails. It also provides computed values
(totalEarnings, monthlyEarnings, pendingSettlement) with Prisma Decimal-to-number
conversion already applied.

See the React Game Update Guide v1.3 Step 8 for the complete HostDashboardPage.tsx
with the focused operational layout and deep link.

### New Host Bridge Methods (v3.2)

```typescript
bridge.getHostProfile()               // GET /api/v1/host/profile (auto-creates)
bridge.getHostEarnings()              // GET /api/v1/host/earnings
bridge.getHostBadges()                // GET /api/v1/host/badges
bridge.getActiveRooms()               // GET /api/v1/host/rooms/active
bridge.getEsportsTier()               // GET /api/v1/host/tier/esports
bridge.getSocialTier()                // GET /api/v1/host/tier/social
bridge.getLevelInfo()                  // GET /api/v1/host/level
bridge.verifyAge()                    // POST /api/v1/host/verify-age
bridge.checkAgeVerified()             // GET /api/v1/host/age-verified
bridge.requestHostWithdrawal(params)  // POST /api/v1/host/withdraw
```

### Safe Defaults Pattern (REQUIRED)

The endpoint can return partial data. Always use spread-merge:

```typescript
const t = (data.esportsTierInfo ?? data.socialTierInfo ?? {}) as any
const e = (data.earnings ?? {}) as any

const dashboard = {
  tier:              t.tier             ?? 'BRONZE',
  revenueShare:      t.hostShare ?? 15,
  totalEarnings:     toNum(e.total      ?? 0),
  monthlyEarnings:   toNum(e.monthly    ?? 0),
  pendingSettlement: toNum(e.pending    ?? 0),
  activeRooms:       data.activeRooms   ?? [],
  recentSettlements: data.recentSettlements ?? [],
}
```

Do NOT access `data.tierInfo` — it does not exist.
Do NOT access `data.profile.totalEarnings` — earnings are in `data.earnings.total`.

---

## 14. RESULTS SCREEN

```typescript
// Submit score
await bridge.submitScore({
  tournamentId,
  score,
  timestamp: Date.now(),
})

// HMAC signing (REQUIRED for paid tournaments)
// Payload: `${gameId}:${score}:${timestamp}:${userId}`
```

---

## 15. COMMON UI COMPONENTS

All shared UI primitives come from `@deskillz/game-ui`. Do not rebuild them:

| Component | Import | Purpose |
|-----------|--------|---------|
| `TournamentCard` | `@deskillz/game-ui` | All 3 tournament card types |
| `TournamentLobbyCard` | `@deskillz/game-ui` | Post-check-in tournament lifecycle (v3.4.4) |
| `QuickPlayCard` | `@deskillz/game-ui` | QuickPlay 5-state card |
| `Badge` | `@deskillz/game-ui` | Status/mode badges |
| `Button` | `@deskillz/game-ui` | Primary/secondary/danger/success buttons |
| `Card` | `@deskillz/game-ui` | Card container with variants |
| `useEnrollmentStatus` | `@deskillz/game-ui` | Enrollment state + DQ countdown |
| `useQuickPlayQueue` | `@deskillz/game-ui` | QuickPlay queue state machine |
| `useTournamentLobby` | `@deskillz/game-ui` | Tournament lobby state machine (v3.4.4) |

---

## 16. SHARED UI LIBRARY: @deskillz/game-ui

### v3.4.3 Breaking Changes

- **`useQuickPlayQueue` exports new `AvailableGame` interface** — import if you need to type the live games board
- **Social QuickPlay flow changed** — `createGame()` and `joinGame(queueKey)` replace the single `joinQueue()` for social games. `joinQueue()` still works for esport.
- **New `'waiting'` status** — social player created a game, waiting for others. Handle in `onMatchStart` the same way as `'found'`.
- **Point value and currency are now dropdowns** — populated from config; no UI change needed on your side since `QuickPlayCard` renders them internally.

### Installation

```bash
npm install @deskillz/game-ui

# Peer dependencies (must be in your game project):
npm install react react-dom react-router-dom framer-motion lucide-react react-hot-toast clsx tailwind-merge
```

### Usage

```tsx
// Import design tokens once in App.tsx or index.css
import '@deskillz/game-ui/dist/DeskillzUI.css'

// Import components and hooks
import { TournamentCard, QuickPlayCard, useEnrollmentStatus, useQuickPlayQueue }
  from '@deskillz/game-ui'

// Import AvailableGame type if needed (social games board)
import type { AvailableGame } from '@deskillz/game-ui'
```

### Package Structure (v3.1.0)

```
@deskillz/game-ui/
  dist/
    DeskillzUI.es.js     <- ES module (all React games import from this)
    DeskillzUI.css       <- Design tokens CSS variables
    index.d.ts           <- TypeScript declarations
  src/
    components/
      tournaments/
        TournamentCard.tsx
        QuickPlayCard.tsx
      ui/
        Badge.tsx
        Button.tsx
        Card.tsx
    hooks/
      useEnrollmentStatus.ts
      useQuickPlayQueue.ts
      useHostDashboard.ts    [NEW in v3.2] Host dashboard state machine
    components/rooms/        [NEW in v3.2]
      BuyInModal.tsx         Social game buy-in with quick-select + currency
      CashOutModal.tsx       Cash-out with session summary + P/L
      RebuyModal.tsx         Bust recovery (rebuy or leave)
      LowBalanceWarning.tsx  Floating toast + inline variant + hook
      TurnTimer.tsx          Circular SVG timer + compact pill + overlay + hook
      PauseRequestModal.tsx  Pause request + vote + status (3 sub-modals)
      SocialGameSettings.tsx Cash Game (point value, rake, game end) or Tournament (entry fee, prize, tables)
      AgeVerificationModal.tsx 21+ age gate for hosting rooms
    tokens/
      colors.css
    bridge-types.ts      <- Inlined types, no import from deskillz-web-sdk
    index.ts             <- Public exports
    utils.ts             <- cn() helper
```

### Build Command (Platform Team Only)

```powershell
cd D:\NewDeskillzGames\packages\game-ui
npm install
npm run build
# Output: dist/DeskillzUI.es.js + dist/DeskillzUI.css
```

### What Was Retired

| Item | Status | Replacement |
|------|--------|-------------|
| `DeskillzUI.umd.js` | RETIRED | N/A — all games are React |
| `DeskillzUI.renderLobby()` | RETIRED | Import components directly |
| `DeskillzUI.showLobby()` | RETIRED | React state controls visibility |
| `DeskillzUI.hideLobby()` | RETIRED | React state controls visibility |
| `public/sdk/DeskillzUI.js` | RETIRED | Remove from all games |

---

## 17. DESIGN TOKENS

Import `@deskillz/game-ui/dist/DeskillzUI.css` once in your app.
These CSS variables are then available globally:

```css
:root {
  --dsk-card-bg:              #1a1a2e;
  --dsk-card-border:          #2a2a4a;
  --dsk-card-hover:           #2a2a3e;
  --dsk-card-darker:          #13131f;
  --dsk-card-radius:          0.75rem;
  --dsk-card-padding:         1.25rem;
  --dsk-badge-tournament:     #a855f7;
  --dsk-badge-cashgame:       #ec4899;
  --dsk-badge-quickplay:      #06b6d4;
  --dsk-badge-live:           #ef4444;
  --dsk-badge-open:           #22c55e;
  --dsk-btn-register:         #06b6d4;
  --dsk-btn-checkin:          #22c55e;
  --dsk-btn-dq:               #ef4444;
  --dsk-prize:                #22c55e;
  --dsk-rake:                 #ec4899;
  --dsk-text-primary:         #ffffff;
  --dsk-text-secondary:       rgba(255,255,255,0.5);
  /* Full list in tokens/colors.css */
}
```

Use these variables in your own CSS for consistent branding.

---

## 18. SDK EVENTS (v3.0 FULL REFERENCE)

### Tournament Events

| Bridge event | When |
|-------------|------|
| `tournamentRegistered` | Player registered successfully |
| `tournamentCheckedIn` | Player checked in |
| `tournamentCheckinOpen` | T-30: check-in window opened |
| `tournamentDQNoShow` | T-10: player DQ'd for no-show |
| `tournamentStarting` | T-0: tournament starting |

### QuickPlay Events

| Bridge event | When | Handled by |
|-------------|------|-----------|
| `quickPlaySearching` | Player joined esport queue | `useQuickPlayQueue` → status: searching |
| `quickPlayLobbyUpdate` | Any game created/joined/expired (social) | `useQuickPlayQueue` → updates availableGames board |
| `quickPlayNPCFilling` | NPC fill started | `useQuickPlayQueue` → status: filling |
| `quickPlayFound` | Match ready (human-filled) | `useQuickPlayQueue` → status: found |
| `quickPlayStarting` | Match ready (NPC-filled) | `useQuickPlayQueue` → status: found |
| `quickPlayLeft` | Player left queue | `useQuickPlayQueue` → status: idle |

All six events are subscribed automatically by `useQuickPlayQueue`. No manual
socket wiring needed in your screens.

`quickPlayLobbyUpdate` payload is `AvailableGame[]` — the full current board
of open social games for the player's gameId, broadcast to all connected clients
whenever any game is created, joined, or expires.

### Room Events

| Bridge event | When |
|-------------|------|
| `roomPlayerJoined` | Player entered room |
| `roomPlayerLeft` | Player left room |
| `roomPlayerReady` | Ready status changed |
| `roomCountdownStarted` | Game about to start |
| `roomLaunching` | Game launch |

Full event reference: See Section 26.5.

---

## 19. API ENDPOINT REFERENCE

All endpoints use `/api/v1/` prefix. See DESKILLZ_WEB_GAME_DEVELOPER_GUIDELINE.md
Section 14 for the complete table (50+ endpoints).

### Key endpoints for standalone games

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/auth/login` | Top-level tokens in response |
| POST | `/auth/register` | |
| GET | `/wallet/balances` | NOT `/wallet/total` (404) |
| GET | `/tournaments` | Filter: `gameId`, `maxEntryFee` |
| POST | `/tournaments/:id/register` | v3.0 Step 1 enrollment |
| POST | `/tournaments/:id/checkin` | v3.0 Step 2 enrollment |
| GET | `/tournaments/:id/my-status` | v3.0 Status + DQ countdown |
| GET | `/tournaments/my-registrations` | v3.0 All user registrations |
| GET | `/quick-play/games/:gameId` | v3.0 QuickPlay config |
| POST | `/private-rooms/social` | Social room creation |
| GET | `/host/dashboard` | Returns `esportsTierInfo`, `earnings` |
| GET | `/host/profile` | v3.2 Auto-creates host profile |
| GET | `/host/earnings` | v3.2 Earnings summary |
| GET | `/host/badges` | v3.2 Host badges |
| GET | `/host/rooms/active` | v3.2 Active rooms for host |
| GET | `/host/tier/esports` | v3.2 Esports tier info |
| GET | `/host/tier/social` | v3.2 Social tier info |
| GET | `/host/level` | v3.2 Host level 1-10 |
| POST | `/host/verify-age` | v3.2 Age verification (21+) |
| GET | `/host/age-verified` | v3.2 Check age status |
| POST | `/host/withdraw` | v3.2 Withdraw host earnings |
| POST | `/disputes` | File a dispute (5 open max per user) |
| GET | `/disputes/me` | List my disputes (optional `?status=OPEN`) |
| GET | `/disputes/:id` | Dispute details (own disputes only) |
| POST | `/disputes/:id/evidence` | Add evidence to open dispute |
| GET | `/leaderboard/global` | NOT `/leaderboard` bare (404) |
| GET | `/leaderboard/game/:gameId` | v3.2 Game leaderboard |
| GET | `/leaderboard/me` | v3.2 My global rank |
| GET | `/leaderboard/me/game/:gameId` | v3.2 My game rank |
| GET | `/users/:userId/stats` | NOT `/users/stats` (400) |
| GET | `/users/me` | v3.2 Current user profile |
| GET | `/wallet/transactions` | v3.2 Transaction history |

---

## 20. CLOUD BUILD REQUIREMENTS

### vite.config.ts

```typescript
import { swVersionPlugin } from './src/plugins/vite-plugin-sw-version';

export default defineConfig({
  base: './',           // CRITICAL: top-level, NOT inside build: {}
  plugins: [react(), swVersionPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
  },
})
```

### .env Pattern

```env
VITE_GAME_ID=YOUR_GAME_ID
VITE_GAME_API_KEY=YOUR_API_KEY
VITE_API_BASE_URL=https://newdeskillzgames-production.up.railway.app
VITE_SOCKET_URL=wss://newdeskillzgames-production.up.railway.app
VITE_ENV=production
VITE_ENABLE_DEBUG=false
VITE_APP_VERSION=1.0.0
```

Cloud Build replaces `YOUR_GAME_ID` and `YOUR_API_KEY` automatically.
Delete `.env.local` before running `npm run build` for Cloud Build submission.

### Asset Path Rules (CRITICAL for R2 + APK)

| Asset location | How to reference | Example |
|---------------|-----------------|---------|
| `public/` | `${import.meta.env.BASE_URL}path` | `${import.meta.env.BASE_URL}assets/audio/win.mp3` |
| `src/assets/` | `import x from './assets/file'` | `import logo from './assets/logo.png'` |

```typescript
// CORRECT for public/ assets
const icon = `${import.meta.env.BASE_URL}assets/sprites/fox.png`;

// WRONG -- breaks on R2 subdirectory
<img src="./assets/sprites/fox.png" />

// WRONG -- Vite cannot import from public/
import icon from '../assets/sprites/fox.png';
```

Never mix the two approaches. `base: './'` in vite.config.ts makes
`import.meta.env.BASE_URL` resolve to `'./'` at build time.

### ZIP Command (with deskillz-sw.js hash stamp)

```powershell
npm run build
Remove-Item .env.local -ErrorAction SilentlyContinue
$hash = "{0}-{1}" -f ([System.DateTimeOffset]::Now.ToUnixTimeSeconds().ToString("x")), (Get-Random -Maximum 99999999).ToString("x8")
(Get-Content .\dist\deskillz-sw.js -Raw) -replace '__BUILD_HASH__', $hash | Set-Content .\dist\deskillz-sw.js -Encoding UTF8 -NoNewline
Write-Host "[sw-version] Stamped deskillz-sw.js with build hash: $hash" -ForegroundColor Green
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

> IMPORTANT: The hash stamp is done manually because the Vite plugin cache can
> prevent the closeBundle hook from running updated code. The PowerShell stamp
> is reliable and produces the same result.

### Why deskillz-sw.js (not sw.js)?

Cloud Build Docker worker always runs `workbox generateSW` which creates `sw.js`.
By naming our service worker `deskillz-sw.js`, Workbox never touches it.
Both files exist on R2 but `index.html` registers `deskillz-sw.js` (ours).
The Workbox `sw.js` is ignored by the browser.

---

## 21. IMPLEMENTATION PHASES

### Phase 1: Foundation (Required)

- [ ] `main.tsx` — `DeskillzBridge.init()` before React render
- [ ] `main.tsx` — `(window as any).DeskillzBridge = { getInstance: () => instance }` after init
- [ ] `AuthScreen` — email login/register + session restore
- [ ] `App.tsx` — routing with `react-router-dom`
- [ ] Verify `bridge.isLive === true` after login
- [ ] Verify `window.DeskillzBridge.getInstance()` returns bridge in browser console

### Phase 2: Lobby (Required)

- [ ] `LobbyScreen` — tab shell
- [ ] `TournamentPage` — `TournamentCard` + `useEnrollmentStatus` per card
- [ ] Bridge fetches tournaments: `bridge.getTournaments({ gameId })`
- [ ] `QuickPlayPage` — drop in `QuickPlayCard` + `useQuickPlayQueue` (10 lines, see Section 9)
- [ ] Admin activates QuickPlay config for gameId in admin panel
- [ ] `ResultsScreen`

### Phase 3: Game (Required)

- [ ] `GameScreen` — your gameplay mounted as React component
- [ ] Score submission: `bridge.submitScore()`
- [ ] Return to lobby on game end

### Phase 4: Profile + Wallet (Required)

- [ ] `ProfileScreen` — `toNum()` on all `.toFixed()` calls
- [ ] `WalletScreen` — use `/wallet/balances` not `/wallet/total`

### Phase 5: Social (Social games only)

- [ ] `CreateRoomScreen`
- [ ] `RoomLobbyScreen`
- [ ] `HostDashboard` — safe defaults pattern
- [ ] `SocialGameManager` — rake, chips, bust detection

### Phase 6: Deployment

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx vite build` — succeeds
- [ ] ZIP `dist/` contents, `index.html` at root
- [ ] Cloud Build upload

---

## 22. TESTING CHECKLIST

### SDK Integration

- [ ] `bridge.isLive === true` after login (not guest mode)
- [ ] Network tab shows POST to `/api/v1/auth/login` (real API call)
- [ ] `bridge.getCurrentUser().isGuest === false`
- [ ] Wallet balance fetches from `/api/v1/wallet/balances`
- [ ] Tournament list loads via `bridge.getTournaments({ gameId })`

### Enrollment Flow

- [ ] "Register" calls `bridge.registerTournament()` → status: REGISTERED
- [ ] Check-in button pulses green at T-30 → status: CHECKIN_OPEN
- [ ] DQ countdown counts down in real time
- [ ] "Check In Now" → status: CHECKED_IN
- [ ] DQ toast fires if player misses check-in window

### QuickPlay

**Both game types:**
- [ ] QuickPlay config loads from bridge (admin must activate for gameId first)
- [ ] Card shows loading spinner until config loads, then renders correctly
- [ ] "Filling match..." shows during NPC fill — never "bot", "AI", or "NPC"
- [ ] `onMatchStart(matchData)` fires and game screen loads correctly
- [ ] ERROR state shows with "Try Again" on failure

**Esport games (Candy Duel, Bubble Battle):**
- [ ] Entry fee chips render from `esportEntryFeeTiers` config values
- [ ] Player mode chips render from `esportPlayerModes` (hidden if only 1 mode)
- [ ] Currency dropdown populates from `esportCurrencies`
- [ ] Prize preview calculates correctly: fee × players × (1 - rake%)
- [ ] "Play Now" → status: searching → animated progress bar → Cancel works
- [ ] After timeout: "Filling match..." → match found → onMatchStart fires

**Social games (Big 2, Mahjong, Thirteen Cards, Dou Dizhu):**
- [ ] Point value dropdown populates from `socialPointValueTiers`
- [ ] Currency dropdown populates from `socialCurrencies`
- [ ] Buy-in range preview calculates from selected point value × multipliers
- [ ] Available Games board shows empty state when no games exist
- [ ] "Create Game" creates a game → status: waiting → seat dots visible
- [ ] Created game appears on other players' Available Games boards
- [ ] Other player can tap JOIN → both players move to match start
- [ ] After NPC fill timeout: "Filling match..." → match found → onMatchStart fires

### Disputes (all games)

- [ ] DisputeModal opens from results screen with correct disputeType context badge
- [ ] 7 reason buttons render and are selectable
- [ ] Description textarea enforces 10 char min, 2000 char max
- [ ] Submit calls bridge.fileDispute() -- verify POST /api/v1/disputes in network tab
- [ ] Success state displays reference ID and 24-48hr review notice
- [ ] Error state shows error message and allows retry
- [ ] bridge.getMyDisputes() returns user's filed disputes
- [ ] bridge.addDisputeEvidence() adds evidence to open dispute
- [ ] Rate limit: 6th open dispute returns error
- [ ] Duplicate dispute on same match/tournament returns error

### Cloud Build

- [ ] `npx tsc --noEmit` = 0 errors
- [ ] `vite.config.ts` has `base: './'` at top level
- [ ] ZIP has `index.html` at root
- [ ] APK installs on Android
- [ ] PWA installs via Safari on iOS

### Host Dashboard (v3.2 -- social games)

- [ ] `/host` route renders HostDashboardPage
- [ ] Age verification gate works for unverified users
- [ ] Dashboard shows profile, tier, earnings after verification
- [ ] Active rooms list populates
- [ ] Create Room button navigates correctly
- [ ] Earnings refresh on 60-second interval

### Room Components (v3.2 -- social games)

- [ ] BuyInModal: opens on join, quick-select works, currency dropdown shows balances
- [ ] CashOutModal: shows P/L summary, blocked during active round
- [ ] RebuyModal: opens on bust, must choose rebuy or leave (not dismissible)
- [ ] LowBalanceWarning: toast at 20 pts, critical pulse at 10 pts
- [ ] TurnTimer: countdown with colour transitions (normal/warning/critical)
- [ ] PauseRequestModal: request, vote, status all render correctly
- [ ] SocialGameSettings: Cash Game mode — point value input ($0.01-$100), rake % (5-10%), rake cap, game end condition, max bid, spring bonus
- [ ] SocialGameSettings: Tournament mode — entry fee, prize split, tables, seats, tournament preview card
- [ ] SocialGameSettings: Mode toggle switches between Cash Game and Tournament correctly
- [ ] SocialGameSettings: lockedGameType hides game type dropdown in standalone apps
- [ ] SocialGameSettings: Mahjong shows wind round options (4/8/16) instead of point targets
- [ ] AgeVerificationModal: checkbox + verify flow + success animation

### Score Signing (v3.2 -- esport games)

- [ ] bridge.signScore() returns valid HMAC-SHA256 signature
- [ ] bridge.verifyScore() returns true for valid signatures

---

## 23. MIGRATION GUIDE: v2.x to v3.0

### What Changed

| Area | v2.x | v3.0 | v3.2 |
|------|------|------|------|
| Tournament join | `bridge.joinTournament()` | Register → CheckIn → Join | Unchanged |
| Tournament cards | Per-game custom | Shared `TournamentCard` | Unchanged |
| QuickPlay | Embedded in lobby tab | Dedicated page + `QuickPlayCard` | Social: board + create/join flow |
| QuickPlay social UI | None | Basic tier chips | Point value + currency dropdowns + live board |
| QuickPlay social flow | None | None | Create Game / JOIN existing game |
| Non-React games | `DeskillzUI.umd.js` overlay | Must migrate to React/Vite | Unchanged |
| SDK bundle | UMD + ES | ES module only | Unchanged |

### Migration Steps for React Games

1. Replace `DeskillzBridge.ts` with v3.1
2. Install `@deskillz/game-ui`
3. Copy `TournamentCard.tsx`, `QuickPlayCard.tsx`, hooks from package
4. Rewrite `TournamentListScreen` to use `TournamentCard` + `useEnrollmentStatus`
5. Add `QuickPlayPage.tsx` using `QuickPlayCard` + `useQuickPlayQueue`
6. Add `/quick-play` route in `App.tsx`
7. Remove all mock tournament data

---

## 24. EXISTING GAME INTEGRATION SCOPE

### 24.0 Architecture — READ FIRST

Three layers, same for every game:

```
Layer 1: DeskillzBridge.ts  (src/sdk/DeskillzBridge.ts)
  Replace with v3.2 — all API calls, enrollment, QuickPlay, auth, wallet,
  host dashboard, leaderboard, user profiles, score signing

Layer 2: @deskillz/game-ui  (npm package)
  Import shared components and hooks — TournamentCard, QuickPlayCard,
  8 room components, useEnrollmentStatus, useQuickPlayQueue, useHostDashboard

Layer 3: Room components  (src/components/rooms/)  [NEW in v3.2]
  8 shared display components for social game rooms
  Pure props-in/JSX-out — parent calls bridge, passes data as props
```

### 24.0.1 Files Every Game Must Update

**Core files (ALL games — esport and social):**

| File | Source | Action |
|------|--------|--------|
| `DeskillzBridge.ts` | `deskillz-web-sdk/src/DeskillzBridge.ts` | REPLACE with v3.2 |
| `TournamentCard.tsx` | `@deskillz/game-ui` (v3.1) | NEW or UPDATE |
| `QuickPlayCard.tsx` | `@deskillz/game-ui` (v3.2) | NEW or UPDATE |
| `useEnrollmentStatus.ts` | `@deskillz/game-ui` | NEW or UPDATE |
| `useQuickPlayQueue.ts` | `@deskillz/game-ui` (v3.2) | NEW or UPDATE |
| `Badge.tsx` | `@deskillz/game-ui` (v3.1) | UPDATE if present |
| `Button.tsx` | `@deskillz/game-ui` (v3.1) | UPDATE if present |
| `Card.tsx` | `@deskillz/game-ui` (v3.1) | UPDATE if present |

**Social game files (Big 2, Mahjong, Thirteen Cards, Dou Dizhu):**

| File | Source | Action |
|------|--------|--------|
| `useHostDashboard.ts` | `@deskillz/game-ui` (v3.2) | NEW |
| `BuyInModal.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `CashOutModal.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `RebuyModal.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `LowBalanceWarning.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `TurnTimer.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `PauseRequestModal.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `SocialGameSettings.tsx` | `@deskillz/game-ui` (v3.2) | NEW |
| `AgeVerificationModal.tsx` | `@deskillz/game-ui` (v3.2) | NEW |

> **v3.2 note:** Room components are pure display — they accept props and render UI.
> Your game screens call bridge methods (e.g., `bridge.roomBuyIn()`) and pass
> results as props. The components never call the bridge directly.

### 24.1 Scope Table

| Game | Engine | Status | Section |
|------|--------|--------|---------|
| Big 2 | React/Vite | Active — update to v3.1 components | 24.2 |
| Mahjong | React/Vite | Active — update to v3.1 components | 24.2 |
| Thirteen Cards | React/Vite | Active — update to v3.1 components | 24.2 |
| Dou Dizhu | PixiJS | Migrate to React/Vite shell | See migration guide |
| Bubble Battle | Canvas/TypeScript | Migrate to React/Vite shell | See migration guide |
| Candy Duel | Canvas/TypeScript | Migrate to React/Vite shell | See migration guide |

For Dou Dizhu, Bubble Battle, and Candy Duel migration instructions, see:
**DESKILLZ_NON_REACT_MIGRATION_GUIDE.md**

### 24.2 React/Vite Games (Big 2, Mahjong, Thirteen Cards)

#### Step 0 — Replace files

**A. DeskillzBridge.ts:**
```
FROM: deskillz-web-sdk/src/DeskillzBridge.ts
TO:   YOUR_GAME/src/sdk/DeskillzBridge.ts
```

**B. UI components (v3.1 fixed versions):**
```
FROM packages/game-ui/src/components/tournaments/TournamentCard.tsx
  -> YOUR_GAME/src/components/tournaments/TournamentCard.tsx

FROM packages/game-ui/src/components/tournaments/QuickPlayCard.tsx
  -> YOUR_GAME/src/components/tournaments/QuickPlayCard.tsx

FROM packages/game-ui/src/hooks/useEnrollmentStatus.ts
  -> YOUR_GAME/src/hooks/useEnrollmentStatus.ts

FROM packages/game-ui/src/hooks/useQuickPlayQueue.ts
  -> YOUR_GAME/src/hooks/useQuickPlayQueue.ts

FROM packages/game-ui/src/components/ui/Badge.tsx   -> YOUR_GAME/src/components/ui/
FROM packages/game-ui/src/components/ui/Button.tsx  -> YOUR_GAME/src/components/ui/
FROM packages/game-ui/src/components/ui/Card.tsx    -> YOUR_GAME/src/components/ui/
FROM packages/game-ui/src/utils.ts                  -> YOUR_GAME/src/utils.ts (or src/lib/utils.ts)
```

**C. Verify:**
```powershell
npx tsc --noEmit   # must return 0 errors
```

> Do NOT remove `public/sdk/DeskillzUI.js` yet if you already have it.
> It is simply ignored by React games — it causes no harm but is dead weight.
> You may delete it on your next ZIP build.

#### Step 1 — Rewrite TournamentListScreen

Remove `MOCK_TOURNAMENTS` and custom card JSX. Replace with:

```tsx
import TournamentCard from '../components/tournaments/TournamentCard'
import { useEnrollmentStatus } from '../hooks/useEnrollmentStatus'
import { DeskillzBridge } from '../sdk/DeskillzBridge'
import { useState, useEffect } from 'react'

function TournamentRow({ tournament, index }) {
  const { status, dqCountdown, loading, register, checkIn } =
    useEnrollmentStatus(tournament.id, {
      enabled: tournament.status !== 'COMPLETED' && tournament.status !== 'CANCELLED',
    })

  return (
    <TournamentCard
      tournament={tournament}
      userStatus={status}
      dqCountdown={dqCountdown}
      enrollmentLoading={loading}
      onRegister={() => register()}
      onCheckIn={() => checkIn()}
      appUrl={undefined}
    />
  )
}

export function TournamentListScreen() {
  const [tournaments, setTournaments] = useState([])
  const gameId = DeskillzBridge.getInstance().getConfig().gameId

  useEffect(() => {
    DeskillzBridge.getInstance()
      .getTournaments({ gameId })
      .then(setTournaments)
  }, [gameId])

  return (
    <div>
      {tournaments.map((t, i) => (
        <TournamentRow key={t.id} tournament={t} index={i} />
      ))}
    </div>
  )
}
```

#### Step 2 — Add QuickPlayPage

```tsx
// src/screens/QuickPlayPage.tsx
import { useNavigate } from 'react-router-dom'
import QuickPlayCard from '../components/tournaments/QuickPlayCard'
import { useQuickPlayQueue } from '../hooks/useQuickPlayQueue'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

export function QuickPlayPage() {
  const navigate = useNavigate()
  const gameId = DeskillzBridge.getInstance().getConfig().gameId
  const qp = useQuickPlayQueue(gameId)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <QuickPlayCard
        qp={qp}
        onMatchStart={(matchData) => {
          navigate('/game', { state: { matchData } })
        }}
      />
    </div>
  )
}
```

#### Step 3 — Add route in App.tsx

```tsx
<Route path="/quick-play" element={<QuickPlayPage />} />
```

#### Step 4 — Update Lobby quick-play tab

```tsx
// In LobbyScreen, QuickPlay tab click:
const handleQuickPlayTab = () => navigate('/quick-play')
```

#### Files changed per React game

| File | Action |
|------|--------|
| `src/sdk/DeskillzBridge.ts` | REPLACE with v3.1 |
| `src/components/tournaments/TournamentCard.tsx` | UPDATE to v3.1 fixed version |
| `src/components/tournaments/QuickPlayCard.tsx` | UPDATE to v3.1 fixed version |
| `src/hooks/useEnrollmentStatus.ts` | UPDATE |
| `src/hooks/useQuickPlayQueue.ts` | UPDATE |
| `src/components/ui/Badge.tsx` | UPDATE to v3.1 fixed version |
| `src/components/ui/Button.tsx` | UPDATE to v3.1 fixed version |
| `src/components/ui/Card.tsx` | UPDATE to v3.1 fixed version |
| `src/screens/TournamentListScreen.tsx` | REWRITE — remove mock data, use TournamentCard |
| `src/screens/QuickPlayPage.tsx` | NEW — QuickPlayCard + useQuickPlayQueue |
| `src/App.tsx` | ADD /quick-play route |

**Total: 8 files replaced/updated, 1 rewritten, 1 new, 1 route added.**
**Nothing built from scratch. Game logic untouched.**

#### Testing checklist for React games

- [ ] `npx tsc --noEmit` = 0 errors
- [ ] Tournament list loads from bridge (no MOCK_TOURNAMENTS)
- [ ] TournamentCard shows correct badge (cyan/purple/pink)
- [ ] "Register" → status: REGISTERED → button changes
- [ ] Check-in opens → button pulses green
- [ ] DQ countdown counts down in real time
- [ ] QuickPlay tab navigates to `/quick-play`
- [ ] QuickPlayCard tier selector shows bridge config values
- [ ] "Play Now" → searching → filling → `onMatchStart` fires

---

## 25. STANDARD ARCHITECTURE: REACT/VITE + CANVAS

### The Standard

All Deskillz standalone web games use React/Vite for the lobby UI and mount
their gameplay engine (Canvas, PixiJS, Three.js) inside a React component.

```
React/Vite shell (lobby, auth, tournament UI, enrollment)
  |
  +-- TournamentPage     (React — TournamentCard, useEnrollmentStatus)
  +-- QuickPlayPage      (React — QuickPlayCard, useQuickPlayQueue)
  +-- Profile/Wallet     (React)
  |
  v
GameScreen (React component that mounts your gameplay engine)
  |
  +-- useEffect: initialise canvas/PixiJS/Three.js on mount
  +-- bridge.submitScore() on game end
  +-- navigate('/results') on game end
```

The gameplay engine (PixiJS scene graph, canvas physics, card logic) does NOT
change. Only the lobby UI wraps it in React.

### New Game Template

```
new-game/
  src/
    main.tsx              <- DeskillzBridge.init() + ReactDOM.render()
    App.tsx               <- Routes: /auth /lobby /tournaments /quick-play /game /results
    screens/
      AuthScreen.tsx
      LobbyScreen.tsx     <- Tab shell
      TournamentPage.tsx  <- TournamentCard + useEnrollmentStatus
      QuickPlayPage.tsx   <- QuickPlayCard + useQuickPlayQueue
      GameScreen.tsx      <- YOUR gameplay (canvas, PixiJS, Three.js, etc.)
      ResultsScreen.tsx
      ProfileScreen.tsx
      WalletScreen.tsx
    components/
      tournaments/
        TournamentCard.tsx    <- From @deskillz/game-ui
        QuickPlayCard.tsx     <- From @deskillz/game-ui
      ui/
        Badge.tsx             <- From @deskillz/game-ui
        Button.tsx            <- From @deskillz/game-ui
        Card.tsx              <- From @deskillz/game-ui
    sdk/
      DeskillzBridge.ts       <- DO NOT MODIFY
    plugins/
      vite-plugin-sw-version.ts  <- Stamps build hash into deskillz-sw.js
    types/
      GameCapabilities.ts     <- Interface + DEFAULT_CAPABILITIES
  public/
    index.html                <- base: './' required, registers deskillz-sw.js
    manifest.json             <- start_url: './' required
    deskillz-sw.js            <- Universal SW template (NOT sw.js -- avoids Workbox overwrite)
  vite.config.ts              <- base: './' at top level + swVersionPlugin()
```

### GameScreen Pattern (Canvas/PixiJS inside React)

```tsx
// src/screens/GameScreen.tsx
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DeskillzBridge } from '../sdk/DeskillzBridge'
import { YourGameEngine } from '../game/YourGameEngine'

export default function GameScreen() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const engineRef  = useRef<YourGameEngine | null>(null)
  const navigate   = useNavigate()
  const { state }  = useLocation()
  const matchData  = state?.matchData

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize your gameplay engine into the canvas element
    engineRef.current = new YourGameEngine(canvasRef.current, {
      matchData,
      onGameEnd: async (score) => {
        // Submit score then navigate to results
        await DeskillzBridge.getInstance().submitScore({ score })
        navigate('/results', { state: { score } })
      },
    })

    return () => {
      // Clean up engine on unmount
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
```

### Benefits of React/Vite + Canvas

| Benefit | Detail |
|---------|--------|
| Zero-effort UI updates | npm update gets new TournamentCard states, enrollment flow changes, etc. |
| Unified codebase | Same component library as main deskillz.games website |
| TypeScript throughout | DeskillzBridge, hooks, components all fully typed |
| Cloud Build ready | Vite produces a clean `dist/` that Cloud Build wraps to APK/PWA/Windows |
| No overlay injection | No DeskillzUI.js to maintain, no script tag ordering to worry about |

---

## 26. WEB SDK COMPATIBILITY

### 26.1 DeskillzBridge v3.1

Drop `DeskillzBridge.ts` into every standalone game's `src/sdk/DeskillzBridge.ts`.
This file is the ONLY API layer. Never call tournament endpoints directly.

### 26.2 New Methods in v3.0 / v3.1

| Method | Endpoint | When to use |
|--------|----------|-------------|
| `bridge.registerTournament(id)` | POST /tournaments/:id/register | Step 1 enrollment |
| `bridge.checkInTournament(id)` | POST /tournaments/:id/checkin | Step 2 enrollment |
| `bridge.getEnrollmentStatus(id)` | GET /tournaments/:id/my-status | Status + DQ countdown |
| `bridge.getMyRegistrations()` | GET /tournaments/my-registrations | All user registrations |
| `bridge.getQuickPlayConfig(gameId)` | GET /quick-play/games/:gameId | QuickPlay config |

### 26.3 EsportMatchMode Field

Tournaments return `esportMatchMode` alongside `mode`. Use it for badge display:

| esportMatchMode | Badge | Color |
|----------------|-------|-------|
| `ASYNC` | Async | Purple |
| `SYNC` | Sync | Cyan |
| `BLITZ_1V1` | Blitz | Amber |
| `DUEL_1V1` | Duel | Green |

Social games always null — fall back to `mode` field.

### 26.4 Cloud Build Credential Injection

Use exact placeholder strings. Cloud Build replaces these at build time:

```typescript
gameId:  'YOUR_GAME_ID',    // replaced -> real UUID
gameKey: 'YOUR_API_KEY',    // replaced -> real API key
```

Fallback values in bridge init must also use these strings — not `'dev-key'`.

---

## 27. QUICKPLAYCARD v3.2 — VISUAL SPEC AND CONFIG REFERENCE

### 27.0 What the Card Is

`QuickPlayCard` is a shared, ready-to-use component from `@deskillz/game-ui`.
**Game developers drop it in — they do not build QuickPlay UI from scratch.**
The card reads `QuickPlayConfig` from the bridge and renders the correct UI
automatically. All options are config-driven.

### 27.1 Esport Card — Idle State

```
+----------------------------------------------------------+
|  [Z]  Quick Play                              [Esport]   |
|       Instant matchmaking · No scheduling                |
|  --------------------------------------------------------|
|                                                          |
|  Mode  (only shown if esportPlayerModes has > 1 entry)   |
|  [  1v1  ]  [FFA 4-Player]                               |
|   ^-- from esportPlayerModes config                      |
|                                                          |
|  Entry Fee  (chips — one per esportEntryFeeTiers entry)  |
|  [FREE] [$1] [$5] [$10] [$25]                            |
|   ^-- from esportEntryFeeTiers config                    |
|                                                          |
|  Currency  (dropdown — one option per esportCurrencies)  |
|  [ USDT (BSC)          v ]                               |
|   ^-- from esportCurrencies config                       |
|                                                          |
|  Win: +$9.00    10% rake    5min match                   |
|   ^-- calculated from selected fee, mode, platformFee    |
|                                                          |
|  [              Play Now  >              ]               |
|   Cyan gradient — joins matchmaking queue                |
+----------------------------------------------------------+
```

### 27.2 Social Card — Idle State

```
+----------------------------------------------------------+
|  [Z]  Quick Play                              [Social]   |
|       Join or create a game instantly                    |
|  --------------------------------------------------------|
|                                                          |
|  [Coins] Big 2  ·  4 players          (game type label) |
|                                                          |
|  Point Value (USD per point)                             |
|  [ $1/pt                  v ]                            |
|   ^-- dropdown from socialPointValueTiers config         |
|                                                          |
|  Currency                                                |
|  [ USDT (BSC)             v ]                            |
|   ^-- dropdown from socialCurrencies config              |
|                                                          |
|  Buy-in range      $50 – $100                            |
|  Rake              6% · cap $50                          |
|  Auto cash-out     Enabled                               |
|   ^-- all calculated from config multipliers             |
|                                                          |
|  Open Games                                              |
|  +--------------------------------------------+         |
|  | $1/pt  [##  ] 2/4  [Clock] 45s   USDT  JOIN|         |
|  | $5/pt  [#   ] 1/4  [Clock] 12s   USDT  JOIN|  ^      |
|  +--------------------------------------------+  |      |
|   ^-- live from quick-play:lobby-update socket   |      |
|       updates in real time                       |      |
|  "No open games — create one below"              |      |
|   ^-- empty state when board is empty            |      |
|                                                          |
|  [  +  Create $1/pt Game                       ]        |
|   Purple gradient — creates game, others can join        |
+----------------------------------------------------------+
```

### 27.3 Active States (all game types)

| State | Trigger | Shown to player |
|-------|---------|----------------|
| `searching` | Esport: joined queue | Progress bar, elapsed timer, players in queue, Cancel |
| `waiting` | Social: created a game | Seat fill dots, player count, elapsed timer, Cancel |
| `filling` | NPC fill started | "Filling match..." — NEVER say bot/AI/NPC |
| `found` | Match ready | "Match Found!" pulse animation → auto-navigates in 2.5s |
| `error` | API/socket error | Error message + "Try Again" |

### 27.4 Config → UI Mapping

| Config field | UI element | Game type |
|-------------|-----------|-----------|
| `esportEntryFeeTiers` | Entry fee chips | Esport |
| `esportPlayerModes` | Player mode chips (hidden if 1 mode) | Esport |
| `esportCurrencies` | Currency dropdown | Esport |
| `esportPlatformFee` | Platform fee % info row | Esport |
| `esportPrizeType` | Prize type label (WINNER_TAKES_ALL / TOP_HEAVY / EVEN_SPLIT) | Esport |
| `matchDurationSecs` | Match duration info | Esport |
| `socialPointValueTiers` | Point value dropdown | Social |
| `socialCurrencies` | Currency dropdown | Social |
| `socialMinBuyInMultiplier` | Buy-in min (calculated) | Social |
| `socialDefaultBuyInMultiplier` | Buy-in max (calculated) | Social |
| `socialRakePercent` | Rake % info | Social |
| `socialRakeCapUsd` | Rake cap info | Social |
| `socialAutoCashout` | Auto cash-out badge | Social |
| `socialGameType` | Game type label (e.g. "Big 2") | Social |
| `socialMinPlayers` | Player count label | Social |
| `matchmakingTimeoutSecs` | NPC fill trigger (internal) | Both |
| `npcFillEnabled` | Whether filling state can occur | Both |

### 27.5 Config Templates

**Esport:**
```json
{
  "gameCategory": "ESPORTS",
  "esportPlayerModes": [2, 4],
  "esportEntryFeeTiers": [0, 1, 5, 10, 25],
  "esportCurrencies": ["USDT_BSC", "BNB"],
  "esportPlatformFee": 10,
  "matchmakingTimeoutSecs": 60,
  "matchDurationSecs": 300,
  "npcFillEnabled": true
}
```

**Social:**
```json
{
  "gameCategory": "SOCIAL",
  "socialGameType": "BIG_TWO",
  "socialMinPlayers": 4,
  "socialMaxPlayers": 4,
  "socialPointValueTiers": [0.25, 0.50, 1.00, 5.00],
  "socialCurrencies": ["USDT_BSC", "USDT_TRON"],
  "socialRakePercent": 6,
  "socialRakeCapUsd": 50,
  "socialMinBuyInMultiplier": 50,
  "socialDefaultBuyInMultiplier": 100,
  "socialAutoCashout": true,
  "matchmakingTimeoutSecs": 70,
  "npcFillEnabled": false
}
```

### 27.6 NPC Fill Policy

The player-facing text during NPC fill is always "Filling match..." — never
"bot", "AI", "NPC", or "computer player". This applies to all game types and
all player-visible surfaces (UI text, toast messages, console logs visible
to players).

---

## 28. QUICKPLAYCONFIG CREATE ROOM DEFAULTS (v3.4.11)

Starting in SDK v3.4.11, the Create Room form defaults can be seeded from
the developer's `QuickPlayConfig` row instead of the old hardcoded SDK
constants. This section is the reference for the pattern.

### Signatures

```typescript
// Social games (Big 2, Mahjong, Thirteen Cards, Dou Dizhu)
import {
  createDefaultSocialGameConfig,
  type SocialQuickPlayDefaults,
  type SocialGameConfig,
} from '@deskillz/game-ui'

function createDefaultSocialGameConfig(
  minPlayersOverride?: number,
  gameTypeOverride?: SocialGameType,
  qpConfig?: SocialQuickPlayDefaults | null,  // NEW in v3.4.11
): SocialGameConfig
```

```typescript
// Esport games (Bubble Battle, Candy Duel, puzzles, arcade)
import {
  createDefaultEsportGameConfig,
  type EsportQuickPlayDefaults,
  type EsportGameConfig,
} from '@deskillz/game-ui'

function createDefaultEsportGameConfig(
  capabilitiesOverride?: GameCapabilities,
  qpConfig?: EsportQuickPlayDefaults | null,  // NEW in v3.4.11
): EsportGameConfig
```

### SocialQuickPlayDefaults shape

| Field                     | Purpose                                               |
|---------------------------|-------------------------------------------------------|
| socialPointValueTiers     | USD-per-point tiers; first is the default             |
| socialRakePercent         | Host rake per round (e.g. 5 = 5%)                     |
| socialRakeCapUsd          | Max rake charged per round in USD                     |
| socialTurnTimerSeconds    | Default turn timer in seconds                         |
| socialMinPlayers          | Minimum players per table                             |
| socialMaxPlayers          | Maximum players per table                             |

### EsportQuickPlayDefaults shape

| Field                  | Purpose                                                  |
|------------------------|----------------------------------------------------------|
| esportEntryFeeTiers    | USD entry fee tiers; first is the default                |
| esportCurrencies       | Accepted currencies; first is the default                |
| esportPlatformFee      | Platform fee percentage (e.g. 10 = 10%)                  |
| esportMinPlayers       | Minimum players for the tournament                       |
| esportMaxPlayers       | Maximum players for the tournament                       |

### Reference pattern -- CreateRoomScreen.tsx

```typescript
import { useState, useEffect } from 'react'
import {
  SocialGameSettings,
  createDefaultSocialGameConfig,
  type SocialGameConfig,
  type SocialQuickPlayDefaults,
  type QuickPlayConfig,
  DeskillzBridge,
} from '@deskillz/game-ui'

export default function CreateRoomScreen() {
  const gameId = DeskillzBridge.getInstance().getConfig().gameId

  // 1. Fetch QuickPlayConfig on mount (public endpoint, no auth required)
  const [qpConfig, setQpConfig] = useState<QuickPlayConfig | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/quick-play/games/${gameId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setQpConfig)
      .catch(() => setQpConfig(null))  // 404 is fine -- falls back to defaults
  }, [gameId])

  // 2. Seed form state; initial render uses hardcoded defaults (qpConfig null)
  const [socialConfig, setSocialConfig] = useState<SocialGameConfig>(
    () => createDefaultSocialGameConfig(undefined, undefined, null),
  )

  // 3. Re-seed once qpConfig lands
  useEffect(() => {
    if (!qpConfig) return
    const defaults: SocialQuickPlayDefaults = qpConfig  // structural compat
    setSocialConfig(createDefaultSocialGameConfig(undefined, undefined, defaults))
  }, [qpConfig])

  return (
    <SocialGameSettings
      config={socialConfig}
      onChange={setSocialConfig}
      capabilities={DEFAULT_CAPABILITIES}
    />
  )
}
```

### Testing checklist

- [ ] GET /api/v1/quick-play/games/:gameId fires on CreateRoomScreen mount
- [ ] If 200 OK: form fields reflect developer's QuickPlayConfig values
- [ ] If 404: form uses pre-v3.4.11 hardcoded defaults (no error shown)
- [ ] Host can still override any field; defaults are seeds not locks
- [ ] Reload Create Room -- fresh fetch, defaults restored
- [ ] Test both social and esport flows if your game supports both categories

### Pitfalls

- **Endpoint path** -- public path is `/api/v1/quick-play/games/:gameId`.
  Do NOT use `/api/v1/admin/quick-play/games/:gameId` which returns 401.
- **Three placeholders for social** -- first two optional args are
  `minPlayersOverride` and `gameTypeOverride`. Pass `undefined` for both
  when seeding from qpConfig only: `createDefaultSocialGameConfig(undefined, undefined, qpConfig)`.
- **Structural compatibility** -- `QuickPlayConfig` (full interface from
  `@deskillz/game-ui` or `deskillz-frontend/src/lib/api/quick-play.ts`) is
  a structural superset of both `SocialQuickPlayDefaults` and
  `EsportQuickPlayDefaults`. TypeScript accepts direct assignment without
  any cast.
- **Backward compatibility** -- if your game never adopts this pattern,
  v3.4.11 behaves identically to v3.4.10. The new qpConfig arg is optional.
- **gameId at mount** -- if `DeskillzBridge.getInstance().getConfig().gameId`
  is `undefined` during mount (bridge still initializing), wait for
  bridge init or use `import.meta.env.VITE_GAME_ID` directly.

---

## QUICK START PROMPT FOR NEW CHAT SESSIONS

Copy this at the start of any new session working on a standalone game:

```
I am building a Deskillz standalone game.

CONTEXT:
- Deskillz SDK v3.1 + @deskillz/game-ui v3.4.3 (self-sufficient architecture)
- Reference doc: DESKILLZ_STANDALONE_GAME_UI_BUILD_HANDOFF_v2.9.md
- Game type: [ESPORTS | SOCIAL]
- Social modes: [CASH_GAME | TOURNAMENT | BOTH] (social games only)
- Engine: Web React/Vite + [Canvas | PixiJS | React game logic]

RULES:
- All endpoints use /api/v1/ prefix
- Always ask "Are you ready?" before writing code
- Deliver one file at a time
- Run npx tsc --noEmit and npx vite build after every change
- Check existing files before writing new ones
- No mock data - live API only
- Use design tokens from Section 17 for all colors
- Import shared components from @deskillz/game-ui
- QuickPlayCard and TournamentCard are shared — drop in from SDK ZIP, do not rebuild

CURRENT TASK:
[Describe what you need to build]
```

---

*Document End -- Version 3.11*
*All standalone web games: React/Vite + DeskillzBridge.ts + @deskillz/game-ui v3.4.11*