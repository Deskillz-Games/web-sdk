# DESKILLZ WEB GAME DEVELOPER GUIDELINE

## Complete Integration Reference for HTML5/JavaScript Game Developers

**Version:** 5.10
**Date:** April 14, 2026
**SDK Version:** DeskillzBridge v3.4.7 + @deskillz/game-ui ES module v3.4.7
**Web Engine:** React/Vite only -- all standalone web games

**Changelog v5.9 (April 14, 2026):**
- QUICKPLAY: Dynamic category seeding -- QuickPlayConfig auto-created with
  correct Social vs Esport defaults from Game.gameCategory. Social defaults:
  4 players, point value tiers $0.25/$0.50/$1/$5, all 5 currencies, 100x/50x
  buy-in multipliers, 5% rake, $50 cap, 90s timeout, 20 min session.
  Esport defaults: 1v1, entry fee tiers $1/$5/$10/$25, 10% platform fee, 20s timeout.
- QUICKPLAY DTO: SocialGameTypeDto updated with DOU_DIZHU + OTHER enum values,
  socialGameTypeCustom String field for developer-defined custom game types
- ADMIN: QuickPlay admin panel now supports inline category toggle
  (Esport<->Social with auto-seeded defaults), social game type selector
  with OTHER custom name input, developer-configured awareness banner
- CREATEROOM: Main deskillz.games app CreateRoomModal is now category-aware --
  reads game.gameCategory from API, shows SocialGameSettings for social games
  and EsportGameSettings for esport games
- ESPORT: Fixed Custom button in ChipPlusFreeInput component -- clicking
  Custom now opens free input field for entry fee, duration, rounds, players
- LOBBY: GameWithLobbyStats.gameCategory field added to lobby API interface
- BACKEND: quick-play.service.ts refactored with buildSeedData() helper,
  gameSelectForSeed constant, formatConfig returns socialGameTypeCustom

**Changelog v5.8 (April 13, 2026):**
- DISPUTE ENHANCEMENT: DisputeModal rewritten with 4-layer match context:
  auto-attach (ResultsScreen props), recent matches selector (last 10 matches),
  localStorage last-match suggestion (7-day expiry), manual roomCode fallback
- NEW: DeskillzBridge.persistLastMatch() -- saves match context to localStorage
- NEW: DeskillzBridge.getLastMatch() -- reads last match from localStorage
- NEW: DeskillzBridge.getRecentMatchesForDispute() -- fetches last 10 matches
  formatted for dispute context selection
- DeskillzBridge: fileDispute() accepts optional roomCode parameter
- DisputeRecord type adds roomCode: string | null field
- Backend: CreateDisputeDto accepts roomCode (stored in metadata JSON)
- Backend: GET /matches/history/me response adds tournamentId + matchType
- Backend: dispute:status-changed + dispute:notification socket events emitted
  to dispute owner when admin changes status or sends notification
- FIX: getPublicRooms() path -> /private-rooms (was /private-rooms/public)
- FIX: getMatchHistory() path -> /matches/history/me (was /users/match-history)
- FIX: Admin sendDisputeNotification -> /admin/disputes/:id/notify
- FREE MODE: SocialGameSettings + EsportGameSettings show "Placement Ranking"
  with ordinal labels instead of prize % inputs when free mode active
- Admin: QuickPlayAdminTab has inline Edit/Save/Cancel for all config fields
- Updated Section 5 SDK Method Summary with 3 new dispute context methods
- Updated Section 14 API reference: roomCode in dispute endpoints, matchType
  in match history response

**Changelog v5.7 (April 13, 2026):**
- NEW: DisputeModal component -- dispute filing UI for results screens.
  7 reasons, 3 dispute types (TOURNAMENT, QUICK_PLAY, PRIVATE_ROOM),
  context badge with colour coding, description (10-2000 chars),
  submitting/success/error states, 24-48hr review notice, reference ID.
- NEW: DeskillzBridge.fileDispute() -- POST /api/v1/disputes
  (rate limited: 5 open per user, prevents duplicates on same event)
- NEW: DeskillzBridge.getMyDisputes(status?) -- GET /api/v1/disputes/me
- NEW: DeskillzBridge.getDisputeDetails(id) -- GET /api/v1/disputes/:id
- NEW: DeskillzBridge.addDisputeEvidence(id, evidence[]) -- POST /api/v1/disputes/:id/evidence
- NEW: DisputeRecord type (13 fields) added to DeskillzBridge
- Updated Section 5 SDK Method Summary with 4 dispute methods
- Updated Section 6 shared components: DisputeModal added to tournaments
- Updated Section 12 testing checklist: dispute tests added
- Updated Section 14 API endpoint reference: 4 dispute endpoints added

**Changelog v5.6 (April 12, 2026):**
- NEW: TournamentLobbyCard component -- post-check-in tournament lifecycle UI with
  8 states: LOADING, NOT_CHECKED_IN, WAITING_FOR_START, TABLE_ASSIGNED, MATCH_READY,
  PLAYING, BETWEEN_ROUNDS, ELIMINATED, CHAMPION. Seat dots fill in real-time.
  3-second countdown on MATCH_READY fires onMatchStart callback.
- NEW: useTournamentLobby hook -- polls GET /tournaments/:id/my-status and
  GET /tournaments/:id/schedule, subscribes to tournament:starting,
  room:table-assigned, room:table-closed socket events.
- NEW: DeskillzBridge.getTournamentSchedule(tournamentId) method --
  GET /api/v1/tournaments/:id/schedule returns bracket with rounds, tables, players
- NEW: 5 TypeScript types: TournamentSchedule, TournamentScheduleRound,
  TournamentScheduleTable, TournamentSchedulePlayer, TournamentPlayerStatus
- FREE ENTRY: TournamentCard shows green "Free" pill badge when entryFee=0
- FREE ENTRY: CreateTournamentModal Free/Paid chip toggle for esport + social.
  Currency greyed out when Free. No wallet required, no rake collected.
- FREE ENTRY: QuickPlayCard hides currency when FREE chip selected, shows
  "Free Entry -- No wallet required", "No rake", "For fun" labels
- FREE ENTRY: QuickPlaySettingsTab allows $0 entry fee tier for free QuickPlay
- FREE ENTRY: Backend auto-confirms free registrations, escrow skips $0 fees
- HOST DASHBOARD: HostProfile adds freeEventsHosted, freePlayersHosted,
  monthlyFreeEvents, monthlyFreePlayers. Prisma migration adds 4 new columns.
- HOST DASHBOARD: 3 community badges: COMMUNITY_CHAMPION, FREE_FOR_ALL, OPEN_DOORS
- HOST DASHBOARD: Free events now count toward rooms/players stats (was skipped)
- NPC FIX: QuickPlay entry fee escrow (deduct on join, refund on leave)
- NPC FIX: Tournament NPC fill uses tournament.escrowAddress (was empty string)
- QuickPlay future-proofing: SocialGameType enum includes DOU_DIZHU.
  SOCIAL_GAME_LABELS changed to Record<string,string> (extensible).
  fetchSocialGameTypes() fetches from GET /api/v1/games/social-types.
  getSocialGameLabel(value) for safe label lookup on any game type.
- QuickPlaySettingsTab: social game type selector dynamically fetched from backend
- QuickPlayAdminTab: config details use getSocialGameLabel()

**Changelog v5.5 (April 11, 2026):** SDK v3.4.3 -- GameCapabilities expanded with
supportsBlitz1v1, supportsDuel1v1, supportsSinglePlayerMode, supportsTurnBased. GameMode
type expanded to 6 values. EsportGameSettings future-proofed (ChipPlusFreeInput for duration/
rounds, platformFeePercent configurable, maxTournamentSize in bracket stepper). SocialGameSettings
adds DOU_DIZHU game type + ChipPlusFreeInput for timer/rake/point-target. QuickPlayCard shows
skeleton preview when no config exists. LobbyOverlay tournament tab has filters, stats, auto-refresh.
DeskillzBridge: roomRebuy, submitRound, triggerSettlement, 5 social QuickPlay methods.
EsportMatchMode updated to include SINGLE_PLAYER and TURN_BASED in documentation.

**Changelog v5.4:** PWA service worker renamed from sw.js to deskillz-sw.js to avoid
Cloud Build Docker worker Workbox generateSW overwrite. Updated Section 4 file structure,
Section 8 files to include, Section 9 build command with hash stamp, index.html template.
Added Section 24.12 PWA Cache-Bust pitfalls. Added maxTournamentSize to GameCapabilities.
Developer Portal Gameplay tab reorganized with tooltips and maxTournamentSize field.

**Changelog v5.3.3:** GameCapabilities feature wired end-to-end. SocialGameSettings v3.3.3
accepts capabilities prop. DeskillzBridge v3.3 getGameCapabilities() method. Updated file
structure with src/types/GameCapabilities.ts.

**Changelog v5.2:** Updated Section 23 to @deskillz/game-ui v3.4.3 — QuickPlayCard
and useQuickPlayQueue rebuilt for esport and social flows. Social QuickPlay now has
point value dropdown, currency dropdown, live Available Games board, Create Game +
JOIN flow, and 'waiting' state. Esport QuickPlay unchanged except currency is now
a dropdown. Added Section 24.11 QuickPlay v3.2 pitfalls. Updated Section 24.10
pitfall 53 (window.DeskillzBridge). Updated Section 6 shared components table.
**Architecture:** Self-Sufficient (Standalone Web Games)
**Database:** Shared Ecosystem (Single Backend)
**Output Formats:** Android APK, PWA (Progressive Web App), Windows .exe (Electron)
**Cloud Build:** Docker Worker with Android SDK, Wine, Electron Builder

**Changelog v5.0:** Major rewrite — condensed from 5,713 to ~2,600 lines. Removed all session
narrative (Sections 21-33). Added SDK v3.0 architecture (Section 21), Tournament Enrollment Flow
(Section 22), packages/game-ui UMD bundle (Section 23), and condensed Critical Lessons table
(Section 24). Updated Section 5 SDK architecture to Bridge-first pattern. Updated Section 6 to
use shared TournamentCard + QuickPlayCard components. Updated Section 14 API table with 5 new
enrollment endpoints and 5 new tournament socket events. EsportMatchMode enum documented.
DQ no-show policy (T-10, no refund) documented throughout.

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Should I Follow the Standalone Game UI Build Guide?](#2-should-i-follow-the-standalone-game-ui-build-guide)
3. [Web Game Architecture](#3-web-game-architecture)
4. [Required File Structure](#4-required-file-structure)
5. [Deskillz Web SDK Integration](#5-deskillz-web-sdk-integration)
6. [UI Components You MUST Build](#6-ui-components-you-must-build)
6A. [Social Game Integration](#6a-social-game-integration)
7. [UI Components You Can SKIP](#7-ui-components-you-can-skip)
8. [Files to Include vs Exclude](#8-files-to-include-vs-exclude)
9. [Cloud Build Service](#9-cloud-build-service)
9A. [Asset Generation for Cloud Build](#9a-asset-generation-for-cloud-build)
10. [Integration Patterns](#10-integration-patterns)
11. [Best Practices](#11-best-practices)
12. [Testing Checklist](#12-testing-checklist)
13. [Troubleshooting](#13-troubleshooting)
14. [Quick Reference](#14-quick-reference)
15. [Hosted Games Service](#15-hosted-games-service)
16. [Windows Desktop Build](#16-windows-desktop-build)
17. [Game Download Page](#17-game-download-page)
18. [Docker Worker Reference](#18-docker-worker-reference)
19. [Developer Portal - Game Submission Flow](#19-developer-portal---game-submission-flow)
20. [Critical Deployment Notes](#20-critical-deployment-notes)
21. [SDK v3.0 Architecture](#21-sdk-v30-architecture)
22. [Tournament Enrollment Flow](#22-tournament-enrollment-flow)
23. [packages/game-ui UMD Bundle](#23-packagesgame-ui-umd-bundle)
24. [Critical Lessons Reference](#24-critical-lessons-reference)

---

## 1. OVERVIEW

### What is a Deskillz Web Game?

A Deskillz Web Game is an HTML5/JavaScript-based game that:
- Runs in a browser or WebView (Android/iOS)
- Integrates with Deskillz backend for tournaments, wallet, and social features
- Gets wrapped into native mobile apps via Cloud Build service
- Shares the same user accounts and wallet as Unity/Unreal games

### Key Differences from Unity/Unreal

| Aspect | Unity/Unreal | Web Games |
|--------|--------------|-----------|
| SDK | Native Unity/Unreal SDK | Embedded `DeskillzBridge.ts` (bundled into project) |
| Language | C#/C++ | JavaScript/TypeScript |
| Build Output | APK/IPA directly | ZIP -> Cloud Build -> APK/PWA/Windows .exe |
| UI Framework | Unity UI/UMG | React/Vite (required) |
| Deep Links | Native handlers | JavaScript URL params |
| File Size Limit | 150MB APK | 500MB ZIP source |

### Two Game Types

| Type | Examples | Revenue | Key Difference |
|------|----------|---------|----------------|
| **Esport** | Pinball, Puzzle, Runner, Arcade | Tournament entry fees | Async or sync, individual scores |
| **Social** | Big 2, Mahjong, Chinese 13-Card Poker | Host rake per pot | Always sync, real-time, chip economy |

### Supported Game Frameworks

| Framework | Type | Notes |
|-----------|------|-------|
| **Phaser 3** | Game Engine | Most popular for 2D games |
| **PixiJS** | Rendering | Great for card/board games |
| **Three.js** | 3D Engine | WebGL-based 3D games |
| **Babylon.js** | 3D Engine | Full-featured 3D |
| **Construct 3 / GDevelop** | No-Code | Export to HTML5 |
| **Vanilla JS** | Native | Canvas API games |
| **React/Vue** | UI Framework | For game UI overlays |

---

## 2. SHOULD I FOLLOW THE STANDALONE GAME UI BUILD GUIDE?

### Short Answer: PARTIALLY

The **DESKILLZ_STANDALONE_GAME_UI_BUILD_HANDOFF_v2.md** is designed for all standalone games.
Web developers should use it for UI screen requirements and user flows, but implement in
JavaScript/TypeScript rather than C#/Blueprints.

| Section | Follow? | Notes |
|---------|---------|-------|
| UI Component List | YES | Same screens needed |
| Scene Structure | ADAPT | Use routes/pages instead of Unity scenes |
| Auth/Lobby Scripts | CONCEPT ONLY | Implement with DeskillzBridge methods |
| Styling Guidelines | YES | Colors, fonts, spacing apply |
| Implementation Phases | YES | Same logical order |
| Testing Checklist | YES | Same user flows to test |
| SDK v3.0 Sections 24.0-24.3 | YES | React game integration — migrate non-React games per DESKILLZ_NON_REACT_MIGRATION_GUIDE.md |

### Web-Specific Equivalents

| Standalone Guide | Web Game Equivalent |
|-----------------|---------------------|
| Unity Scene | HTML Page / Route |
| MonoBehaviour Script | JavaScript Module / Component |
| UnityEvent | DOM Event / SDK Event |
| Prefab | Reusable Component / Template |
| Canvas | HTML DOM / Canvas Element |

---

## 3. WEB GAME ARCHITECTURE

### How Web Games Connect to Deskillz

```
+---------------------+     +----------------------+     +-------------------+
|   YOUR WEB GAME     |     |  DESKILLZBRIDGE v3.1 |     |  DESKILLZ BACKEND |
| (React/Vite)        |     |                      |     |                   |
| - Game Logic        |---->| - Auth Service       |---->| - NestJS API      |
| - React Lobby UI    |     | - Wallet Service     |     | - PostgreSQL      |
| - Score Tracking    |     | - Socket Manager     |     | - Redis           |
+---------------------+     | - Tournament API     |     | - Socket.io       |
                             | - Enrollment Methods |     +-------------------+
                             | - QuickPlay Config   |
                             +----------------------+
                                      |
                             +----------------------+
                             |  @deskillz/game-ui   |
                             |  (ES module)         |
                             |  TournamentCard      |
                             |  QuickPlayCard       |
                             |  useEnrollmentStatus |
                             |  useQuickPlayQueue   |
                             +----------------------+
```

### Two Integration Models

#### Model A: Standalone Mode (Recommended - Self-Sufficient)

Your game includes ALL Deskillz UI screens:

```
User Opens Game -> Auth -> Lobby -> Tournament/QuickPlay -> Game -> Results
  (built-in)    (built-in) (built-in)    (built-in)       (yours) (built-in)
```

#### Model B: Lobby Mode (Existing Games / Minimal Integration)

Your game is launched FROM the Deskillz app via deep link:

```
Deskillz App -> Tournament -> Deep Link -> Your Game -> Score Submission -> Return
```

### SDK Architecture (v3.1 — React/Vite Only)

```
All standalone web games use React/Vite. The UMD bundle is retired.

src/sdk/                          <- TypeScript, compiled by Vite
  DeskillzBridge.ts               <- v3.1 - THE ONLY API LAYER. Never modify.
  YourGameBridge.ts               <- Game-specific extension (optional)

No public/sdk/ folder needed.
DeskillzUI.js has been retired. @deskillz/game-ui is imported as an ES module.
```

**Rule:** ALL API calls go through `DeskillzBridge`. Import UI components from
`@deskillz/game-ui`. Non-React game developers: see `DESKILLZ_NON_REACT_MIGRATION_GUIDE.md`.

---

## 4. REQUIRED FILE STRUCTURE

### ZIP Upload Requirements

```
game-source.zip
  index.html          <- REQUIRED: Entry point at ZIP root
  manifest.json       <- RECOMMENDED: PWA manifest
  deskillz-sw.js      <- REQUIRED: Service worker (NOT sw.js -- avoids Workbox overwrite)
  src/
    main.tsx          <- React entry point + DeskillzBridge.init()
    App.tsx           <- React router shell
    sdk/
      DeskillzBridge.ts   <- v3.1 embedded SDK
      YourGameBridge.ts   <- Game-specific extension (optional)
    screens/          <- React screens (Auth, Lobby, Game, Results, etc.)
    components/       <- Shared UI (TournamentCard, QuickPlayCard from @deskillz/game-ui)
    hooks/            <- useEnrollmentStatus, useQuickPlayQueue
  assets/
    images/
    audio/
    fonts/
    icons/
```

> **Note:** No `public/sdk/DeskillzUI.js` needed. All games are React/Vite.
> The UMD bundle has been retired.

### Critical Rules

| Rule | Requirement |
|------|-------------|
| `index.html` location | MUST be at ZIP root (not in subdirectory) |
| Relative paths | ALL asset paths must use `./` prefix (never `/`) |
| No node_modules | Bundle your code — exclude `node_modules/` |
| Max ZIP size | 500MB maximum |
| `vite.config.ts` | `base: './'` MUST be top-level (not inside `build:`) |

### index.html Template

> All paths MUST use `./` relative prefix. APK WebView 404s on absolute paths.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,
    maximum-scale=1.0, user-scalable=no, viewport-fit=cover">

  <!-- PWA Meta -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Your Game Name">
  <meta name="theme-color" content="#0A0A1A">

  <title>Your Game - Deskillz</title>
  <link rel="manifest" href="./manifest.json">
  <link rel="apple-touch-icon" href="./assets/icons/apple-touch-icon-180x180.png">

  <style>
    html, body, #root {
      margin: 0; padding: 0; width: 100%; height: 100%;
      overflow: hidden; background: #0A0A1A;
      -webkit-tap-highlight-color: transparent;
      -webkit-user-select: none; user-select: none;
    }
    @supports (padding: env(safe-area-inset-top)) {
      #root {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
    #loading-screen {
      position: fixed; inset: 0; display: flex; align-items: center;
      justify-content: center; flex-direction: column;
      background: #0A0A1A; z-index: 9999; transition: opacity 0.4s ease;
    }
    #loading-screen.hidden { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(0,217,255,0.12); border-top-color: #00D9FF;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading-screen">
    <div class="spinner"></div>
    <p style="color:rgba(160,160,176,0.7);font-size:14px;margin-top:16px;">Loading...</p>
  </div>
  <div id="root"></div>

  <!-- Non-React games: load DeskillzUI UMD bundle before main script -->
  <!-- <script src="./public/sdk/DeskillzUI.js"></script> -->

  <script type="module" src="./src/main.js"></script>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const scope = new URL('./', window.location.href).pathname;
        navigator.serviceWorker.register('./deskillz-sw.js', { scope })
          .then(reg => {
            console.log('[SW] Registered:', reg.scope);
            reg.addEventListener('updatefound', () => {
              const nw = reg.installing;
              if (nw) {
                nw.addEventListener('statechange', () => {
                  if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                    nw.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                });
              }
            });
          })
          .catch(err => console.warn('[SW] Failed:', err));
      });
    }
  </script>
</body>
</html>
```

---

## 5. DESKILLZ WEB SDK INTEGRATION

### CRITICAL: The @deskillz/web-sdk NPM Package Does NOT Exist

Do NOT add `@deskillz/web-sdk` to `package.json`. It is not published to npm.
Using dynamic `import('@deskillz/web-sdk')` silently fails, sets `sdk = null`,
and every bridge method falls back to guest/mock mode with no real API calls.

### Correct Approach: Embed DeskillzBridge.ts Directly

Copy `DeskillzBridge.ts` into `src/sdk/DeskillzBridge.ts`. This single file (2,104 lines)
contains the complete SDK: HTTP client, auth, wallet, rooms, tournaments, enrollment, realtime.

**Required files in `src/sdk/`:**

| File | Lines | Purpose |
|------|-------|---------|
| `DeskillzBridge.ts` | 2,104 | Complete SDK — HTTP, auth, wallet, rooms, tournaments, enrollment, socket |
| `YourGameBridge.ts` | ~200 | Game-specific extension (e.g., Big2Bridge, MahjongBridge) |

> **PROPAGATION RULE:** Any time `DeskillzBridge.ts` is updated (e.g., v3.0 upgrade),
> it MUST be dropped into EVERY standalone game's `src/sdk/DeskillzBridge.ts`.
> This file is never modified per-game — it is always replaced wholesale.

### Installation

```bash
npm install socket.io-client
```

### SDK Architecture (Bridge-First Pattern)

```
+--------------------------------------------------+
|  Your Game (App.tsx / main.ts)                    |
|    Uses: YourGameBridge (game-specific methods)   |
+--------------------------------------------------+
              |
+--------------------------------------------------+
|  DeskillzBridge v3.0 (Universal — 2,104 lines)   |
|    login(), register(), loginWithWallet()          |
|    getWalletBalance(), createRoom(),               |
|    createSocialRoom(), joinRoom(),                 |
|    submitScore(), connectRealtime()               |
|    registerTournament(), checkInTournament()       |   <- NEW v3.0
|    getEnrollmentStatus(), getMyRegistrations()     |   <- NEW v3.0
|    getQuickPlayConfig()                            |   <- NEW v3.0
|    Guest fallbacks when backend unreachable        |
+--------------------------------------------------+
              |
+--------------------------------------------------+
|  Deskillz Backend (NestJS + PostgreSQL)           |
|    https://newdeskillzgames-production.up.railway.app/api/v1/*
+--------------------------------------------------+
```

### Initialization

```typescript
// src/sdk/YourGameBridge.ts
import { DeskillzBridge } from './DeskillzBridge';

export class YourGameBridge extends DeskillzBridge {
  static getInstance(config?: BridgeConfig): YourGameBridge {
    // singleton pattern
  }
  // Add game-specific methods here
}

// App.tsx / main.ts
const bridge = YourGameBridge.getInstance({
  gameId:     import.meta.env.VITE_GAME_ID     || 'YOUR_GAME_ID',
  gameKey:    import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://newdeskillzgames-production.up.railway.app',
  socketUrl:  import.meta.env.VITE_SOCKET_URL   || 'wss://newdeskillzgames-production.up.railway.app',
  debug:      import.meta.env.VITE_ENABLE_DEBUG === 'true',
});

await bridge.initialize();
```

### Cloud Build Credential Injection

Cloud Build scans built JS/HTML and replaces these exact strings:

| Placeholder | Replaced With |
|-------------|--------------|
| `'YOUR_API_KEY'` | Real API key from Developer Portal |
| `'YOUR_GAME_ID'` | Real game UUID from Developer Portal |
| `{{API_KEY}}` | Real API key |
| `{{GAME_ID}}` | Real game UUID |
| `{{API_BASE_URL}}` | Production API URL |
| `{{SOCKET_URL}}` | Production WebSocket URL |

**Fallback values in bridge init MUST also use `'YOUR_API_KEY'`** — not `'dev-key'`
or any custom string. Custom strings will not be detected.

### Authentication Patterns

#### CRITICAL: Backend Auth Response Format

Tokens are at the TOP LEVEL, NOT nested under `tokens`:

```json
{
  "accessToken": "eyJhb...",
  "refreshToken": "eyJhb...",
  "user": { "id": "uuid", "username": "testplayer1", "isGuest": false }
}
```

Parse with fallback for both shapes:

```typescript
const accessToken  = result.tokens?.accessToken  ?? result.accessToken;
const refreshToken = result.tokens?.refreshToken ?? result.refreshToken;
```

#### Email Login / Register

```typescript
await bridge.login(email, password);                    // POST /api/v1/auth/login
await bridge.register(username, email, password);       // POST /api/v1/auth/register
// CRITICAL: call bridge.register() for registration, NOT bridge.login()
```

#### Wallet Connect (SIWE)

```typescript
const ethereum = (window as any).ethereum;
if (!ethereum) throw new Error('No wallet detected');
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const address = accounts[0];
const chainId = parseInt(await ethereum.request({ method: 'eth_chainId' }), 16);
const signMessage = (msg: string) =>
  ethereum.request({ method: 'personal_sign', params: [msg, address] });

await bridge.loginWithWallet(address, chainId, signMessage);
// SIWE domain must match deskillz.games exactly
```

### Verifying Live Mode (Not Guest)

```typescript
// In browser console after login:
console.log('Mode:',  bridge.isLive ? 'LIVE' : 'OFFLINE');
console.log('User:',  bridge.getCurrentUser());
// GOOD: { id: 'clx...abc', username: 'Player1', isGuest: false }
// BAD:  { id: 'guest_12345...', isGuest: true }
// Network tab should show POST .../api/v1/auth/login
```

### SDK Method Summary

```typescript
const bridge = YourGameBridge.getInstance();

// Auth
bridge.login(email, password)
bridge.register(username, email, password)
bridge.loginWithWallet(address, chainId, signFn)
bridge.logout()

// Wallet
bridge.getWalletBalance()             // GET /api/v1/wallet/balances
bridge.deposit(currency, amount)
bridge.withdraw(currency, amount)

// User
bridge.getProfile()                   // GET /api/v1/users/me
bridge.getPlayerStats()               // GET /api/v1/users/:userId/stats  (UUID required)
bridge.getMatchHistory()

// Private Rooms
bridge.createRoom(opts)               // POST /api/v1/private-rooms          (esport)
bridge.createSocialRoom(opts)         // POST /api/v1/private-rooms/social   (social)
bridge.joinRoom(code)
bridge.leaveRoom()
bridge.roomBuyIn(amount, currency)
bridge.roomCashOut()

// Tournaments (legacy join)
bridge.submitScore(payload)

// Tournament Enrollment (v3.0 - NEW)
bridge.registerTournament(id)         // POST /api/v1/tournaments/:id/register
bridge.checkInTournament(id)          // POST /api/v1/tournaments/:id/checkin
bridge.getEnrollmentStatus(id)        // GET  /api/v1/tournaments/:id/my-status
bridge.getMyRegistrations()           // GET  /api/v1/tournaments/my-registrations

// QuickPlay (v3.0 - NEW)
bridge.getQuickPlayConfig(gameId)     // GET  /api/v1/quick-play/games/:gameId

// Leaderboard & Rooms
bridge.getLeaderboard(limit)          // GET /api/v1/leaderboard/global
bridge.getPublicRooms()               // GET /api/v1/private-rooms/public

// Host Dashboard (v3.2 -- NEW)
bridge.getHostDashboard()             // GET /api/v1/host/dashboard (aggregate)
bridge.getHostProfile()               // GET /api/v1/host/profile
bridge.getHostEarnings()              // GET /api/v1/host/earnings
bridge.getHostBadges()                // GET /api/v1/host/badges
bridge.getActiveRooms()               // GET /api/v1/host/rooms/active
bridge.getEsportsTier()               // GET /api/v1/host/tier/esports
bridge.getSocialTier()                // GET /api/v1/host/tier/social
bridge.getLevelInfo()                  // GET /api/v1/host/level
bridge.verifyAge()                    // POST /api/v1/host/verify-age
bridge.checkAgeVerified()             // GET /api/v1/host/age-verified
bridge.requestHostWithdrawal(params)  // POST /api/v1/host/withdraw

// Leaderboard -- Extended (v3.2 -- NEW)
bridge.getGameLeaderboard(gameId)     // GET /api/v1/leaderboard/game/:gameId
bridge.getMyRank()                    // GET /api/v1/leaderboard/me
bridge.getMyGameRank(gameId)          // GET /api/v1/leaderboard/me/game/:gameId
bridge.getUserRank(userId)            // GET /api/v1/leaderboard/user/:userId
bridge.getGameStats(gameId)           // GET /api/v1/leaderboard/game/:gameId/stats
bridge.getPlatformStats()             // GET /api/v1/leaderboard/platform/stats

// User/Profile -- Extended (v3.2 -- NEW)
bridge.getMyProfile()                 // GET /api/v1/users/me (alias)
bridge.getUserStats(userId)           // GET /api/v1/users/:userId/stats
bridge.getTransactions(filters)       // GET /api/v1/wallet/transactions

// Score Signing (v3.2 -- NEW, client-side HMAC-SHA256)
bridge.signScore(payload)             // Uses config.gameKey as HMAC secret
bridge.verifyScore(signedScore)       // Client-side signature verification

// Room Management (v3.2 -- NEW)
bridge.startRoom(roomId)              // POST /api/v1/private-rooms/:roomId/start



// Dispute Context (v3.4.6 -- NEW)
bridge.persistLastMatch(data)         // Saves match context to localStorage
bridge.getLastMatch()                 // Reads last match from localStorage (7-day expiry)
bridge.getRecentMatchesForDispute()   // GET /api/v1/matches/history/me (last 10, formatted)
// Disputes (v3.4.5 -- NEW)
bridge.fileDispute(params)            // POST /api/v1/disputes (5 open max, accepts roomCode)
bridge.getMyDisputes(status?)         // GET  /api/v1/disputes/me
bridge.getDisputeDetails(disputeId)   // GET  /api/v1/disputes/:id (own disputes only)
bridge.addDisputeEvidence(id, arr)    // POST /api/v1/disputes/:id/evidence

// Realtime
bridge.onRealtimeEvent(event, handler)
bridge.sendRealtimeMessage(event, data)
```

---

## 6. UI COMPONENTS YOU MUST BUILD

### Required Screens

| Screen | Priority | Esport | Social | Purpose |
|--------|----------|--------|--------|---------|
| **Auth Screen** | P0 | YES | YES | Login, Register, Wallet Connect |
| **Lobby Screen** | P0 | YES | YES | Navigation hub, QuickPlay, Tournaments |
| **Tournament List** | P0 | YES | YES | Browse + enroll via TournamentCard |
| **Match Lobby** | P0 | YES | YES | Waiting room, ready button |
| **Profile Screen** | P1 | YES | YES | Stats, settings, history |
| **Wallet Screen** | P1 | YES | YES | Balance, deposit, withdraw |
| **Results Screen** | P0 | YES | YES | Score, prize, standings |
| **Private Room - Create** | P2 | Optional | YES | CreateRoomScreen + SocialGameSettings |
| **Private Room - Lobby** | P2 | Optional | YES | RoomLobbyScreen + room components |
| **Host Dashboard** | P1 | No | YES | Focused operational view + deep link to deskillz.games/host |
| **Room - Buy-In** | P1 | No | YES | BuyInModal (shared, v3.2) |
| **Room - Cash-Out** | P1 | No | YES | CashOutModal (shared, v3.2) |
| **Room - Rebuy** | P1 | No | YES | RebuyModal (shared, v3.2) |
| **Room - Turn Timer** | P1 | No | YES | TurnTimer (shared, v3.2) |
| **Room - Low Balance** | P2 | No | YES | LowBalanceWarning (shared, v3.2) |
| **Room - Pause** | P2 | No | YES | PauseRequestModal (shared, v3.2) |
| **Room - Settings** | P1 | No | YES | SocialGameSettings (shared, v3.2) |
| **Age Verification** | P1 | No | YES | AgeVerificationModal (shared, v3.2) |
| **Round Summary Overlay** | P1 | No | YES | Between-round scores |
| **How to Play** | P2 | YES | YES | Rules, tutorial |

### Shared Components (DO NOT BUILD FROM SCRATCH)

> **v3.4.5:** DisputeModal.tsx added to tournaments/ -- wire into results screens.

> **SDK v3.2:** Developers NEVER build tournament cards, QuickPlay cards, or room UIs.
> Import them from `@deskillz/game-ui`. All games are React/Vite.

**Tournament + QuickPlay (all games):**

| Component | Import | Purpose |
|-----------|--------|---------|
| `TournamentCard` | `@deskillz/game-ui` | All 3 tournament types (esport, social, cash game) |
| `TournamentLobbyCard` | `@deskillz/game-ui` | Post-check-in tournament lifecycle (v3.4.4) |
| `QuickPlayCard` | `@deskillz/game-ui` | Esport queue + Social board UI (v3.2) |
| `useEnrollmentStatus` | `@deskillz/game-ui` | Register/CheckIn/DQ state machine |
| `useQuickPlayQueue` | `@deskillz/game-ui` | QuickPlay state machine + board (v3.2) |
| `useTournamentLobby` | `@deskillz/game-ui` | Tournament lobby state machine (v3.4.4) |
| `AvailableGame` (type) | `@deskillz/game-ui` | Social games board entry |

**Room Components (social games -- v3.2 NEW):**

| Component | Import | Purpose |
|-----------|--------|---------|
| `BuyInModal` | `@deskillz/game-ui` | Buy-in with quick-select chips + currency picker |
| `CashOutModal` | `@deskillz/game-ui` | Cash-out with session P/L summary |
| `RebuyModal` | `@deskillz/game-ui` | Bust recovery -- must rebuy or leave |
| `LowBalanceWarning` | `@deskillz/game-ui` | Floating toast + inline variant at 20 pts |
| `TurnTimer` | `@deskillz/game-ui` | Circular SVG + compact pill + fullscreen overlay |
| `PauseRequestModal` | `@deskillz/game-ui` | Request break + vote + status sub-modals |
| `SocialGameSettings` | `@deskillz/game-ui` | Room config: game type, point value, rake, timer |
| `AgeVerificationModal` | `@deskillz/game-ui` | 21+ age gate for hosting |

**Host Dashboard (social games -- v3.2 NEW):**

| Component | Import | Purpose |
|-----------|--------|---------|
| `useHostDashboard` | `@deskillz/game-ui` | Host dashboard state machine (profile, tiers, earnings) |
| `getTierDisplay` | `@deskillz/game-ui` | Tier name, icon, CSS classes |

> **Standalone Design Principle:** The standalone host dashboard is a focused
> operational view (tier, earnings, active rooms, create room, withdraw). For the
> full dashboard with badges, level progression, tier comparisons, and settings,
> deep link to `https://deskillz.games/host`. Same wallet auth means the user
> lands directly on their full dashboard. See React Game Update Guide v1.3 Step 8.

> **Player Profile:** Same principle applies. Show username, wallet balance, and
> game-specific win/loss in the standalone app. Deep link to
> `https://deskillz.games/profile` for full profile with cross-game stats,
> achievements, transaction history, and account settings.
> The profile is synced via the shared database -- any changes from the standalone
> app are immediately visible on the main app and vice versa.

```tsx
// Tournament + QuickPlay (all games)
import { TournamentCard, QuickPlayCard, useEnrollmentStatus, useQuickPlayQueue }
  from '@deskillz/game-ui'

// Room Components (social games)
import { BuyInModal, CashOutModal, RebuyModal, LowBalanceWarning, TurnTimer,
  PauseRequestModal, SocialGameSettings, AgeVerificationModal } from '@deskillz/game-ui'

// Host Dashboard (social games)
import { useHostDashboard, getTierDisplay } from '@deskillz/game-ui'

// Design tokens (import once in App.tsx)
import '@deskillz/game-ui/dist/DeskillzUI.css'
```

> **Non-React games (Dou Dizhu, Bubble Battle, Candy Duel):** Migrate to React/Vite.
> See `DESKILLZ_NON_REACT_MIGRATION_GUIDE.md` v1.4. The UMD bundle is retired.

### TournamentListScreen Update Requirement

Standalone game `TournamentListScreen.tsx` files MUST be updated to:

1. Use shared `TournamentCard` component (from Package A)
2. Use `useEnrollmentStatus` per card instance
3. Fetch via `bridge.getTournaments({ gameId })` — NOT custom API calls
4. Add QuickPlay section using `QuickPlayCard` + `useQuickPlayQueue`

Private Room and Host Dashboard screens are NOT affected by these changes.

### Lobby Tab Structure

```
Lobby Tabs:
  [Tournaments]    <- TournamentCard list with enrollment state
  [Quick Play]     <- QuickPlayCard with queue state
  [Private Rooms]  <- CreateRoomScreen / RoomLobbyScreen (SEPARATE, unchanged)
  [Host Dashboard] <- Host earnings/tier (SEPARATE, unchanged)
```

### Guest Guards (Required)

All competitive sections MUST be guarded. Guests can only access free practice.

```typescript
// Guard competitive sections (blur + login CTA)
<GuestGuard isGuest={!state.isAuthenticated} onLoginRequired={() => navigateTo('auth')}
  message="Log in to access competitive matches">
  <QuickPlaySection />
  <AvailableGamesBoard />
</GuestGuard>

// Practice vs AI -- NOT guarded (encourages signup)
<PracticeSection />

// Guard tournaments + rooms
<GuestGuard isGuest={!state.isAuthenticated} onLoginRequired={() => navigateTo('auth')}
  message="Log in to join tournaments and rooms">
  <TournamentsSection />
  <RoomsSection />
</GuestGuard>
```

---

## 6A. SOCIAL GAME INTEGRATION

> Applies to Big 2, Mahjong, Chinese 13 Card Poker. Esport games skip this section.

### What Makes Social Games Different

| Aspect | Esport Games | Social Games |
|--------|-------------|-------------|
| Revenue | Tournament entry fee | Host rake per pot |
| Scoring | Individual score, HMAC-signed | Round-based chip payments |
| Multiplayer | Async or sync | Always real-time synchronous |
| Currency | Entry fee deducted before match | Chips (bought with crypto via pointValue) |
| Extra screens | None | HostDashboard, BuyInModal, BalanceHUD, RoundSummary |
| Extra SDK | Bridge only | Bridge + SocialGameManager |

### Required Social Game Files

| File | Purpose |
|------|---------|
| `sdk/SocialGameManager.ts` | Rake calculation, chip tracking, bust/rebuy events |
| `screens/CreateRoomScreen.tsx` | Room config (point value, rake, buy-in limits, currency) |
| `social/BuyInModal.tsx` | Buy-in/rebuy with wallet balance, chip conversion preview |
| `social/BalanceHUD.tsx` | Live chip count overlay during gameplay |

### SocialGameManager Integration

```typescript
import { SocialGameManager } from './sdk/SocialGameManager';

// 1. Initialize AFTER successful buy-in (not on room join)
const mgr = new SocialGameManager(bridge);
mgr.initialize(roomId, hostId, 0.10, 5, 25);  // pointValue, rakePercent, rakeCap
mgr.addPlayer(playerId, username, 500);         // 500 starting chips

// 2. Listen for events
mgr.on((type, data) => {
  if (type === 'bustWarning')    showBuyInModal();
  if (type === 'balanceUpdated') updateChipHUD(data.chips);
  if (type === 'buyInSuccess')   updateChipHUD(data.newBalance);
});

// 3. After each hand ends
const settlement = mgr.buildSettlement(
  winnerId, winnerName, isDraw, totalFan, handName, isSelfDraw, dealerId, allPlayerIds
);
mgr.processRoundResult(settlement);

// 4. End session
const totalRake = mgr.getTotalRake();
mgr.endSession();
```

### Score Application Pattern (CRITICAL)

Apply payments to player totals BEFORE emitting round result:

```typescript
// WRONG - engine calculates but never applies
onRoundEnd({ winnerId: 'p1', playerScores: [] });

// CORRECT - apply payments, then emit
for (const p of scoreResult.payments) {
  players[p.to].totalScore   += p.amount;
  players[p.from].totalScore -= p.amount;
}
onRoundEnd({
  winnerId: 'p1',
  playerScores: players.map(p => ({
    id: p.id, seatIndex: p.seatIndex,
    scoreChange: scoreChanges[p.seatIndex] || 0,
    newTotal: p.totalScore,
  })),
});
```

### Host Dashboard API Response Structure

`GET /api/v1/host/dashboard` returns this EXACT structure — always use safe defaults:

```typescript
const t = (data.esportsTierInfo ?? data.socialTierInfo ?? {}) as any;
const e = (data.earnings ?? {}) as any;

const dashboard = {
  tier:             t.tier            ?? 'BRONZE',
  revenueShare:     t.revenueSharePercent ?? 12,
  totalEarnings:    Number(e.total    ?? 0),
  monthlyEarnings:  Number(e.monthly  ?? 0),
  pendingSettlement:Number(e.pending  ?? 0),
  activeRooms:      data.activeRooms  ?? [],
  recentSettlements:data.recentSettlements ?? [],
};
```

> Do NOT access `data.tierInfo` — it does not exist. Use `esportsTierInfo` or `socialTierInfo`.
> Do NOT access `data.profile.totalEarnings` — earnings are in `data.earnings.total`.

### Currency Chain Selector

The Prisma `CryptoCurrency` enum has 5 values. UI must show chain sub-selector for USDT/USDC:

| UI Selection | Backend Enum Value |
|-------------|-------------------|
| USDT > BSC | `USDT_BSC` |
| USDT > Tron | `USDT_TRON` |
| USDC > BSC | `USDC_BSC` |
| USDC > Tron | `USDC_TRON` |
| BNB | `BNB` |

Never send plain `'USDT'` or `'USDC'` — backend validation rejects it.

---

## 7. UI COMPONENTS YOU CAN SKIP

### Lobby Mode (Game Launched from Deskillz App)

| Component | Can Skip? | Notes |
|-----------|-----------|-------|
| Auth Screen | YES | User already logged in |
| Lobby Screen | YES | Handled by main app |
| Tournament List | YES | Handled by main app |
| Profile Screen | YES | Handled by main app |
| Wallet Screen | YES | Handled by main app |
| Match Lobby | PARTIAL | May need mini-version |
| Results Screen | PARTIAL | Show in-game, then return |

### Lobby Mode Minimum

```javascript
// 1. Parse deep link params
const params = new URLSearchParams(window.location.search);
const matchData = {
  matchId: params.get('matchId'),
  tournamentId: params.get('tournamentId'),
  token: params.get('token'),
};

// 2. Initialize bridge with pre-auth token
const bridge = DeskillzBridge.getInstance({
  gameId: 'YOUR_GAME_ID',
  gameKey: 'YOUR_API_KEY',
  token: matchData.token,
});

// 3. Submit score when game ends
await bridge.submitScore({
  tournamentId: matchData.tournamentId,
  score: finalScore,
  timestamp: Date.now(),
});

// 4. Return to app
window.location.href = `deskillz://results?matchId=${matchData.matchId}`;
```

---

## 8. FILES TO INCLUDE VS EXCLUDE

### INCLUDE in ZIP

| File/Folder | Required | Notes |
|-------------|----------|-------|
| `index.html` | YES | Entry point at root |
| `manifest.json` | Recommended | PWA manifest with relative paths |
| `deskillz-sw.js` | YES | Service worker (NOT sw.js -- avoids Workbox overwrite) |
| `src/**/*.js` | YES | Bundled game code (Vite output) |
| `assets/` | YES | Images, audio, fonts |
| `assets/icons/` | Recommended | PWA icons (192, 512) |

> `public/sdk/DeskillzUI.js` is retired — do NOT include it in new builds.

### EXCLUDE from ZIP

| File/Folder | Why |
|-------------|-----|
| `node_modules/` | Too large — bundle instead |
| `src/**/*.ts` | TypeScript source — include compiled JS |
| `*.map` | Source maps — security risk + size |
| `.env`, `.env.local` | Sensitive config |
| `.git/` | Version control |
| `package.json`, `tsconfig.json` | Build config |

### Asset Optimization

| Type | Format | Max Size | Notes |
|------|--------|----------|-------|
| Images | PNG, WebP | 1MB each | TinyPNG, Squoosh |
| Audio | MP3, OGG | 2MB each | 128kbps stereo |
| Fonts | WOFF2 | 200KB each | Subset unused glyphs |
| Sprites | Atlas PNG | 2048x2048 | TexturePacker |

### Asset Path Rules (CRITICAL for R2 + APK)

Games are hosted on Cloudflare R2 subdirectories and wrapped in APK WebViews.
Both break if asset paths are wrong. Follow these rules exactly:

**Files in `public/` -- use `import.meta.env.BASE_URL`:**

Assets in the `public/` folder are NOT processed by Vite. They are copied
as-is to the build output. You cannot `import` them and bare `./` strings
in JSX may break depending on where the game is hosted.

```typescript
// CORRECT -- works on Vercel, R2 subdirectory, APK WebView
const icon = `${import.meta.env.BASE_URL}assets/sprites/fox.png`;
<img src={icon} />

// WRONG -- breaks on R2 subdirectory hosting
<img src="./assets/sprites/fox.png" />

// WRONG -- Vite cannot import files from public/
import icon from '../assets/sprites/fox.png';
```

Why it works: `base: './'` in `vite.config.ts` sets `import.meta.env.BASE_URL`
to `'./'` at build time. The resulting path is always relative to wherever
the game is hosted.

**Files in `src/assets/` -- use normal `import`:**

Assets inside `src/` ARE processed by Vite (hashed, optimized, bundled).
Normal imports work correctly because Vite rewrites the path at build time.

```typescript
// CORRECT for src/ assets only
import logo from './assets/logo.png';
<img src={logo} />
```

**The simple rule:**

| Asset location | How to reference | Example |
|---------------|-----------------|---------|
| `public/` | `${import.meta.env.BASE_URL}path/to/file` | `${import.meta.env.BASE_URL}assets/audio/win.mp3` |
| `src/assets/` | `import x from './assets/file'` | `import logo from './assets/logo.png'` |

Never mix the two approaches. If you move a file from `public/` to `src/assets/`
(or vice versa), update every reference.

---

## 9. CLOUD BUILD SERVICE

### How It Works

```
1. Upload ZIP via Developer Portal (NewGamePage)
2. Cloud Build validates (index.html at root)
3. Platform selected: ANDROID, PWA, WINDOWS, BOTH, ALL
4. Docker worker builds:
   - ANDROID: Capacitor -> Gradle -> Signed APK (3-5 min)
   - PWA: Manifest + Service Worker bundle (1-2 min)
   - WINDOWS: Electron -> electron-builder -> Portable .exe (5-8 min)
5. Artifact uploaded to Cloudflare R2
6. Hosted at deskillz.games/[slug]
```

### Build Platform Options

| Platform | Output | Build Time |
|----------|--------|------------|
| ANDROID | Signed .apk (~15-50MB) | 3-5 min |
| PWA | .zip bundle (~5-20MB) | 1-2 min |
| WINDOWS | Portable .exe (~60-120MB) | 5-8 min |
| BOTH | APK + PWA | 5-7 min |
| ALL | APK + PWA + .exe | 8-12 min |

### Credential Injection

Cloud Build automatically replaces placeholder strings in built JS:

```typescript
// .env (same for every game — Cloud Build fills real values)
VITE_GAME_ID=YOUR_GAME_ID
VITE_GAME_API_KEY=YOUR_API_KEY
VITE_API_BASE_URL=https://newdeskillzgames-production.up.railway.app
VITE_SOCKET_URL=wss://newdeskillzgames-production.up.railway.app
VITE_ENV=production
VITE_ENABLE_DEBUG=false
VITE_APP_VERSION=1.0.0
```

For local dev, create `.env.local` (git-ignored) with real UUID and API key.
Delete `.env.local` before building for Cloud Build.

### Build ZIP Commands

**vite.config.ts (CRITICAL: `base` must be top-level):**

```typescript
export default defineConfig({
  base: './',           // CRITICAL - top-level, NOT inside build:{}
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
  },
});
```

**Windows PowerShell:**
```powershell
npm run build
Remove-Item .env.local -ErrorAction SilentlyContinue  # Remove local creds
# Stamp deskillz-sw.js with unique build hash (manual -- Vite plugin cache workaround)
$hash = "{0}-{1}" -f ([System.DateTimeOffset]::Now.ToUnixTimeSeconds().ToString("x")), (Get-Random -Maximum 99999999).ToString("x8")
(Get-Content .\dist\deskillz-sw.js -Raw) -replace '__BUILD_HASH__', $hash | Set-Content .\dist\deskillz-sw.js -Encoding UTF8 -NoNewline
Write-Host "[sw-version] Stamped deskillz-sw.js with build hash: $hash" -ForegroundColor Green
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

**macOS/Linux:**
```bash
npm run build
rm -f .env.local
HASH="$(date +%s | base64 | head -c8)-$(openssl rand -hex 4)"
sed -i "s/__BUILD_HASH__/$HASH/g" dist/deskillz-sw.js
echo "[sw-version] Stamped deskillz-sw.js with build hash: $HASH"
cd dist && zip -r ../game-cloud-build.zip . -x '*.map' && cd ..
```

### Real-Time Build Progress (Socket)

```javascript
bridge.onRealtimeEvent('build:progress', (data) => {
  console.log(`${data.progress}% - ${data.currentStep}`);
  // Steps: QUEUED(0) -> PREPARING(5) -> EXTRACTING(15) -> VALIDATING(20)
  //     -> CONFIGURING(25) -> INSTALLING(35) -> BUILDING_WEB(50)
  //     -> BUILDING_ANDROID/PWA/ELECTRON(70) -> SIGNING(85) -> UPLOADING(95) -> SUCCESS(100)
});
```

---

## 9A. ASSET GENERATION FOR CLOUD BUILD

### Required Icon Sizes

| Category | Sizes (px) | Files | Purpose |
|----------|-----------|-------|---------|
| PWA Icons | 72, 96, 128, 144, 152, 192, 384, 512 | 8 | manifest.json icons |
| Android Icons | 48, 72, 96, 144, 192, 512 + adaptive | 7 | APK launcher |
| iOS Touch Icons | 120, 152, 167, 180 | 4 | apple-touch-icon |
| Favicons | 16, 32, 48 | 3 | Browser tab |
| OG Image | 1200x630 | 1 | Social sharing |

### Splash Screens (iOS)

| Device | Size | Media Query |
|--------|------|-------------|
| iPhone SE/8 | 750x1334 | 375x667 @2x |
| iPhone X/XS | 1125x2436 | 375x812 @3x |
| iPhone 12/13/14 | 1170x2532 | 390x844 @3x |
| iPhone 14/15 Pro Max | 1290x2796 | 430x932 @3x |
| iPad Pro 12.9" | 2048x2732 | 1024x1366 @2x |

### manifest.json (Required for PWA + iOS Install)

```json
{
  "name": "Your Game - Deskillz",
  "short_name": "Your Game",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0A0A1A",
  "theme_color": "#00D9FF",
  "icons": [
    { "src": "./assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png",
      "purpose": "any maskable" }
  ]
}
```

> `start_url: "./"` and `scope: "./"` are REQUIRED for iOS PWA install.
> Absolute `/` paths cause "Failed to Download" on iPhone when hosted at R2 subpaths.

### Icon Generator Script

```javascript
// scripts/generate-icons.js (ESM format — package.json has "type":"module")
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// NOTE: Use import/export syntax — NOT require() — in ESM projects
// If you need CommonJS, rename to .cjs

let sharp = null;
try { sharp = (await import('sharp')).default; }
catch { console.log('Run: npm install sharp --save-dev'); }

// Generate all required icon sizes from a source PNG or SVG
```

---

## 10. INTEGRATION PATTERNS

### Pattern 1: Full Standalone (React — Recommended)

```
src/
  main.tsx                    App entry, DeskillzBridge.init() + ReactDOM.render()
  App.tsx                     React router shell
  sdk/
    DeskillzBridge.ts         v3.1 embedded SDK — DO NOT MODIFY
    YourGameBridge.ts         Game-specific extension (optional)
  screens/
    AuthScreen.tsx
    LobbyScreen.tsx           Tab shell
    TournamentPage.tsx        TournamentCard + useEnrollmentStatus
    QuickPlayPage.tsx         QuickPlayCard + useQuickPlayQueue
    GameScreen.tsx            Mounts your gameplay canvas/PixiJS engine
    ResultsScreen.tsx
    ProfileScreen.tsx
    WalletScreen.tsx
  components/
    tournaments/
      TournamentCard.tsx      <- From @deskillz/game-ui (do not rebuild)
      TournamentLobbyCard.tsx <- From @deskillz/game-ui (v3.4.4 -- tournament lobby)
      QuickPlayCard.tsx       <- From @deskillz/game-ui (do not rebuild)
  hooks/
    useEnrollmentStatus.ts   <- From @deskillz/game-ui
    useQuickPlayQueue.ts     <- From @deskillz/game-ui
    useTournamentLobby.ts    <- From @deskillz/game-ui (v3.4.4 -- tournament lobby)
```

### Pattern 2: React/Vite + Canvas/PixiJS (Gameplay engine inside React)

Gameplay runs in Canvas or PixiJS. React handles all lobby UI.
The canvas is mounted inside a React component:

```tsx
// src/screens/GameScreen.tsx
import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { YourGameEngine } from '../game/YourGameEngine'  // unchanged

export default function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef    = useRef<YourGameEngine | null>(null)
  const navigate     = useNavigate()
  const matchData    = useLocation().state?.matchData

  useEffect(() => {
    if (!containerRef.current) return
    engineRef.current = new YourGameEngine(containerRef.current, {
      matchData,
      onGameEnd: async (score) => {
        await DeskillzBridge.getInstance().submitScore({ score })
        navigate('/results', { state: { score } })
      },
    })
    return () => { engineRef.current?.destroy(); engineRef.current = null }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
```

> **Non-React games (Dou Dizhu, Bubble Battle, Candy Duel):** Follow this pattern.
> See `DESKILLZ_NON_REACT_MIGRATION_GUIDE.md` for step-by-step instructions.

### Pattern 3: Lobby Mode (Deep Link — Minimal Integration)

```
index.html                    Receives deep link params
src/
  main.js                     Parse params, init bridge with token
  sdk/
    DeskillzBridge.ts
  game/
    GameManager.js            Your existing game
  ui/
    ResultsOverlay.js
```

---

## 11. BEST PRACTICES

### Performance

| Practice | Why |
|----------|-----|
| Lazy load screens | Faster initial load |
| Compress all assets | Smaller download |
| Use WebP images | 25-35% smaller than PNG |
| Minify JS/CSS | Smaller ZIP |
| Cache API responses | Reduce network calls |
| Use sprite atlases | Fewer HTTP requests |

### Mobile Optimization

```css
/* Prevent zoom on input focus */
input, select, textarea { font-size: 16px; }

/* Safe area for notch devices */
.screen {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Prevent pull-to-refresh */
html, body { overscroll-behavior: none; }

/* Touch-friendly buttons */
.btn { min-height: 44px; min-width: 44px; }
```

### Mobile Landscape (Important)

| Problem | Solution |
|---------|----------|
| Turn indicator covers discard area | Position at top 8%, auto-fade after 3s, `pointer-events: none` |
| Side player info blocks table | Compact PlayerInfo, row layout (not column) |
| Modal covers small screen | Half-height modal or slide-up panel |
| Fixed headers steal viewport | 32px slim header in landscape |

### CSS Theme Inheritance

Every full-screen container MUST set its own `background`. Never inherit from body.

```css
/* WRONG - inherits body color, causes theme mismatch */
.match-lobby { display: flex; min-height: 100vh; }

/* CORRECT */
.match-lobby {
  display: flex; min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-page) 0%, #040408 100%);
}
```

### Security

| Practice | Implementation |
|----------|----------------|
| Sign all scores | HMAC-SHA256: `${gameId}:${score}:${timestamp}:${userId}` |
| Validate server-side | Backend rejects unsigned scores |
| HTTPS only | All API calls |
| Token storage | `localStorage.getItem('deskillz_access_token')` |

### Error Handling

```typescript
try {
  await bridge.registerTournament(tournamentId);
} catch (error: any) {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS': showDepositModal(); break;
    case 'TOURNAMENT_FULL':    showToast('Tournament is full'); break;
    case 'ALREADY_REGISTERED': showToast('Already registered'); break;
    default: showToast('Something went wrong');
  }
}
```

### Prisma Decimal Fields (toNum Helper — Required in ProfileScreen)

Backend returns Prisma `Decimal` fields as strings. Calling `.toFixed()` on a string crashes.

```typescript
const toNum = (v: unknown): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

// Use on ALL .toFixed() calls on API response fields:
toNum(stats.totalEarnings).toFixed(2)   // NOT stats.totalEarnings.toFixed(2)
toNum(stats.winRate).toFixed(1)
toNum(wallet.total).toFixed(2)
```

---

## 12. TESTING CHECKLIST

### Before ZIP Upload

- [ ] `index.html` is at ZIP root
- [ ] All paths use `./` relative prefix (no absolute `/` paths)
- [ ] `node_modules/` not included
- [ ] `vite.config.ts` has `base: './'` at TOP LEVEL
- [ ] Source maps excluded (`*.map`)
- [ ] `.env.local` deleted before build
- [ ] ZIP size under 500MB
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npx vite build` succeeds

### SDK Integration

- [ ] Bridge initializes in LIVE mode (not guest)
- [ ] Login flow works (email, wallet)
- [ ] Logout clears localStorage `deskillz_access_token`
- [ ] Balance fetches from `/api/v1/wallet/balances`
- [ ] Tournament list loads via `bridge.getTournaments()`
- [ ] `TournamentCard` enrollment states work (see Section 22)
- [ ] QuickPlay queue joins and cancels correctly
- [ ] Socket connects after login
- [ ] Socket reconnects on disconnect

### Social Game Flow (Social Games Only)

- [ ] SocialGameManager initializes AFTER buy-in (not on room join)
- [ ] Starting chips granted to all players
- [ ] BalanceHUD shows live chip balance during game
- [ ] Payments applied after each winning hand (not just calculated)
- [ ] Rake correct: `pot * rakePercent`, capped at `rakeCap`
- [ ] Bust warning triggers BuyInModal at 0 chips
- [ ] Host Dashboard uses safe defaults (no crash on partial data)
- [ ] `toNum()` wraps all `.toFixed()` calls

### Disputes (All Games)

- [ ] DisputeModal opens from results screen with correct disputeType badge
- [ ] 7 reason buttons render and select correctly
- [ ] Description enforces 10 char min, 2000 char max
- [ ] Submit calls bridge.fileDispute() -- check POST /api/v1/disputes in network tab
- [ ] Success state shows reference ID and 24-48hr review notice
- [ ] Error state shows message, allows retry
- [ ] bridge.getMyDisputes() returns user's disputes
- [ ] bridge.addDisputeEvidence() adds evidence to open dispute
- [ ] Rate limit: 6th open dispute returns error

### After Cloud Build

- [ ] APK installs on Android
- [ ] PWA installs on iOS via Safari "Add to Home Screen"
- [ ] Game loads in APK WebView
- [ ] No white screen on launch
- [ ] Deep links work in built app
- [ ] Download page shows all platforms

### New Game Deployment Checklist

- [ ] Game created via Developer Portal Step 0 (NOT admin "Create Platform Game")
- [ ] `gameCategory` set correctly (ESPORTS or SOCIAL) in Step 4
- [ ] `socialGameType` set if SOCIAL
- [ ] Game approved in Admin Dashboard
- [ ] Quick Play enabled in Admin -> Quick Play tab
- [ ] `.env` uses `YOUR_GAME_ID` / `YOUR_API_KEY` placeholders
- [ ] `ProfileScreen.tsx` uses `toNum()` on all `.toFixed()` calls
- [ ] Guest guards implemented (2 guards: competitive + rooms)

---

## 13. TROUBLESHOOTING

### Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ENTRY_POINT_NOT_FOUND` | index.html not at root | Move to ZIP root |
| `ASSETS_NOT_LOADING` | Absolute paths | Use `./` relative paths |
| `BUILD_TIMEOUT` | Build > 10 min | Optimize assets, reduce size |
| `GRADLE_BUILD_FAILED` | Android SDK issue | Check Docker logs |
| `WINE_INIT_FAILED` | Wine not initialized | `wineboot --init` in Docker |
| White screen | JS error on load | Check console, check `base: './'` |

### Runtime Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Login succeeds but user is guest | SDK not initialized (sdk=null) | Use embedded `DeskillzBridge.ts`, not dynamic import |
| Wallet shows $0 after login | Guest mode | Verify `bridge.isLive === true` |
| "Connect Wallet" creates guest | No signMessage function | Use `window.ethereum` with `personal_sign` |
| Register creates no account | Calling `bridge.login()` | Use `bridge.register(username, email, password)` |
| API key not injected | Wrong placeholder | Use exactly `'YOUR_API_KEY'` |
| No API calls in network tab | SDK offline/guest mode | Check bridge init mode |
| Host dashboard blank screen | `profile.tier` undefined | Use spread-merge safe defaults |
| Scores show 0 after wins | Payments calculated not applied | Apply `scoreResult.payments` to `player.totalScore` |
| `require is not defined` | ESM project | Use `import/export`, or rename `.cjs` |
| Old cached page after deploy | Stale Workbox service worker | Use `deskillz-sw.js` (not `sw.js`) + hash stamp on every build |
| `.env` not loading | BOM encoding or no restart | Create without BOM; restart Vite |
| `gameId must be UUID` | Slug used instead of UUID | Register game via Developer Portal, use returned UUID |
| iOS PWA "Failed to Download" | Absolute `start_url: "/"` | Use `start_url: "./"` and `scope: "./"` |
| `.toFixed is not a function` | Prisma Decimal returned as string | Wrap with `toNum()` helper |
| `quickPlayLobbyUpdate` TS error | Missing from BridgeEventType | Add to union in `DeskillzBridge.ts` |

### Debug Mode

```typescript
// Check state in browser console
const bridge = YourGameBridge.getInstance();
console.log('Authenticated:', bridge.getIsAuthenticated()); // method, not property
console.log('Live:',          bridge.isLive);               // getter
console.log('User:',          bridge.getCurrentUser());
```

---

## 14. QUICK REFERENCE

### API Endpoints (Complete Reference)

All endpoints use `/api/v1/` prefix:

| Method | Endpoint | Notes |
|--------|----------|-------|
| **Auth** | | |
| POST | `/auth/login` | Email + password |
| POST | `/auth/register` | Username + email + password |
| POST | `/auth/guest` | No credentials |
| GET | `/auth/nonce` | SIWE wallet nonce |
| POST | `/auth/wallet/verify` | SIWE signature |
| POST | `/auth/refresh` | Refresh expired token |
| POST | `/auth/logout` | Invalidate tokens |
| **Wallet** | | |
| GET | `/wallet/balances` | Multi-currency. `/wallet/total` does NOT exist (404) |
| POST | `/wallet/deposit` | Chain + amount + txHash |
| POST | `/wallet/withdraw` | Chain + amount + toAddress |
| GET | `/wallet/transactions` | Paginated history |
| **Users** | | |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users/:userId/stats` | Requires UUID param — NOT `/users/stats` |
| GET | `/users/me/stats` | Stats via JWT (returns `gameplayHours`) |
| GET | `/users/match-history` | Recent matches |
| **Tournaments** | | |
| GET | `/tournaments` | Filter: `gameId`, `maxEntryFee`, `minEntryFee` |
| GET | `/tournaments/:id` | Single tournament detail |
| POST | `/tournaments/:id/register` | **v3.0** Step 1 enrollment |
| POST | `/tournaments/:id/checkin` | **v3.0** Step 2 enrollment (T-30 to T-10 window) |
| GET | `/tournaments/:id/my-status` | **v3.0** Enrollment state + DQ countdown |
| GET | `/tournaments/my-registrations` | **v3.0** All user registrations |
| POST | `/tournaments/:id/score` | Submit score |
| **Private Rooms** | | |
| POST | `/private-rooms` | Create esport room (entry-fee based) |
| POST | `/private-rooms/social` | Create social room (rake-based, creates SocialGameSession) |
| POST | `/private-rooms/join` | Join by room code |
| POST | `/private-rooms/:id/start` | Host starts match |
| POST | `/private-rooms/:id/buy-in` | Social buy-in |
| POST | `/private-rooms/:id/cash-out` | Social cash-out |
| GET | `/private-rooms/public` | List public rooms by gameId |
| **Quick Play** | | |
| GET | `/quick-play/games/:gameId` | **v3.0** QuickPlay config for game |
| POST | `/lobby/quick-play/join` | Join matchmaking queue |
| POST | `/lobby/quick-play/leave` | Leave queue |
| GET | `/lobby/quick-play/status` | Queue status |
| POST | `/lobby/quick-play/match/launch` | Launch match |
| POST | `/lobby/quick-play/match/:id/score` | Submit match score |
| **Host** | | |
| GET | `/host/dashboard` | Returns `esportsTierInfo`, `socialTierInfo`, `earnings` |
| POST | `/host/register` | Register as host |
| POST | `/host/earnings/withdraw` | Withdraw earnings |
| **Leaderboard** | | |
| GET | `/leaderboard/global` | NOT `/leaderboard` bare path (404) |
| GET | `/leaderboard/game/:gameId` | Per-game leaderboard |
| GET | `/leaderboard/me` | Current user rank |
| GET | `/leaderboard/platform/stats` | Platform statistics |
| **Spectator** | | |
| GET | `/spectator/rooms` | List spectateable rooms |
| GET | `/spectator/rooms/:id/check` | Permission check |
| GET | `/spectator/rooms/:id` | Room state (REST fallback) |
| **Disputes** | | |
| POST | `/disputes` | File a dispute (5 open max, prevents duplicates) |
| GET | `/disputes/me` | List my disputes (optional `?status=OPEN`) |
| GET | `/disputes/:id` | Dispute details (own disputes only) |
| POST | `/disputes/:id/evidence` | Add evidence to open dispute |
| **Hosted Games** | | |
| GET | `/hosted-games` | List public hosted games |
| GET | `/hosted-games/:slug` | Get game by slug |
| POST | `/hosted-games/:gameId/publish` | Publish a build |
| GET | `/hosted-games/:slug/download/android` | Android download URL |
| GET | `/hosted-games/:slug/download/windows` | Windows download URL |

### Socket Events (Complete Reference)

| Event | Direction | Source | Purpose |
|-------|-----------|--------|---------|
| **Tournament (v3.0 NEW)** | | | |
| `tournament:registered` | S->C | Backend | Player registered for tournament |
| `tournament:checked-in` | S->C | Backend | Player checked in |
| `tournament:checkin-open` | S->C | Backend | T-30: check-in window opens |
| `tournament:dq-noshow` | S->C | Backend | T-10: player DQ'd for no-show |
| `tournament:starting` | S->C | Backend | Tournament starting now |
| **Quick Play** | | | |
| `quick-play:searching` | S->C | Bridge | Queue search started |
| `quick-play:found` | S->C | Bridge | Opponent found |
| `quick-play:npc-filling` | S->C | Bridge | Filling with NPC (shown as "Filling match...") |
| `quick-play:starting` | S->C | Bridge | Match countdown |
| `quick-play:match-launched` | S->C | Bridge | Match began |
| `quick-play:score-submitted` | S->C | Bridge | Score received |
| `quick-play:match-completed` | S->C | Bridge | Match finished |
| `quick-play:lobby-update` | S->C | Bridge | Available games board update |
| **Room Lifecycle** | | | |
| `private-room:player-joined` | S->C | Backend | Player entered room |
| `private-room:player-left` | S->C | Backend | Player left room |
| `private-room:player-ready` | S->C | Backend | Ready status changed |
| `private-room:countdown-started` | S->C | Backend | Game about to start |
| `private-room:launching` | S->C | Backend | Game launch (deep link) |
| **Game Sync** | | | |
| `game:state` | S->C | Host | Full sanitized game state |
| `game:action` | C->S | Player | Player action |
| `game:round-end` | S->C | Host | Round results |
| `game:game-end` | S->C | Host | Final results |
| **Platform** | | | |
| `room:join` | C->S | Client | Subscribe to room channel |
| `room:leave` | C->S | Client | Unsubscribe |
| `room:chat` | C->S | Client | Send chat message |
| `room:ready` | C->S | Client | Set ready status |
| `build:progress` | S->C | Backend | Cloud Build progress |

### NPC Fill Policy

`quick-play:npc-filling` is an internal event that maps to `filling` state.
NEVER display "bot", "AI", or "NPC" in player-facing UI.
Show: "Filling match..." — nothing more.

### EsportMatchMode Enum (v3.0)

| Value | Description |
|-------|-------------|
| `ASYNC` | Players play at their own pace, scores compared at deadline |
| `SYNC` | Players queue and match in real-time |
| `BLITZ_1V1` | Fast-paced 1v1 match, short time limit (e.g. Candy Duel 60s) |
| `DUEL_1V1` | Standard 1v1 duel, full match duration (e.g. Bubble Battle) |
| `SINGLE_PLAYER` | Solo score attack, no opponent, ranked by score |
| `TURN_BASED` | Players take turns, not real-time (strategy/board/card games) |

### Deskillz Platform Colors

> These are platform colors. Individual games define their own theme variables.

| Element | Value |
|---------|-------|
| Primary | `#00D9FF` (Cyan) |
| Secondary | `#9D4EDD` (Purple) |
| Background | `#0A0A1A` |
| Card Background | `#1A1A2E` |
| Success | `#00FF88` |
| Error | `#FF4444` |

### File Size Limits

| Asset | Limit |
|-------|-------|
| ZIP Source | 500MB |
| Built APK | 150MB |
| Built PWA | 100MB |
| Built .exe | 200MB |
| Single Image | 1MB |
| Single Audio | 2MB |

---

## 15. HOSTED GAMES SERVICE

After Cloud Build completes, games are published at `deskillz.games/[slug]`.

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/hosted-games` | List public games |
| GET | `/api/v1/hosted-games/:slug` | Get by slug |
| POST | `/api/v1/hosted-games/:gameId/publish` | Publish build |
| GET | `/api/v1/hosted-games/:slug/download/android` | APK download URL |
| GET | `/api/v1/hosted-games/:slug/download/windows` | Windows download URL |
| POST | `/api/v1/hosted-games/:slug/download/track` | Track analytics |
| GET | `/api/v1/hosted-games/:slug/qr/:platform` | QR code |
| GET | `/api/v1/hosted-games/developer/my-games` | Developer's games |

### Publishing a Build

```javascript
await fetch('/api/v1/hosted-games/GAME_ID/publish', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    buildJobId: 'completed-job-uuid',
    slug: 'my-game',
    platform: 'ANDROID',
    isPublic: true,
  }),
});
```

---

## 16. WINDOWS DESKTOP BUILD

Web games are wrapped into portable `.exe` using Electron cross-compiled via Wine.

### How It Works

```
Your game (HTML/JS/CSS)
        |
Electron template (main.js + preload.js)
        |
electron-builder via Wine on Linux
        |
Portable .exe (no installer, runs directly)
```

### Desktop API

Games detect the desktop environment:

```javascript
if (window.deskillzDesktop) {
  console.log('Platform:', window.deskillzDesktop.platform);    // 'windows'
  console.log('Version:', window.deskillzDesktop.appVersion);
  window.deskillzDesktop.openExternal('https://deskillz.games');
  window.deskillzDesktop.toggleFullscreen();
}
```

### Notes

- Output is portable .exe (no admin rights needed)
- Users may need: "More info" -> "Run anyway" on Windows SmartScreen
- Minimum: Windows 10 x64
- Size: 60-120MB typical
- Template placeholders: `{{APP_NAME}}`, `{{APP_SLUG}}`, `{{APP_VERSION}}`

---

## 17. GAME DOWNLOAD PAGE

Each hosted game gets a public download page at `deskillz.games/[slug]`.

### Platform Behavior

| Device | Primary Action | Notes |
|--------|----------------|-------|
| Android | APK download | Enable "Install unknown apps" |
| iOS | PWA "Add to Home Screen" | Safari only — Chrome cannot install PWAs |
| Windows | .exe download | May need SmartScreen bypass |

### Installation Instructions

**Android APK:** Download -> Open file -> Enable "Install unknown apps" -> Install

**iOS PWA:** Safari only -> Share button -> "Add to Home Screen" -> Add

**Windows .exe:** Download -> "More info" -> "Run anyway" -> Launches directly

---

## 18. DOCKER WORKER REFERENCE

### Docker Image Contents

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20 LTS | Runtime |
| OpenJDK | 17 | Android builds |
| Android SDK | 34 | APK compilation |
| Capacitor CLI | 5.x | Web-to-Android |
| Wine | 10.0 | Windows cross-compile |
| electron-builder | 24.9.1 | .exe packaging |
| Workbox CLI | Latest | PWA service worker |

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `REDIS_HOST` | Yes | Redis connection |
| `R2_ENDPOINT` | Yes | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret |
| `R2_BUCKET_NAME` | No | Default: deskillz-builds |
| `BUILD_CONCURRENCY` | No | Default: 2 |
| `BUILD_TIMEOUT_MS` | No | Default: 600000 (10 min) |
| `KEYSTORE_ENCRYPTION_KEY` | Yes | AES key for keystores |

```bash
# Build image
docker build -t deskillz-builder .
# Verify Wine
docker run --rm deskillz-builder wine64 --version
# Start services
docker compose up -d
```

---

## 19. DEVELOPER PORTAL - GAME SUBMISSION FLOW

### 19.1 NewGamePage Full Flow

| Step | Action | Endpoint |
|------|--------|----------|
| 0 | Draft creation | `POST /api/v1/developer/games/draft` — returns `gameId`, `apiKey`, `apiSecret` |
| 1 | Game info | Name, description, genre, tags |
| 2 | Platform & Engine | Platform (ANDROID/IOS/BOTH), Engine (unity/unreal/web) |
| 3 | Build upload | APK (native) or ZIP (web — triggers Cloud Build) |
| 4 | Game settings | Players, duration, mode, `gameCategory`, `socialGameType` |
| 5 | Assets | Icon, banner, screenshots, video — R2 presigned URLs |
| 6 | Review & submit | `updateGame()` + Cloud Build trigger |

> **ALWAYS use Developer Portal Step 0.** The Admin "Create Platform Game" flow skips
> credential generation, leaving `apiKey`, `apiSecret`, `deepLinkScheme` as null.

### 19.2 Asset Upload Flow (R2 Presigned URLs)

```
POST /api/v1/developer/games/:gameId/assets/upload
  -> returns { uploadUrl, publicUrl }
PUT uploadUrl (direct to R2, no backend involvement)
PATCH /api/v1/developer/games/:gameId (with publicUrl as iconUrl, bannerUrl, etc.)
```

Size limits: icon 2MB, banner 5MB, screenshot 5MB, video 100MB

### 19.3 Cloud Build Trigger (Web Games)

For `gameEngine === 'web'`, after `updateGame()`:

1. `POST /api/v1/cloud-build/source/upload` — get presigned R2 URL
2. PUT ZIP directly to R2
3. `POST /api/v1/cloud-build/source/confirm` — with fileHash
4. `POST /api/v1/cloud-build/jobs` — per platform

### 19.4 How to Find Your Game UUID

```javascript
// In browser console on any Deskillz page
fetch('https://newdeskillzgames-production.up.railway.app/api/v1/games?status=APPROVED&limit=100')
  .then(r => r.json())
  .then(d => d.games.forEach(g => console.log(g.name, '->', g.id)));
```

---

## 20. CRITICAL DEPLOYMENT NOTES

### 20.1 Storage Service Injection Pattern

```typescript
// CORRECT - use token injection:
import { STORAGE_SERVICE, IStorageService } from '../storage/storage.module';
@Inject(STORAGE_SERVICE) private readonly storage: IStorageService

// WRONG - not directly injectable:
// private readonly storage: R2StorageService
```

### 20.2 Prisma Migration Checklist

1. `npx prisma migrate dev --name description`
2. `npx prisma generate`
3. Restart TS Server in VS Code (Ctrl+Shift+P -> "TypeScript: Restart TS Server")
4. Commit migration files in `prisma/migrations/`
5. Push to repo — Railway auto-runs `prisma migrate deploy`

### 20.3 Encoding Safety

- ASCII only in .md files: `[DONE]`, `[B]`, `[S]` (no emojis — encoding corruption)
- CJK in JSX: use Unicode escapes `{'\u9504\u5927\u5F1F'}` to avoid file corruption
- All source files: UTF-8 without BOM

### 20.4 Backend CORS (Dynamic Origin)

The backend uses a dynamic origin validator (`buildOriginValidator()`) that auto-allows:
- Cloudflare R2: `^https://pub-[a-f0-9]+\.r2\.dev$`
- Capacitor/WebView: `null` origin
- Cloudflare Pages: `*.pages.dev`
- Vercel previews: `*.vercel.app`

No manual CORS updates needed for new Cloud Build deployments.

### 20.5 Production URLs

```
Backend API:  https://newdeskillzgames-production.up.railway.app
WebSocket:    wss://newdeskillzgames-production.up.railway.app
Frontend:     https://deskillz.games
DB Proxy:     shuttle.proxy.rlwy.net:15682
Swagger:      https://newdeskillzgames-production.up.railway.app/docs
```

Test connectivity:
```bash
curl https://newdeskillzgames-production.up.railway.app/api/v1/tournaments
```

---

## 21. SDK V3.0 ARCHITECTURE

### What Changed in v3.0

| Area | Before v3.0 | v3.0 |
|------|------------|-------|
| Bridge file | ~1,830 lines | 2,104 lines |
| Tournament UI cards | Built per-game | Shared `TournamentCard` + `QuickPlayCard` |
| Enrollment | `joinTournament()` only | 4 new methods + 5 socket events |
| QuickPlay config | Hardcoded in game | `getQuickPlayConfig(gameId)` from backend |
| Non-React lobby | Build from scratch | `DeskillzUI.js` UMD bundle (53KB) |
| Match mode | Binary async/sync | `EsportMatchMode` enum (4 values) |

### New Types in DeskillzBridge v3.0

```typescript
// Enrollment status (8 states)
type TournamentEnrollmentStatus =
  | 'NOT_REGISTERED' | 'REGISTERED' | 'CHECKIN_OPEN' | 'CHECKED_IN'
  | 'STARTING' | 'DQ_NO_SHOW' | 'STANDBY' | 'CANCELLED';

// Enrollment state returned by getEnrollmentStatus()
interface TournamentEnrollmentState {
  status: TournamentEnrollmentStatus;
  dqCountdownSeconds?: number;   // Live countdown from T-30 to T-10
  checkinOpensAt?: string;       // ISO timestamp
  checkinClosesAt?: string;      // ISO timestamp (= T-10)
  tournamentStartsAt?: string;
}

// QuickPlay configuration
interface QuickPlayConfig {
  gameId: string;
  tiers: QuickPlayTier[];        // Entry fee tiers
  modes: string[];               // Available match modes
  maxPlayersPerMatch: number;
  npcFillEnabled: boolean;
  queueTimeoutSeconds: number;
}

// Currency constants
const CryptoCurrency = {
  BNB:       'BNB',
  USDT_BSC:  'USDT_BSC',
  USDT_TRON: 'USDT_TRON',
  USDC_BSC:  'USDC_BSC',
  USDC_TRON: 'USDC_TRON',
} as const;
```

### New BridgeEventType Values (v3.0)

Add these to the `BridgeEventType` union in `DeskillzBridge.ts`:

```typescript
| 'tournamentRegistered'
| 'tournamentCheckedIn'
| 'tournamentCheckinOpen'
| 'tournamentDQNoShow'
| 'tournamentStarting'
| 'quickPlayLobbyUpdate'    // For available games board
```

### New Socket Listeners (v3.0)

These are wired inside `DeskillzBridge.connectRealtime()`:

| Raw Socket Event | Bridge Event Emitted |
|-----------------|---------------------|
| `tournament:registered` | `tournamentRegistered` |
| `tournament:checked-in` | `tournamentCheckedIn` |
| `tournament:checkin-open` | `tournamentCheckinOpen` |
| `tournament:dq-noshow` | `tournamentDQNoShow` |
| `tournament:starting` | `tournamentStarting` |

### App.tsx Wiring (Required for v3.0)

```typescript
// Wire enrollment events
useEffect(() => {
  const cleanups = [
    bridge.onRealtimeEvent('tournamentCheckinOpen', (data) => {
      toast.info('Check-in is now open for your tournament!');
    }),
    bridge.onRealtimeEvent('tournamentDQNoShow', (data) => {
      toast.error('You were removed from the tournament (no check-in)');
    }),
    bridge.onRealtimeEvent('tournamentStarting', (data) => {
      // Navigate to match
    }),
    bridge.onRealtimeEvent('quickPlayLobbyUpdate', (games) => {
      setState(prev => ({ ...prev, availableGames: games ?? [] }));
    }),
  ];
  return () => cleanups.forEach(fn => fn());
}, [bridge]);

// Wire gameplay hours for tier unlock
useEffect(() => {
  if (!state.isAuthenticated) return;
  const token = localStorage.getItem('deskillz_access_token');
  fetch(`${apiBase}/api/v1/users/me/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json()).then(s => setGameplayHours(s.gameplayHours ?? 0));
}, [state.isAuthenticated]);
```

### Required App.tsx Bridge Calls (Complete)

| When | Bridge Call | What Breaks If Missing |
|------|-----------|----------------------|
| Game ends | `bridge.submitGameResults(results)` | Scores not recorded |
| Quick Play ends | `bridge.submitQuickPlayScore(matchId, score)` | Match never completes |
| Player leaves | `bridge.leaveRoom()` | Backend: player still in room |
| Player leaves QP | `bridge.leaveQuickPlay()` | Ghost match possible |
| Social buy-in | `bridge.roomBuyIn(amount)` | Wallet not deducted |
| Social cash-out | `bridge.roomCashOut()` | Chips not returned |
| Host starts | `bridge.startRoom()` | Backend unaware |
| After transaction | `wallet.refresh()` | Stale balance display |
| Social round ends | `socialManager.processRoundResult(...)` | No rake, no bust detection |
| Lobby loads | `bridge.getLeaderboard(20)` | Empty leaderboard |
| Lobby loads | `bridge.getPublicRooms()` | Empty room list |

---

## 22. TOURNAMENT ENROLLMENT FLOW

### Enrollment Timeline

```
T - infinity  Player registers          -> status: REGISTERED
T - 30 min    Check-in window opens     -> status: CHECKIN_OPEN
              socket: tournament:checkin-open
              useEnrollmentStatus shows DQ countdown timer

T - 10 min    Bull job DQs no-shows     -> status: DQ_NO_SHOW
              socket: tournament:dq-noshow
              Entry FORFEITED — no refund

T - 0         Tournament starts         -> CHECKED_IN players: STARTING
              socket: tournament:starting
```

### Key Policy (DO NOT CONTRADICT IN DOCS OR UI)

| Policy | Value |
|--------|-------|
| Check-in window opens | 30 minutes before start (T-30) |
| DQ fires | 10 minutes before start (T-10) |
| DQ refund | NONE — entry forfeited |
| `checkinWindowMinutes` | Default 30, minimum 30 |

### Bridge Methods

```typescript
// Step 1: Register (anytime before T-30)
const registration = await bridge.registerTournament(tournamentId);
// Returns: TournamentRegistration { entryId, tournamentId, status: 'REGISTERED', ... }

// Step 2: Check in (T-30 to T-10 window only)
await bridge.checkInTournament(tournamentId);
// Returns: { status: 'CHECKED_IN' }

// Poll status (use hook instead — polls every 60s + socket updates)
const state = await bridge.getEnrollmentStatus(tournamentId);
// Returns: TournamentEnrollmentState

// All registrations (sorted by urgency — nearest check-in deadline first)
const registrations = await bridge.getMyRegistrations();
```

### useEnrollmentStatus Hook

```typescript
import { useEnrollmentStatus } from '../hooks/useEnrollmentStatus';

function TournamentRow({ tournament }) {
  const enrollment = useEnrollmentStatus(tournament.id);
  // Returns: { status, dqCountdown, loading, register, checkIn, refresh }

  // DQ countdown (live seconds remaining from checkinClosesAt)
  if (enrollment.dqCountdown !== null) {
    const mins = Math.floor(enrollment.dqCountdown / 60);
    const secs = enrollment.dqCountdown % 60;
    console.log(`DQ in: ${mins}m ${secs}s`);
  }

  return <TournamentCard tournament={tournament} enrollment={enrollment} />;
}
```

### TournamentCard Enrollment Button States

| Status | Button Label | Color | Action |
|--------|-------------|-------|--------|
| `NOT_REGISTERED` | "Register" | Blue | Calls `enrollment.register()` |
| `REGISTERED` | "Registered" | Gray | Disabled — shows checkin opens time |
| `CHECKIN_OPEN` | "Check In Now" | Amber + DQ timer | Calls `enrollment.checkIn()` |
| `CHECKED_IN` | "Checked In" | Green | Disabled — shows starting time |
| `STARTING` | "Enter Now" | Green pulse | Navigates to match |
| `DQ_NO_SHOW` | "Missed Check-In" | Red | Shows forfeit message |

### Backend Endpoints (Complete)

```
POST /api/v1/tournaments/:id/register
  Body: { currency?: string, txHash?: string }
  Returns: TournamentRegistration

POST /api/v1/tournaments/:id/checkin
  Body: { buyInAmount?: number, currency?: string }
  Returns: { status: 'CHECKED_IN' }

GET /api/v1/tournaments/:id/my-status
  Returns: TournamentEnrollmentState

GET /api/v1/tournaments/my-registrations
  Returns: TournamentRegistration[]
  NOTE: Route order matters — my-registrations MUST be before :id routes
```

### Tournament Creation (EsportMatchMode)

When creating tournaments via `CreateTournamentModal`, the `esportMatchMode` field maps to:

| Mode | Description | Use Case |
|------|-------------|----------|
| `ASYNC` | Scores submitted at own pace | Puzzle, runner, high-score games |
| `SYNC` | Real-time queue matching | Fighting, racing, vs games |
| `BLITZ_1V1` | Fast 1v1, short timer | Quick casual duels |
| `DUEL_1V1` | Standard 1v1 | Competitive head-to-head |

Social games always use `SYNC` mode (locked by backend validation).

---

## 23. @deskillz/game-ui — ES MODULE PACKAGE

### What Is It?

`@deskillz/game-ui` is a React component library (ES module) shared across
the main Deskillz website and all standalone web games. It provides the unified
tournament and QuickPlay UI with zero HTTP calls — all API calls go through
`DeskillzBridge` at runtime.

**This is a shared template — game developers drop it in, they do not build
QuickPlay or Tournament UI from scratch.**

**v3.4.3 changes:**
- `QuickPlayCard` rebuilt for esport AND social flows
- Social: point value is now a `<select>` dropdown (from `socialPointValueTiers`)
- Social: currency is now a `<select>` dropdown (from `socialCurrencies`)
- Social: live Available Games board from `quick-play:lobby-update` socket
- Social: Create Game button + JOIN button per open game
- Social: new `'waiting'` status when player created a game
- Esport: entry fee + player mode remain as chips; currency now dropdown
- `useQuickPlayQueue` adds: `availableGames`, `createGame()`, `joinGame(queueKey)`
- `AvailableGame` interface exported for typing the games board
- All options still 100% config-driven — admin controls what appears

**v3.1.0 changes:**
- UMD bundle (`DeskillzUI.umd.js`) RETIRED
- ES module only
- All custom Tailwind tokens replaced with standard utilities
- `QuickPlayCard` uses `onMatchStart` callback — no `useNavigate` inside card

### The Config-Driven Principle

Every selector in `QuickPlayCard` is populated from `QuickPlayConfig` set by the
admin/developer in the Deskillz admin panel. Nothing is hardcoded.

```
Admin sets: socialPointValueTiers = [0.25, 0.50, 1.00, 5.00]
            socialCurrencies = ['USDT_BSC', 'USDT_TRON']
                    |
                    v
Player sees: Point Value dropdown with 4 options
             Currency dropdown with 2 options
```

Adding or changing a config value in the admin panel reflects in all games
immediately — no code change in any standalone game.

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

### QuickPlay Flows (v3.4.3)

**ESPORTS** (Candy Duel, Bubble Battle, future arcade/puzzle games):
```
idle      Entry fee chips + player mode chips + currency dropdown + "Play Now"
searching Queue banner + elapsed timer + Cancel
filling   "Filling match..." (never say bot/AI/NPC)
found     "Match Found!" → onMatchStart fires after 2.5s
error     Error message + "Try Again"
```

**SOCIAL** (Big 2, Mahjong, Thirteen Cards, Dou Dizhu):
```
idle      Point value dropdown + currency dropdown + buy-in info
          + Available Games board (live from socket)
          + "Create $X/pt Game" button
waiting   Created a game — seat dots + player count + Cancel
filling   "Filling match..."
found     "Match Found!" → onMatchStart fires after 2.5s
error     Error message + "Try Again"
```

### QuickPlayPage.tsx — identical for all games

```tsx
// src/screens/QuickPlayPage.tsx
export default function QuickPlayPage() {
  const navigate = useNavigate()
  const gameId   = DeskillzBridge.getInstance().getConfig().gameId
  const qp       = useQuickPlayQueue(gameId)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem' }}>
      <QuickPlayCard
        qp={qp}
        onMatchStart={(matchData) => navigate('/game', { state: { matchData } })}
      />
    </div>
  )
}
```

The card handles all rendering, states, socket subscriptions, and API calls.
The caller only provides `onMatchStart` for navigation.

### Package Structure (v3.4.3)

```
packages/game-ui/
  package.json            @deskillz/game-ui v3.4.3
  vite.config.ts          ES module only, process.env.NODE_ENV substituted
  src/
    index.ts              Public exports (updated for rooms + host dashboard)
    bridge-types.ts       Inlined types
    utils.ts              cn() helper
    tokens/colors.css     Design tokens CSS variables (--dsk-*)
    components/ui/
      Badge.tsx
      Button.tsx
      Card.tsx
    components/tournaments/
      TournamentCard.tsx
      QuickPlayCard.tsx   v3.2 -- esport chips + social dropdowns + board
    components/rooms/     [NEW in v3.2]
      BuyInModal.tsx      Social buy-in with quick-select + currency picker
      CashOutModal.tsx    Cash-out with session P/L summary
      RebuyModal.tsx      Bust recovery (rebuy or leave)
      LowBalanceWarning.tsx  Balance warning toast + inline variant
      TurnTimer.tsx       Circular SVG timer + compact pill + overlay
      PauseRequestModal.tsx  Pause request + vote + status (3 sub-modals)
      SocialGameSettings.tsx  Room config: game type, point value, rake, timer
      AgeVerificationModal.tsx  21+ age gate for hosting rooms
    hooks/
      useEnrollmentStatus.ts
      useQuickPlayQueue.ts   v3.2 -- availableGames, createGame, joinGame
      useHostDashboard.ts    v3.2 -- host dashboard state machine [NEW]
  dist/
    DeskillzUI.mjs        Built ES module
    DeskillzUI.css        Design tokens CSS
    index.d.ts            TypeScript declarations
    [component].d.ts      Per-file declarations
```

### dist/ Folder — What to Keep vs Remove

```
KEEP:   DeskillzUI.mjs        (ES module build)
KEEP:   DeskillzUI.css        (design tokens)
KEEP:   *.d.ts files          (TypeScript declarations)
REMOVE: DeskillzUI.umd.js     (retired UMD bundle)
REMOVE: DeskillzUI.umd.js.map (map for retired bundle)
REMOVE: DeskillzUI.mjs.map    (source maps not needed)
REMOVE: LobbyOverlay.d.ts     (LobbyOverlay retired from public API)
```

### Build Command (After Updating src/ Files)

```powershell
cd D:\NewDeskillzGames\packages\game-ui
npm run build
# Regenerates dist/ from updated src/ files
```

Run this after replacing `QuickPlayCard.tsx` or `useQuickPlayQueue.ts` in src/
to keep dist/ in sync.

### Distribution to Games (via ZIP)

All 6 standalone games receive source files from `deskillz-sdk-v32-all-games.zip`:

**Core files (ALL games -- esport and social):**

| File | Action per game |
|------|----------------|
| `src/sdk/DeskillzBridge.ts` | REPLACE with v3.2 |
| `src/components/tournaments/TournamentCard.tsx` | NEW or UPDATE |
| `src/components/tournaments/QuickPlayCard.tsx` | NEW or UPDATE (v3.2) |
| `src/hooks/useEnrollmentStatus.ts` | NEW or UPDATE |
| `src/hooks/useQuickPlayQueue.ts` | NEW or UPDATE (v3.2) |
| `src/components/ui/Badge.tsx` | UPDATE |
| `src/components/ui/Button.tsx` | UPDATE |
| `src/components/ui/Card.tsx` | UPDATE |
| `src/utils.ts` | Copy if missing |
| `src/bridge-types.ts` | Copy if missing |
| `src/styles/tokens.css` | Import once in App.tsx |

**Social game files (Big 2, Mahjong, Thirteen Cards, Dou Dizhu):**

| File | Action per game |
|------|----------------|
| `src/hooks/useHostDashboard.ts` | NEW (v3.2) |
| `src/components/rooms/BuyInModal.tsx` | NEW (v3.2) |
| `src/components/rooms/CashOutModal.tsx` | NEW (v3.2) |
| `src/components/rooms/RebuyModal.tsx` | NEW (v3.2) |
| `src/components/rooms/LowBalanceWarning.tsx` | NEW (v3.2) |
| `src/components/rooms/TurnTimer.tsx` | NEW (v3.2) |
| `src/components/rooms/PauseRequestModal.tsx` | NEW (v3.2) |
| `src/components/rooms/SocialGameSettings.tsx` | NEW (v3.2) |
| `src/components/rooms/AgeVerificationModal.tsx` | NEW (v3.2) |

### What Was Retired

| Item | Status |
|------|--------|
| `DeskillzUI.umd.js` | RETIRED — delete from dist/ |
| `DeskillzUI.renderLobby()` | RETIRED |
| `DeskillzUI.showLobby()` | RETIRED |
| `DeskillzUI.hideLobby()` | RETIRED |
| `public/sdk/DeskillzUI.js` | RETIRED — delete from all game projects |

Non-React game migration: see `DESKILLZ_NON_REACT_MIGRATION_GUIDE.md`.

---

### Installation

```bash
npm install @deskillz/game-ui

# Peer dependencies (must be in your game project):
npm install react react-dom react-router-dom framer-motion lucide-react react-hot-toast clsx tailwind-merge
```

### Usage

```tsx
// In App.tsx or index.css — import design tokens once
import '@deskillz/game-ui/dist/DeskillzUI.css'

// In any screen
import { TournamentCard, QuickPlayCard, useEnrollmentStatus, useQuickPlayQueue }
  from '@deskillz/game-ui'
```

### Package Structure (v3.1.0)

```
packages/game-ui/
  package.json            @deskillz/game-ui v3.1.0 — all deps are peerDeps
  vite.config.ts          ES module only, process.env.NODE_ENV substituted,
                          react+react-dom+react-router-dom external only
  src/
    index.ts              Public exports (entry for ES build)
    bridge-types.ts       Inlined types — no import from deskillz-web-sdk needed
    utils.ts              cn() with clsx + tailwind-merge
    tokens/colors.css     CSS variables (--dsk-*) + Unity/Unreal hex values
    components/ui/
      Badge.tsx           Standard Tailwind only (no custom tokens)
      Button.tsx          Standard Tailwind only
      Card.tsx            Standard Tailwind only
    components/tournaments/
      TournamentCard.tsx  Standard Tailwind only + inline style for accents
      QuickPlayCard.tsx   Standard Tailwind only, no useNavigate
    hooks/
      useEnrollmentStatus.ts   Uses window.DeskillzBridge at runtime
      useQuickPlayQueue.ts     Uses window.DeskillzBridge at runtime
  dist/
    DeskillzUI.es.js      Built ES module
    DeskillzUI.css        Design tokens CSS (2KB)
    index.d.ts            TypeScript declarations
```

### Build Command (Platform Team Only)

```powershell
cd D:\NewDeskillzGames\packages\game-ui
npm install
npm run build
# Output: dist/DeskillzUI.es.js + dist/DeskillzUI.css + dist/index.d.ts
```

### Distribution to Games

All games receive the same set of source files directly (not a compiled bundle):

| File | Action per game |
|------|----------------|
| `src/sdk/DeskillzBridge.ts` | REPLACE existing |
| `src/components/tournaments/TournamentCard.tsx` | NEW or UPDATE |
| `src/components/tournaments/QuickPlayCard.tsx` | NEW or UPDATE |
| `src/hooks/useEnrollmentStatus.ts` | NEW or UPDATE |
| `src/hooks/useQuickPlayQueue.ts` | NEW or UPDATE |
| `src/components/ui/Badge.tsx` | UPDATE to v3.1 |
| `src/components/ui/Button.tsx` | UPDATE to v3.1 |
| `src/components/ui/Card.tsx` | UPDATE to v3.1 |
| `src/utils.ts` | Copy if missing |

> All types are INLINED in the component files. No import from `deskillz-web-sdk`
> or `bridge-types.ts` needed in standalone games.

### What Was Retired

| Item | Status |
|------|--------|
| `DeskillzUI.umd.js` | RETIRED — all games are React |
| `DeskillzUI.renderLobby()` | RETIRED |
| `DeskillzUI.showLobby()` | RETIRED |
| `DeskillzUI.hideLobby()` | RETIRED |
| `public/sdk/DeskillzUI.js` | RETIRED — delete from all game projects |

Non-React game migration: see `DESKILLZ_NON_REACT_MIGRATION_GUIDE.md`.

---

## 24. CRITICAL LESSONS REFERENCE

This section distills all lessons learned into actionable tables. No narrative.

### 24.1 SDK and Bridge

| # | Pitfall | Symptom | Fix |
|---|---------|---------|-----|
| 1 | Dynamic import of `@deskillz/web-sdk` | All methods return mock data, `sdk = null`, console: "SDK not available" | Use static import of embedded `DeskillzBridge.ts` |
| 2 | Wallet connect fake address | "Connected!" but guest mode | Use `window.ethereum` with `personal_sign` |
| 3 | Register calls `bridge.login()` | Username never saved | Call `bridge.register(username, email, password)` |
| 4 | Custom placeholder string | API key not injected by Cloud Build | Use exactly `'YOUR_API_KEY'` and `'YOUR_GAME_ID'` |
| 5 | Hardcoded initial balance `walletBalance: 1000` | False impression before API call | Initialize to `0`, fetch after auth |
| 6 | Stub handlers (profile, wallet, connect) | Features never functional | Wire every handler to bridge method from day one |
| 7 | `sendRealtimeMessage()` silently drops events | Multiplayer and spectator broken | Add generic `emit()` to RealtimeService for unhandled events |
| 8 | `bridge.isAuthenticated` (property) | TypeScript error | Use `bridge.getIsAuthenticated()` (method) |
| 9 | Multiple bridge instances | Duplicate sockets, race conditions | Singleton: always `getInstance()` |
| 10 | `DeskillzBridge.ts` modified per-game | Drift from canonical version | Never modify — replace wholesale on update |

### 24.2 Backend Data Formats

| # | Pitfall | Wrong | Correct |
|---|---------|-------|---------|
| 11 | Wallet total endpoint | `/wallet/total` (404) | `/wallet/balances` — compute total from `usdValue` sum |
| 12 | Users stats path | `/users/stats` (400) | `/users/:userId/stats` with UUID param |
| 13 | Leaderboard path | `/leaderboard` bare (404) | `/leaderboard/global` |
| 14 | CryptoCurrency enum | `'USDT'`, `'USDC'` | `'USDT_BSC'`, `'USDT_TRON'`, `'USDC_BSC'`, `'USDC_TRON'` |
| 15 | Visibility enum | `'PRIVATE_CODE'` (400) | `'PUBLIC_LISTED'` or `'UNLISTED'` |
| 16 | GameStatus enum | `'ACTIVE'` | `'APPROVED'` |
| 17 | Game image field | `game.imageUrl` | `game.iconUrl` |
| 18 | Host tier field | `data.tierInfo` | `data.esportsTierInfo` or `data.socialTierInfo` |
| 19 | Host earnings | `data.profile.totalEarnings` | `data.earnings.total` |
| 20 | Token storage key | `auth_token` | `deskillz_access_token` |
| 21 | Auth tokens nested | `result.tokens.accessToken` | `result.accessToken` (top-level, with fallback) |
| 22 | Prisma Decimal `.toFixed()` | Crashes — string not number | Wrap with `toNum()` helper |

### 24.3 Cloud Build and Vite

| # | Pitfall | Fix |
|---|---------|-----|
| 23 | `base: './'` inside `build: {}` | Move to top-level of `defineConfig` |
| 24 | Absolute paths `/assets/...` | Use `./assets/...` everywhere |
| 25 | `start_url: "/"` in manifest | Use `start_url: "./"` |
| 26 | `.env.local` exists during build | Delete before `npm run build` |
| 27 | Fallback `\|\| 'dev-key'` in bridge | Use `\|\| 'YOUR_API_KEY'` |
| 28 | Source maps included in ZIP | Add `-x '*.map'` to zip command |
| 29 | `node_modules/` in ZIP | Always exclude — bundle code instead |
| 30 | ESM `require()` error | Use `import`/`export`, or rename `.cjs` |

### 24.4 .env and Environment Variables

| # | Pitfall | Fix |
|---|---------|-----|
| 31 | BOM on `.env` file (PowerShell Out-File) | Create with `[System.IO.File]::WriteAllText(path, content, UTF8Encoding($false))` |
| 32 | Vite not reading `.env` after creation | Restart Vite (Ctrl+C, `npm run dev`) |
| 33 | Variables without `VITE_` prefix | All must start with `VITE_` |
| 34 | Testing `import.meta.env` in browser console | Only works inside module code, not console |

### 24.5 Game Logic (Social Games)

| # | Pitfall | Fix |
|---|---------|-----|
| 35 | Scores calculated but not applied | Apply `scoreResult.payments` to `player.totalScore` before emitting `onRoundEnd` |
| 36 | `advanceRound()` called after `onRoundEnd` | Call `advanceRound()` FIRST, then `onRoundEnd()` callback |
| 37 | `SocialGameManager` initialized on room join | Initialize AFTER successful buy-in |
| 38 | Host Dashboard access crashes | Use spread-merge safe defaults for all fields |
| 39 | Bust at 0 chips not caught | Call `mgr.processRoundResult()` in every game-end handler |

### 24.6 iOS PWA Install

| # | Pitfall | Fix |
|---|---------|-----|
| 40 | "Failed to Download" on iPhone | `start_url: "./"`, `scope: "./"` in manifest |
| 41 | SW scope mismatch | Register with `scope = new URL('./', location.href).pathname` |
| 42 | Precache absolute URLs | Use `'./'`, `'./index.html'`, `'./manifest.json'` |
| 43 | Missing `apple-mobile-web-app-capable` | Required for standalone install mode |
| 44 | iOS Chrome/Firefox cannot install | Instruct users: Safari only |

### 24.7 App.tsx Wiring Checklist (12 Required Items)

| # | Import | Must Wire | What Breaks If Missing |
|---|--------|-----------|----------------------|
| 1 | `useMultiplayer` | `useMultiplayer(bridge, engine, opts)` | No player join/leave/ready events |
| 2 | `useSpectator` | `useSpectator({ roomId, bridge, enabled })` | Spectator screen empty |
| 3 | `useAutoUpdater` | `useAutoUpdater({ gameId, ... })` | No update notifications |
| 4 | `useWallet` | `useWallet(bridge)` | Stale balance after transactions |
| 5 | `SocialGameManager` | `useRef<SocialGameManager>(null)` | No rake, no bust detection |
| 6 | `BalanceHUD` | `<BalanceHUD playerState={...} />` | No live chip display |
| 7 | `SpectatorView` | `<SpectatorView gameState={...} />` | No spectator rendering |
| 8 | `GameChat` | `<GameChat isOpen onSend />` | No in-game chat |
| 9 | `BuyInModal` | `<BuyInModal show onConfirm />` | Cannot buy into social games |
| 10 | `CashOutModal` | `<CashOutModal show onConfirm />` | Cannot cash out |
| 11 | `TournamentDetailModal` | `<TournamentDetailModal tournament />` | Cannot view details |
| 12 | `Toast + LoadingOverlay + ErrorModal` | Common UI overlays | No user feedback |

### 24.8 Service Worker Best Practices

Use `deskillz-sw.js` (NOT `sw.js`) to avoid Cloud Build Workbox overwrite:

```
public/deskillz-sw.js      <- Universal SW template from SDK (has __BUILD_HASH__ placeholder)
src/plugins/vite-plugin-sw-version.ts  <- Vite plugin stamps hash at build time
```

Build command (manual hash stamp -- Vite plugin cache workaround):
```powershell
npm run build
$hash = "{0}-{1}" -f ([System.DateTimeOffset]::Now.ToUnixTimeSeconds().ToString("x")), (Get-Random -Maximum 99999999).ToString("x8")
(Get-Content .\dist\deskillz-sw.js -Raw) -replace '__BUILD_HASH__', $hash | Set-Content .\dist\deskillz-sw.js -Encoding UTF8 -NoNewline
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

index.html registers `./deskillz-sw.js` (not `./sw.js`). No `confirm()` dialog.
Workbox generates `sw.js` separately -- the browser ignores it.

### 24.12 PWA Cache-Bust (v3.4.2)

| # | Pitfall | Fix |
|---|---------|-----|
| 58 | `sw.js` overwritten by Workbox generateSW | Name your SW `deskillz-sw.js` -- Workbox only generates `sw.js` |
| 59 | Old Workbox SW serves stale cached files | `deskillz-sw.js` with unique build hash purges old caches on activate |
| 60 | `confirm()` dialog blocks SW update | Remove confirm -- auto-reload on `updatefound` |
| 61 | Vite plugin `closeBundle` runs old cached code | Use PowerShell manual hash stamp after `npm run build` |
| 62 | `workbox-config.js` injectManifest ignored | Docker worker hardcodes `generateSW` -- rename approach is only fix |
| 63 | Browser disk cache serves old `index.html` | Network-first strategy in `deskillz-sw.js` for navigation requests |
| 64 | First-time fix for existing users | Clear site data or wait 24h for browser auto-update check |

### 24.9 Quick Play NPC Fill (Public UI Policy)

| Context | Correct Text | NEVER Say |
|---------|-------------|-----------|
| Player-facing UI | "Filling match..." | "bot", "AI", "NPC", "computer" |
| Internal code | `npc-filling` state | — |
| Console/debug logs | Any description | — |
| Developer docs | NPC fill mechanics | Expose in player UI |

### 24.10 React/Vite Specific (v3.1 / v3.2)

| # | Pitfall | Fix |
|---|---------|-----|
| 45 | `public/sdk/DeskillzUI.js` still in project | Delete it — the UMD bundle is retired |
| 46 | `DeskillzUI.renderLobby()` calls remaining | Remove — React handles routing |
| 47 | `DeskillzUI.showLobby()` / `hideLobby()` calls | Remove — use `navigate('/lobby')` |
| 48 | `QuickPlayCard` crashing inside lobby tab | `useNavigate` requires a Router context — use the `onMatchStart` callback instead |
| 49 | `@deskillz/game-ui` components unstyled | Custom Tailwind tokens not compiled — update to v3.1+ component files |
| 50 | `process is not defined` in game-ui build | Missing `define: { 'process.env.NODE_ENV': ... }` in vite.config.ts |
| 51 | Gameplay canvas wrong size in React | Set `canvas.width/height` in pixels inside `useEffect`, not just CSS |
| 52 | PixiJS "context already lost" on dev hot reload | Wrap `app.destroy()` in try-catch in cleanup function |
| 53 | QuickPlay hooks return null, no data loads | Missing `(window as any).DeskillzBridge = { getInstance: () => instance }` in main.tsx before ReactDOM.render() |

### 24.11 QuickPlay v3.2 Specific

| # | Pitfall | Fix |
|---|---------|-----|
| 54 | QuickPlay card blank for social game | Admin has not created QuickPlayConfig for this gameId — activate in admin panel |
| 55 | Point value dropdown shows nothing | `socialPointValueTiers` not set in config — check admin panel |
| 56 | Currency dropdown shows nothing | `socialCurrencies` not set in config — check admin panel |
| 57 | Available Games board always empty | `quick-play:lobby-update` socket not wired in DeskillzBridge — update to v3.1 bridge |
| 58 | "Create Game" does nothing | `window.DeskillzBridge` not set (see pitfall 53) or bridge.joinQuickPlay not implemented |
| 59 | Social game shows queue/searching state | Game configured as ESPORTS not SOCIAL — check gameCategory in admin QuickPlay config |
| 60 | Esport game shows social board | Game configured as SOCIAL not ESPORTS — check gameCategory in admin QuickPlay config |
| 61 | onMatchStart never fires for social game | Player must reach 'found' state — game needs enough players or NPC fill enabled |
| 62 | `useQuickPlayQueue` missing `createGame` | Old v3.1 hook — replace with v3.2 from SDK ZIP |

---

*Document End -- Version 5.10*
*Web engine: React/Vite only -- all standalone games*
*@deskillz/game-ui: v3.4.8 -- QuickPlayCard esport + social flows*
*Non-React migration: see DESKILLZ_NON_REACT_MIGRATION_GUIDE.md*
*Production Backend: https://newdeskillzgames-production.up.railway.app*
*For support: developer-support@deskillz.games*