# DESKILLZ WEB GAME DEVELOPER GUIDE

**Version:** 6.0
**Date:** September 2026
**Web SDK:** 3.7.0 (DeskillzBridge + @deskillz/game-ui)
**API:** https://api.deskillz.games (REST `/api/v1/...`, Socket.IO on the same host)
**Engine:** React + Vite (TypeScript)
**Unity / Unreal:** see the README in each SDK repo (section 1.3)

This guide replaces DESKILLZ_WEB_GAME_DEVELOPER_GUIDELINE v5.x. Version history
lives in CHANGELOG.md in the web-sdk repo.

---

## TABLE OF CONTENTS

**Part A -- Start here**
0. What changed in 6.0
1. Overview
2. Get the SDK
3. Architecture in one page

**Part B -- Integrate**
4. Project setup
5. Launch contract
6. Authentication and sessions
7. Scores and anti-cheat
8. Realtime
9. Screens you must build
10. Tournaments
11. Social games
12. Quick play
13. Wallet, leaderboard, profile and avatars
14. Auto-updater
15. Service worker and caching

**Part C -- Build and publish**
16. What goes in the upload zip
17. PWA manifest and icons
18. Cloud Build
19. Developer Portal
20. Hosted games, download page and Windows

**Part D -- Reference**
21. API endpoints
22. Socket events
23. Testing checklist
24. Troubleshooting
25. Critical lessons
26. Design tokens and limits

---

# PART A -- START HERE

## 0. WHAT CHANGED IN 6.0

Read this if your game already runs on SDK 3.5 or 3.6.

| Area | Before | Now (6.0 / SDK 3.7.0) |
|------|--------|------------------------|
| Where to get the SDK | "copy from the monorepo" or `npm install @deskillz/web-sdk` | GitHub Releases zip. The SDK is **not** on npm. |
| API host | `api.deskillz.games`, `ws.deskillz.games` and the Railway URL all appeared in docs | One host: `https://api.deskillz.games` and `wss://api.deskillz.games` |
| Check-in / no-show | "opens T-30, DQ at T-10" for every tournament | Window set per tournament (default 30 min); closes a few minutes before start (see 10.1) |
| Tournament lobby | Players waited on a site page | Players sit at the game table before start (`useLobbyTable`, section 10.2) |
| Service worker | `deskillz-sw.js` precached `./` | `./` removed from precache (a folder is not a fetchable file) |
| Auto-updater | Game-specific or missing | `useAutoUpdater` + public `latest-version` endpoint (section 14) |
| Cloud Build zip | `Compress-Archive` | `tar -a` (Compress-Archive writes backslash paths the build worker rejects) |
| Before upload | Build succeeded = done | Load-test the engine chunk, then run the stamp gate after publish (18.4, 18.5) |
| API reference tables | Several wrong paths | Regenerated from the backend (section 21) |

### 0.1 Upgrade checklist: 3.6.1 -> 3.7.0

Do these in order, in one commit, before the version bump:

1. Replace `src/sdk/DeskillzBridge.ts` and `public/deskillz-sw.js` with the 3.7.0
   release copies. Do not edit them afterwards.
2. Add `src/hooks/useLobbyTable.ts` from the release if your game hosts
   tournaments (all social games do).
3. Set the host in `.env.production` (section 4.4):
   `VITE_API_BASE_URL=https://api.deskillz.games` and
   `VITE_SOCKET_URL=wss://api.deskillz.games`. No `/lobby` suffix: the web
   bridge opens one socket on the main namespace, which carries match, room and
   quick-play events.
4. Replace any `Compress-Archive` line in your build notes with the `tar -a`
   command in section 18.1.
5. Bump `package.json` version, then build, load-test (18.4), zip, upload, stamp
   gate (18.5).

Builds already in players' hands keep working: the old Railway host stays online
as a fallback.

---

## 1. OVERVIEW

### 1.1 What a Deskillz web game is

A Deskillz web game is a React/Vite game that:

- runs the whole player journey inside the game: sign-in, lobby, tournaments,
  quick play, private rooms, wallet, results ("self-sufficient");
- talks to the same backend as every other Deskillz game, so a player's account,
  wallet, stats and leaderboard rank are shared across all games;
- is uploaded once as a zip and wrapped by Cloud Build into a **PWA**, an
  **Android APK** and a **Windows .exe**.

The same game can also be launched from deskillz.games (tournament check-in,
"Reopen table"); section 5 covers that launch contract.

### 1.2 Esport games vs social games

| | Esport | Social |
|---|---|---|
| Examples | Arcade, puzzle, match-3, runner | Big 2, Mahjong, Chinese 13-card poker |
| How players compete | Individual score, or 1v1 on a shared board | Seated at a 2-4 player table, hand by hand |
| Timing | Asynchronous or synchronous | Always synchronous |
| Money flow | Entry fee -> prize pool | Tournaments: entry fee -> prize pool. Cash tables: chips bought in crypto, host earns rake per hand |
| Result reported as | Signed score per player | Table result (winner, ranks, chip payments) from the host seat |
| Private rooms | Optional | Required (host-earns tables) |
| Extra files | None | SocialGameManager, MultiplayerManager, room and host screens (section 2.2) |

Both types share: accounts, wallet, tournaments, quick play, leaderboards,
disputes and Cloud Build.

**Seats.** Your game renders every seat the platform assigns the same way
(name, avatar, state from the table sync). Never branch game logic or UI on who
occupies a seat.

### 1.3 Web vs Unity vs Unreal

| | Web (this guide) | Unity | Unreal |
|---|---|---|---|
| SDK | DeskillzBridge (TypeScript) + @deskillz/game-ui | Deskillz Unity SDK 3.7.0 | Deskillz Unreal plugin 3.7.0 |
| Minimum | React + Vite | Unity 6 (6000.0+) | Unreal Engine 5.8 |
| Get it | github.com/Deskillz-Games/web-sdk/releases | github.com/Deskillz-Games-Development/unity-sdk/releases | github.com/Deskillz-Games-Development/unreal-sdk/releases |
| Output | Cloud Build: PWA, APK, Windows | Your own Android/iOS/desktop builds; a Unity **Web** build can also go through Cloud Build | Your own builds for any Unreal platform |
| Docs | This guide | unity-sdk README.md | unreal-sdk README.md |

All three use the same backend contract: launch-token exchange, HMAC-signed
scores, Socket.IO on `api.deskillz.games`, and the same `/api/v1` endpoints.

---

## 2. GET THE SDK

### 2.1 Download

1. Open **github.com/Deskillz-Games/web-sdk/releases** and download the latest
   `deskillz-web-sdk-<version>.zip`.
2. Unzip it next to your game. It contains:

```
deskillz-web-sdk-3.7.0/          Copy each folder into the same place in your game
  src/
    sdk/DeskillzBridge.ts        SDK-owned. Never edit.
    bridge-types.ts
    hooks/
      useLaunchDeepLink.ts       Launch contract (section 5)
      useTournamentLobby.ts      Tournament lifecycle
      useLobbyTable.ts           Seated tournament lobby (section 10.2)
      useEnrollmentStatus.ts     Register / check-in state
      useQuickPlayQueue.ts       Quick play queue
      useAutoUpdater.ts          Update prompt (section 14)
      useHostDashboard.ts        Social host dashboard
      useSpectator.ts            Spectating
    components/
      tournaments/               TournamentCard, TournamentLobbyCard, QuickPlayCard, DisputeModal
      rooms/                     BuyIn / CashOut / Rebuy modals, TurnTimer, RejoinModal, settings ...
      ui/                        Badge, Button, Card
    types/GameCapabilities.ts
    styles/tokens.css            Deskillz design tokens (import once in main.tsx)
    plugins/vite-plugin-sw-version.mjs   Keep the .mjs extension.
  public/
    deskillz-sw.js               SDK-owned. Never edit.
  templates/
    index.html                   Guarded service-worker registration block
    .env.production
  CHANGELOG.md
  DESKILLZ_WEB_GAME_DEVELOPER_GUIDE_v6_0.md
```

The SDK ships as **source files you copy into your game**, not as a compiled
package. Import them with relative paths, for example
`import TournamentCard from './components/tournaments/TournamentCard'`.
"@deskillz/game-ui" in this guide names that set of files.

There is no npm package. `npm install @deskillz/web-sdk` fails by design; the
`@deskillz` name on npm is reserved but unpublished.

**Ownership rule.** Everything copied from the release (bridge, hooks,
components, service worker) is replaced wholesale on every SDK release, so never
edit those files. If your game needs extra behaviour, extend the
bridge in your own file (`src/sdk/<YourGame>Bridge.ts`, section 4).

### 2.2 Required files by game type

`Y` = required, `opt` = optional, `-` = not used. "Release" means the file comes
from the SDK zip; "You" means you write it.

**SDK and build plumbing**

| File | Source | Esport | Social |
|------|--------|:------:|:------:|
| `src/sdk/DeskillzBridge.ts` | Release | Y | Y |
| `src/sdk/<YourGame>Bridge.ts` | You | opt | opt |
| `src/bridge-types.ts` | Release | Y | Y |
| `src/hooks/useLaunchDeepLink.ts` | Release | Y | Y |
| `src/hooks/useTournamentLobby.ts` | Release | Y | Y |
| `src/hooks/useEnrollmentStatus.ts` | Release | Y | Y |
| `src/hooks/useQuickPlayQueue.ts` | Release | Y | Y |
| `src/hooks/useLobbyTable.ts` | Release | opt | Y |
| `src/hooks/useAutoUpdater.ts` | Release | Y | Y |
| `src/hooks/useHostDashboard.ts` | Release | - | Y |
| `src/sdk/MultiplayerManager.ts` | You | sync modes only | Y |
| `src/sdk/SocialGameManager.ts` | You | - | Y |
| `public/deskillz-sw.js` | Release | Y | Y |
| `src/plugins/vite-plugin-sw-version.mjs` | Release | Y | Y |
| `public/manifest.json` + icons | You | Y | Y |
| `index.html` (guarded SW block) | Release template | Y | Y |
| `vite.config.ts` (`base: './'`, version define) | You | Y | Y |

**Screens** (components from `@deskillz/game-ui` in brackets)

| Screen | Esport | Social |
|--------|:------:|:------:|
| Auth (login, register, wallet connect) | Y | Y |
| Main menu / lobby | Y | Y |
| Tournament list [TournamentCard] | Y | Y |
| Tournament lobby, seated before start [TournamentLobbyCard] | opt | Y |
| Match lobby | Y | Y |
| Game | Y | Y |
| Results [DisputeModal] | Y | Y |
| Quick play [QuickPlayCard] | Y | Y |
| Profile | Y | Y |
| Wallet | Y | Y |
| Leaderboard | Y | Y |
| Disputes list + detail | Y | Y |
| How to play | Y | Y |
| Create private room [EsportGameSettings / SocialGameSettings] | opt | Y |
| Room lobby | opt | Y |
| Host dashboard | - | Y |
| Buy-in, cash-out, rebuy [BuyInModal, CashOutModal, RebuyModal] | - | Y |
| In-game chip HUD, round summary | - | Y |
| Turn timer [TurnTimer] | opt | Y |
| Low balance, pause request, age check [LowBalanceWarning, PauseRequestModal, AgeVerificationModal] | - | Y |
| Rejoin prompt [RejoinModal] | Y | Y |

A game that is only ever launched from deskillz.games (no in-game lobby) can
skip the lobby screens; section 9.3 lists the minimum.

### 2.3 Credentials

Every game has two credentials, both shown in the Developer Portal
(deskillz.games/developer) after the game is created:

| Credential | Used for | In code |
|------------|----------|---------|
| Game ID (UUID) | Identifies the game on every API call | `VITE_GAME_ID` |
| API key | Identifies your game to the platform; Cloud Build injects it (18.3) | `VITE_GAME_API_KEY` |

- In `.env.production` leave the placeholders `YOUR_GAME_ID` and `YOUR_API_KEY`.
  Cloud Build replaces those exact strings with the real values.
- For local development put the real values in `.env.local` (git-ignored) and
  delete it before building for Cloud Build.
- Never commit a real API key, and never log it.

---

## 3. ARCHITECTURE IN ONE PAGE

### 3.1 How your game talks to Deskillz

```
+---------------------------+        +----------------------------------+
|  YOUR GAME (React + Vite) |        |  DESKILLZ PLATFORM               |
|                           |  HTTPS |  https://api.deskillz.games      |
|  Screens, game logic      |------->|  REST  /api/v1/...               |
|        |                  |        |                                  |
|  @deskillz/game-ui        |  WSS   |  Socket.IO                       |
|  (cards, modals, hooks)   |<------>|   '/'       web bridge (all)     |
|        |                  |        |   '/lobby'  native SDK lobby     |
|  DeskillzBridge  ---------+        |                                  |
|  (the only API layer)     |        |  Shared accounts, wallets,       |
+---------------------------+        |  tournaments, leaderboards       |
                                     +----------------------------------+
         ^
         |  launch link (?matchId=&token=...)
+---------------------------+
|  deskillz.games (site)    |
+---------------------------+
```

- **All** network calls go through `DeskillzBridge`. Components never call
  `fetch` against the API themselves.
- The bridge handles tokens, token refresh, the launch-token exchange, score
  signing and the socket connection (with a fresh token on every reconnect).
- `@deskillz/game-ui` components receive data and callbacks from your screens;
  they never import the bridge directly.

### 3.2 Bridge-first pattern

```typescript
// main.tsx -- the ONLY place the bridge is created
import { DeskillzBridge } from './sdk/DeskillzBridge';
import { captureLaunchParams } from './hooks/useLaunchDeepLink';

captureLaunchParams();                          // 1. before React, before routing

const bridge = DeskillzBridge.getInstance({     // 2. create the singleton
  gameId:     import.meta.env.VITE_GAME_ID     || 'YOUR_GAME_ID',
  gameKey:    import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.deskillz.games',
  socketUrl:  import.meta.env.VITE_SOCKET_URL   || 'wss://api.deskillz.games',
  debug:      import.meta.env.VITE_ENABLE_DEBUG === 'true',
});

(window as any).DeskillzBridge = { getInstance: () => bridge };  // 3. shared hooks use this

await bridge.initialize();                      // 4. exactly once per page load
```

Rules:

- `initialize()` runs **once**. It is single-flight, but code that calls it on
  remount, hot reload or route change is a bug.
- Never call `DeskillzBridge.getInstance()` at module top level outside
  `main.tsx`; inside components use `window.DeskillzBridge.getInstance()`.
- Remove React `StrictMode` (it double-runs effects and breaks the launch flow).
- Fallback values must be the literal placeholders `'YOUR_GAME_ID'` and
  `'YOUR_API_KEY'`; any other string is invisible to Cloud Build injection.
- Never read an imported enum or constant at module top level in engine files
  (build a lookup inside a function instead). A top-level read can run before
  the module that defines it and crash the game at load (section 18.4).
---

# PART B -- INTEGRATE

## 4. PROJECT SETUP

### 4.1 File structure

Files marked SDK-owned come from the release zip (section 2.2). Every release
replaces them; never edit them in your game.

```
your-game/
  index.html                      From templates/index.html (4.2)
  vite.config.ts                  base './', version define, SW plugin (4.3)
  package.json                    "version" = the Cloud Build label (18.2)
  .env.production                 From templates/.env.production (4.4)
  public/
    deskillz-sw.js                SDK-owned
    manifest.json                 PWA manifest (section 17)
    assets/icons/ ...             Icons and splash screens (section 17)
  src/
    main.tsx                      Creates and initializes the bridge (3.2)
    App.tsx                       Your app root
    bridge-types.ts               SDK-owned
    sdk/
      DeskillzBridge.ts           SDK-owned
      <YourGame>Bridge.ts         Your extension (optional)
    hooks/                        SDK-owned
    components/                   SDK-owned (tournaments, rooms, ui)
    types/                        SDK-owned
    styles/tokens.css             SDK-owned
    plugins/
      vite-plugin-sw-version.mjs  SDK-owned (.mjs, never .ts)
    screens/ engine/ ...          Your game, including your realtime layer (section 8)
```

Extending the bridge:

```typescript
// src/sdk/YourGameBridge.ts
import { DeskillzBridge } from './DeskillzBridge';

export class YourGameBridge extends DeskillzBridge {
  // Add game-specific helpers here. Never edit DeskillzBridge.ts.
}
```

### 4.2 index.html

Start from `templates/index.html`. Keep every path relative (`./`). Register
the service worker with this exact block. It never reloads the page on
update, because a reload on a launch page burns the single-use launch token.
Your app decides when to show an update prompt (4.3, 5.4).

```html
<link rel="manifest" href="./manifest.json">
...
<div id="root"></div>
<script type="module" src="./src/main.tsx"></script>
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      var scope = new URL('./', window.location.href).pathname;
      navigator.serviceWorker.register('./deskillz-sw.js', { scope: scope })
        .then(function (reg) {
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', function () {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage({ type: 'SKIP_WAITING' });   // never location.reload()
              }
            });
          });
        })
        .catch(function (err) { console.warn('[SW] Failed:', err); });
    });
  }
</script>
```

### 4.3 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import { swVersionPlugin } from './src/plugins/vite-plugin-sw-version.mjs';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  base: './',                                   // required: R2 subfolder, APK WebView, Electron
  plugins: [react(), swVersionPlugin()],        // stamps a build hash into deskillz-sw.js
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
```

- `base` must be top-level `'./'`.
- The app version comes from `package.json`, never from `.env`. Pass it to
  `useAutoUpdater` as `currentVersion` (section 14):

```typescript
const updater = useAutoUpdater({
  gameId: import.meta.env.VITE_GAME_ID,
  currentVersion: import.meta.env.VITE_APP_VERSION,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
});
// updater.updateAvailable / updater.applyUpdate() -- your UI, your timing (5.4)
```

- A successful build prints
  `[sw-version] Stamped deskillz-sw.js with build hash: <stamp>`. Record the stamp;
  you need it for the stamp gate (18.5).

### 4.4 Environment variables and API host

`.env.production` (committed, identical shape for every game; copy it from
`templates/.env.production`):

```
VITE_GAME_ID=YOUR_GAME_ID
VITE_GAME_API_KEY=YOUR_API_KEY
VITE_API_BASE_URL=https://api.deskillz.games
VITE_SOCKET_URL=wss://api.deskillz.games
VITE_ENABLE_DEBUG=false
```

`.env.local` (git-ignored, local development only): real Game ID and API key.
Delete it before building for Cloud Build.

| Variable | Rule |
|----------|------|
| `VITE_API_BASE_URL` | Origin only, no `/api/v1` (the bridge adds it) |
| `VITE_SOCKET_URL` | Origin only, no path |
| `VITE_GAME_ID` / `VITE_GAME_API_KEY` | Literal placeholders in `.env.production`; Cloud Build fills them |

Only use `https://api.deskillz.games`. Do not hardcode any other Deskillz host.

### 4.5 Asset paths

| Asset lives in | Reference it as | Example |
|----------------|-----------------|---------|
| `public/` | `${import.meta.env.BASE_URL}path` | `${import.meta.env.BASE_URL}assets/audio/win.mp3` |
| `src/assets/` | a normal `import` | `import logo from './assets/logo.png'` |

Never use an absolute `/assets/...` path, and never write `"./assets/..."` as a
string in JSX for a `public/` file. Both break on the hosted PWA or in the APK.

---

## 5. LAUNCH CONTRACT

Players reach your game two ways: they open it directly (PWA, APK, Windows),
or deskillz.games launches it for a tournament table, a check-in lobby, or a
room. A launch is a URL with parameters; your game must read them exactly once.

### 5.1 Capture first, then initialize

```typescript
// main.tsx -- before any component renders
import { captureLaunchParams } from './hooks/useLaunchDeepLink';

captureLaunchParams();   // stashes matchId / tournamentId / roomCode and removes them from the URL
```

Then `bridge.initialize()` (in `main.tsx`, section 3.2) reads `token` from the URL:

- A **launch token** (single-use) is exchanged once through
  `POST /api/v1/auth/launch/exchange` for a game-scoped access token and a
  per-match score secret (section 7).
- The token is removed from the address bar after it is read. Other
  parameters stay for your game to read (5.2).
- A launch token expires **5 minutes** after it is issued. A failed exchange
  (expired, already used, offline) keeps any existing session; the player sees
  the normal signed-in or signed-out state. Get a fresh link with my-launch (5.3).

After the bridge is created, mount `useLaunchDeepLink` inside your router. It
waits until the bridge is authenticated, then navigates once per page load:

```tsx
import { useNavigate } from 'react-router-dom';
import { useLaunchDeepLink } from './hooks/useLaunchDeepLink';

function LaunchRouter({ isAuthenticated }: { isAuthenticated: boolean }) {
  const navigate = useNavigate();
  useLaunchDeepLink({ navigate, isAuthenticated });
  return null;
}
```

| Stashed id | Navigation (defaults) |
|------------|-----------------------|
| `matchId` | `navigate('/game', { state: { mode: 'tournament', matchData: { matchId, tournamentId }, fromDeepLink: true } })` |
| `roomCode` | `bridge.joinRoom(roomCode)`, then `navigate('/rooms/<roomId>')` |

Options: `gamePath` (default `'/game'`), `roomPath` (default
`(id) => '/rooms/' + id`), `tournamentMode` (default `'tournament'`),
`extraMatchData`, and `onBeforeNavigate(params)` (return `false` to cancel).
Read the stashed ids anywhere with `peekLaunchParams()`.

### 5.2 Launch parameters

| Parameter | Meaning | Read by |
|-----------|---------|---------|
| `token` | Single-use launch token | Bridge (automatic) |
| `matchId` | The table's match session | `captureLaunchParams` |
| `tournamentId` | Tournament the table belongs to | `captureLaunchParams` |
| `roomCode` | Private room to join | `captureLaunchParams` |
| `round`, `table` | Bracket round and table number | Your game (display) |
| `gameplayMode` | Game-specific mode (e.g. `EAST`, `EAST_SOUTH`, `FULL_WIND` for Mahjong) | Your game |
| `gameRuleVariant` | Game-specific rule set | Your game |
| `mahjongVariant` | Mahjong style (`HONG_KONG`, ...) | Mahjong-style games |
| `dur` | Match duration in seconds (timed esport modes) | Your game |
| `turnTimer` | Seconds per turn | Your game (overrides the menu default) |
| `lobby=1` | Open the seated tournament lobby instead of the table (10.2) | Your game, at module load |

Unknown or missing optional parameters: keep your game's menu default.

Read these parameters **once, at module load** (next to `captureLaunchParams`),
and keep them in memory. Router navigation (for example `navigate('/game')`)
drops the query string, so a screen that reads `window.location.search` on
mount gets nothing.

```typescript
// main.tsx or App.tsx, module level
const q = new URLSearchParams(window.location.search);
export const LAUNCH_OPTIONS = {
  gameplayMode: q.get('gameplayMode') ?? undefined,
  gameRuleVariant: q.get('gameRuleVariant') ?? undefined,
  durSeconds: Number(q.get('dur')) > 0 ? Number(q.get('dur')) : undefined,
  turnTimerSeconds: Number(q.get('turnTimer')) > 0 ? Number(q.get('turnTimer')) : undefined,
};
```

### 5.3 Re-fetching the launch: my-launch

`GET /api/v1/tournaments/:id/my-launch` returns the player's current state for a
tournament. Every call issues a fresh single-use token. Two shapes:

**Before the table is live** (`live: false`, check-in lobby):

| Field | Type |
|-------|------|
| `tournamentId` | string |
| `phase` | `CHECKIN` \| `SEATED` \| `ABORTED` |
| `scheduledStart`, `checkinOpensAt`, `checkinClosesAt` | ISO string or null |
| `tableSize` | number |
| `tableNumber` | number (optional) |
| `lobbyLink` | URL with a single-use lobby token, or null (optional) |
| `me` | `{ userId, checkedIn, seatNumber? }` |
| `roster` | `[{ userId, username, avatarUrl, checkedInAt, seatNumber? }]` |
| `abortReason` | `CANCELLED` \| `DQ_NO_SHOW` \| `NOT_REGISTERED` \| `ENDED` (optional) |

**When the table is live** (`live: true`):

| Field | Type |
|-------|------|
| `matchId`, `token` | string (fresh single-use token) |
| `webLink` | Full launch URL for the web build (5.2 parameters), or null if the game has no hosted build |
| `deepLink` | `<scheme>://match?id=...&token=...` for native builds, or null |
| `tournamentId`, `roundNumber`, `tableNumber` | |
| `gameName`, `gameSlug`, `gameplayMode`, `gameRuleVariant`, `mahjongVariant` | |
| `hostUserId` | string or null: the seat that runs the game engine (8.2) |
| `players` | `[{ id, username, seatNumber }]` seat order for the table |

```typescript
const launch = await bridge.getMyLaunch(tournamentId);   // null for guests or on error
if (launch?.live && launch.webLink) window.location.replace(launch.webLink);
```

The socket event `match:launch` means "a table just went live for you". It
carries the same live fields; treat it as a signal to call my-launch again
(`useLobbyTable` does this for you, 10.2).

### 5.4 Launch-page rules

1. Never call `location.reload()` while a launch is in progress or a match is
   active. It burns the token, drops the score secret (7.2) and strands the
   player.
2. `useAutoUpdater` only reports that an update exists. Its `applyUpdate()`
   reloads the page. Never show the update prompt or call `applyUpdate()` on a
   launch page or during a match; show it on your menu or results screen.
3. At match end: submit the result (section 7), then return the player to your
   results screen or to deskillz.games. Never reload into a fresh session.

---

## 6. AUTHENTICATION AND SESSIONS

### 6.1 Sign-in methods

```typescript
const bridge = window.DeskillzBridge.getInstance();

await bridge.login(email, password);                  // email + password
await bridge.register(username, email, password);     // new account

// Wallet (sign-in with Ethereum)
const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
const sign = (msg: string) =>
  window.ethereum.request({ method: 'personal_sign', params: [msg, address] });
await bridge.loginWithWallet(address, 56, sign);      // 56 = BNB Chain

await bridge.logout();
```

- Use `register()` only for new accounts and `login()` only for existing ones.
- Always pass the `sign` function to `loginWithWallet`. Without it the bridge
  signs the player in as a guest, not as their wallet account.

### 6.2 Session state

| Call | Returns |
|------|---------|
| `bridge.getIsAuthenticated()` | `true` once the player is signed in (including guest) |
| `bridge.isLive` | `true` when signed in and not a guest |
| `bridge.getCurrentUser()` | `DeskillzUser` or null |
| `bridge.on('authenticated', fn)` / `bridge.on('logout', fn)` | Unsubscribe function |

- Tokens are stored per game (keyed by Game ID), so two Deskillz games on the
  same origin never share or overwrite a session.
- A direct sign-in (6.1) refreshes its access token automatically. A session
  opened from a launch link is scoped to that browser tab and that match; when
  it ends, send the player back through deskillz.games or your sign-in screen.
- The socket reconnects with the current token every time.
- Check `bridge.isLive` before showing paid features. Guest mode keeps scores
  local.
- Wallet: call `bridge.getWalletBalance()` after sign-in (returns
  `{ total, currency, balances: [{ currency, amount, usdValue }] }`). The
  `walletUpdated` event fires each time the bridge refreshes the balance
  (`getWalletBalance`, `deposit`, `withdraw`); show 0 until the first result.

### 6.3 Resume after a crash

On `initialize()` the bridge checks for an unfinished room session and emits
`roomReconnect` with:

`{ roomId, roomCode, roomName, gameCategory, gameId, gameName, deepLink, launchToken, tokenExpiresAt, isReissued }`

Mount the shared prompt once at the app root:

```tsx
import RejoinModal, { useRejoinModal } from './components/rooms/RejoinModal';

const rejoin = useRejoinModal({ bridge });   // optional: onNavigate: (deepLink) => ...
return (<>
  <Routes>...</Routes>
  <RejoinModal
    payload={rejoin.payload}
    onConfirm={rejoin.onConfirm}
    onDismiss={rejoin.onDismiss}
  />
</>);
```

- By default, confirming opens `deepLink` in the current page. Pass
  `onNavigate` to route inside your app instead.
- `rejoin.recheck()` runs the check on demand (e.g. a "Resume last game"
  button); `rejoin.isChecking` is true while it runs.

---

## 7. SCORES AND ANTI-CHEAT

### 7.1 Submitting a result

Always submit through the bridge. Never call the score endpoints with your own
`fetch`.

```typescript
await bridge.submitScore({
  gameId: bridge.getConfig().gameId,
  tournamentId,          // from peekLaunchParams() for tournament matches
  score: finalScore,
  metadata: { moves, durationMs },   // optional, stored with the result
});
```

| Mode | Call | Endpoint (bridge-internal) |
|------|------|----------------------------|
| Tournament match | `submitScore({ tournamentId, ... })` | `POST /api/v1/tournaments/:id/score` |
| Private esport room | `submitScore({ roomId, ... })` (or the room the bridge joined) | `POST /api/v1/private-rooms/:roomId/score` |
| Quick play match | `submitQuickPlayScore(matchId, score)` | `POST /api/v1/lobby/quick-play/match/:matchId/score` |
| Social table | Host reports the table result (section 11) | |

### 7.2 How signing works

- The launch exchange (5.1) gives the bridge a **score secret** for that player
  and match. It lives only in memory for the current page load.
- Tournament scores are signed with HMAC-SHA256 over
  `gameId:matchId:score:timestamp:userId` and sent with `matchId`, `timestamp`
  and `signature`.
- The server verifies the signature. Unsigned or invalid submissions can be
  rejected, so always build as if verification is enforced.
- A page reload loses the secret, and the score after it goes out unsigned.
  This is one more reason for launch-page rule 1 (5.4).

Rules:

- Submit **once** per player per match.
- Never log, store or send the score secret or your API key yourself.
- The final score is the only thing sent; keep checkpoints local.

---

## 8. REALTIME

### 8.1 Connection

- One Socket.IO v4 connection to `VITE_SOCKET_URL` (`wss://api.deskillz.games`),
  opened by the bridge (WebSocket, polling fallback, 10 reconnect attempts).
- Every connect and reconnect sends the current access token.
- Add `socket.io-client` (^4.7) to your game's dependencies:
  `npm install socket.io-client`. The bridge loads it on demand; without it,
  realtime is silently disabled.

```typescript
bridge.connectRealtime();
const off = bridge.onRealtimeEvent('match:launch', (data) => { /* ... */ });
bridge.sendRealtimeMessage('match:relay', { matchId, event: 'game:state', payload });
bridge.isRealtimeConnected;   // boolean
off();                        // unsubscribe
```

### 8.2 Synchronous tables (match room + relay)

Players at the same table share state through the match room. Your game owns
its realtime layer (for example a `MultiplayerManager` class in your `src/`)
and must follow this protocol exactly:

1. **Join** with an acknowledgement, only after the socket is connected:
   `match:join_room { matchId }` -> ack `{ success: true }` or `{ error }`.
   Only players seated at that table are accepted. Never emit the join into a
   disconnected socket; wait for the connection first.
2. **Retry** a join that times out (bounded, e.g. 3 attempts with a short
   delay). Give every join attempt a generation number and ignore acks from
   older attempts.
3. **Relay** game messages: `match:relay { matchId, event, payload }`. The server
   forwards `payload` as `event` to everyone else in the room. Only these events
   are relayed:

| Event | Typical use |
|-------|-------------|
| `game:state` | Host broadcasts the authoritative table state |
| `game:hand` | Host sends a player their private hand |
| `game:action` | A player's move to the host |
| `game:round-end`, `game:game-end` | Host announces results |
| `game:request-sync` | Client asks the host for the current state |
| `game:round-ready`, `game:round-ready-state` | Ready-up between rounds |
| `game:chat` | Table chat |
| `game:ping`, `game:pong` | Latency check |

   Any other event name is rejected.
4. **Leave** with `match:leave_room { matchId }` when the player exits.
5. **Host authority.** The host is the seat whose user id equals `hostUserId`
   from my-launch or `match:launch` (5.3). Never elect a host on the client.
   The host runs the game engine and is the only sender of `game:state`,
   `game:hand`, `game:round-end` and `game:game-end`. Other seats send
   `game:action` and render what the host sends. Private information (hands,
   tiles) goes only to its owner.
6. **Broadcast after the turn advances.** The host sends `game:state` only after
   the engine has moved the turn to the next seat, so every frame names the
   player who must act now.
7. **Reconnect.** After a reconnect, re-join the room and send
   `game:request-sync`; the host answers with `game:state` (and that player's
   `game:hand`).

### 8.3 Server-authoritative 1v1 board

Most esport games need nothing beyond scores (section 7) and, optionally, the
relay (8.2). A 1v1 game can instead let the server run the board, so neither
client can alter it. This requires a board engine for your game on the
Deskillz platform, built with the Deskillz developer team, and a `DUEL_1V1`
tournament; for any other game or mode the server refuses the session. Contact
developer support before designing for it.

When enabled, the game uses the board channel instead of the relay:
`board:join`, `board:move`, `board:sync_request`, `board:leave` (client to
server) and `board:state`, `board:start`, `board:applied`, `board:rejected`,
`board:sync`, `board:presence`, `board:end` (server to client). Apply a move
locally only after `board:applied`.

Full socket event reference: section 22.
---

## 9. SCREENS YOU MUST BUILD

### 9.1 Required screens and shared components

The screen list per game type is in section 2.2. Build your own screens and
compose the shared components from the release inside them; never rebuild a
tournament card, quick play card, dispute form or room modal from scratch.

| Component / hook | Import from | Used on |
|------------------|-------------|---------|
| `TournamentCard` + `useEnrollmentStatus` | `./components/tournaments/TournamentCard`, `./hooks/useEnrollmentStatus` | Tournament list (10.1) |
| `useLobbyTable` | `./hooks/useLobbyTable` | Seated tournament lobby (10.2) |
| `QuickPlayCard` + `useQuickPlayQueue` | `./components/tournaments/QuickPlayCard`, `./hooks/useQuickPlayQueue` | Quick play (section 12) |
| `DisputeModal` | `./components/tournaments/DisputeModal` | Results, match history |
| `SocialGameSettings` / `EsportGameSettings` | `./components/rooms/...` | Create private room (11.3) |
| `BuyInModal`, `CashOutModal`, `RebuyModal`, `LowBalanceWarning`, `TurnTimer`, `PauseRequestModal`, `AgeVerificationModal` | `./components/rooms/...` | Social tables and rooms |
| `useHostDashboard`, `getTierDisplay` | `./hooks/useHostDashboard` | Host dashboard (11.6) |
| `RejoinModal` + `useRejoinModal` | `./components/rooms/RejoinModal` | App root (6.3) |

**Dependencies.** The shared components are React function components styled
with Tailwind utility classes. Add these to your game:

| Package | Version tested |
|---------|----------------|
| `react`, `react-dom` | 18.x |
| `tailwindcss` | 3.4+ or 4.x |
| `framer-motion` | 10.x or later |
| `lucide-react` | 0.383 or later |
| `react-hot-toast` | 2.4+ (mount one `<Toaster />` at the app root) |
| `socket.io-client` | 4.7+ (section 8.1) |

Tailwind must scan the SDK folders or the components render unstyled:

```javascript
// tailwind.config.js (Tailwind 3)
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
```

Import the design tokens once in `main.tsx`: `import './styles/tokens.css';`

### 9.2 Guest guards and lobby tabs

A guest (not signed in) may play offline practice only. Everything that touches
money, rankings or other players is guarded: blur it and show a sign-in button.

```tsx
function GuestGuard({ isGuest, onLogin, children }: {
  isGuest: boolean; onLogin: () => void; children: React.ReactNode;
}) {
  if (!isGuest) return <>{children}</>;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none' }}>{children}</div>
      <button onClick={onLogin} style={{ position: 'absolute', inset: 0, margin: 'auto' }}>
        Log in to play for prizes
      </button>
    </div>
  );
}

const isGuest = !bridge.isLive;
<GuestGuard isGuest={isGuest} onLogin={() => navigate('/auth')}>
  <QuickPlaySection />
  <TournamentsSection />
  <RoomsSection />
</GuestGuard>
<PracticeSection />   {/* not guarded */}
```

Recommended lobby tabs:

```
[Tournaments]    TournamentCard list (10.1)
[Quick Play]     QuickPlayCard (section 12)
[Private Rooms]  Create / join a room (11.3, 11.4)
[Host]           Host dashboard (11.6) -- social games
```

### 9.3 Lobby mode minimum (launched from deskillz.games only)

A game that players only ever reach through a deskillz.games launch link can
skip auth, lobby, tournament list, wallet and profile screens. It still needs:

1. `index.html`, `vite.config.ts`, `.env.production` and the service worker
   exactly as in section 4.
2. `main.tsx`: `captureLaunchParams()`, create the bridge, `initialize()`
   (section 3.2).
3. Launch parameters read at module load (5.2), then `useLaunchDeepLink`
   routing to your game screen (5.1).
4. The seated tournament lobby when the URL has `lobby=1` (10.2).
5. The match itself, with realtime (section 8) for synchronous play.
6. Result reporting: `bridge.submitScore` for esport (section 7) or the host's
   table result for social tables (11.1).
7. A results screen with `DisputeModal`, and a button that returns the player
   to `https://deskillz.games`.
8. `RejoinModal` at the app root (6.3).

---

## 10. TOURNAMENTS

### 10.1 Registration, check-in and no-shows

```
Registration open      Player registers                    status REGISTERED
Check-in opens         start - checkinWindowMinutes        status CHECKIN_OPEN
Check-in closes        start - buffer (see below)          no-shows: DQ_NO_SHOW
Start                  Tables go live                      status IN_PROGRESS
```

| Rule | Value |
|------|-------|
| Check-in window | Set per tournament, 5 to 60 minutes (default 30) |
| Check-in closes | `start - clamp(floor(window / 3), 1, 10)` minutes (default window: 10 minutes before start) |
| Player who does not check in | Disqualified (`DQ_NO_SHOW`); the entry is forfeited, no refund |
| Tournament cancelled | Entries are refunded (10.3) |

Show the tournament list with one `TournamentCard` per tournament and one
`useEnrollmentStatus` per card:

```tsx
import TournamentCard from './components/tournaments/TournamentCard';
import { useEnrollmentStatus } from './hooks/useEnrollmentStatus';

function TournamentRow({ listing, onJoin }: { listing: TournamentListing; onJoin: (id: string) => void }) {
  const enrollment = useEnrollmentStatus(listing.id);
  const tournament = useMemo(() => mapListing(listing), [listing]);   // your mapper to the card's Tournament type
  return (
    <TournamentCard
      tournament={tournament}
      userStatus={enrollment.status}
      dqCountdown={enrollment.dqCountdown}
      enrollmentLoading={enrollment.loading}
      onRegister={() => enrollment.register()}
      onCheckIn={() => enrollment.checkIn()}
      onLeave={() => enrollment.leave()}
      onJoin={onJoin}
    />
  );
}

const listings = await bridge.getTournaments();   // this game's tournaments
```

`useEnrollmentStatus(tournamentId, { pollIntervalMs? })` returns
`{ status, dqCountdown, loading, error, register, checkIn, leave, refresh }`.
It updates immediately after `register()`, `checkIn()` and `leave()`, and
otherwise polls every 60 seconds (pass a smaller `pollIntervalMs` on a
check-in screen). `dqCountdown` is the seconds left until check-in closes.

| `status` | Card shows |
|----------|-----------|
| `NOT_REGISTERED` | Register |
| `REGISTERED` | Registered (check-in opens at ...) |
| `CHECKIN_OPEN` | Check in now + countdown |
| `CHECKED_IN` | Checked in |
| `STARTING` / `IN_PROGRESS` | Enter the table |
| `COMPLETED` | Results |
| `DQ_NO_SHOW` | Missed check-in (entry forfeited) |
| `STANDBY` | On the standby list |
| `CANCELLED` | Cancelled |

Bridge methods behind the hook:

| Method | Endpoint |
|--------|----------|
| `bridge.getTournaments(filters?)` | `GET /api/v1/tournaments?gameId=...` |
| `bridge.registerTournament(id)` | `POST /api/v1/tournaments/:id/register` |
| `bridge.checkInTournament(id)` | `POST /api/v1/tournaments/:id/checkin` |
| `bridge.leaveTournament(id)` | `DELETE /api/v1/tournaments/:id/leave` |
| `bridge.getEnrollmentStatus(id)` | `GET /api/v1/tournaments/:id/my-status` |
| `bridge.getMyRegistrations()` | `GET /api/v1/tournaments/my-registrations` |
| `bridge.getTournamentSchedule(id)` | `GET /api/v1/tournaments/:id/schedule` |

### 10.2 Seated tournament lobby

Checked-in players wait at your game's table before start. deskillz.games opens
your game with `?tournamentId=...&lobby=1&token=...` (5.2). Detect `lobby=1`
at module load, then render a lobby screen driven by `useLobbyTable`:

```tsx
// module load (next to captureLaunchParams)
const LOBBY_ENTRY = new URLSearchParams(window.location.search).get('lobby') === '1';
```

```tsx
import { useLobbyTable, fmtCountdown, LOBBY_ABORT_COPY } from './hooks/useLobbyTable';

function TournamentLobbyScreen({ tournamentId }: { tournamentId: string }) {
  const bridge = window.DeskillzBridge.getInstance();

  const { state, countdown, aborted } = useLobbyTable({
    fetchState: async () => {
      const s = await bridge.getMyLaunch(tournamentId);
      if (!s) throw new Error('my-launch unavailable');   // the hook backs off and retries
      return s;
    },
    onFastPath: (pollNow) => {
      if (!bridge.isRealtimeConnected) bridge.connectRealtime();
      return bridge.onRealtimeEvent('match:launch', () => pollNow());
    },
    onLive: (live) => {
      if (live.webLink) window.location.replace(live.webLink);   // same tab, fresh token
      else window.location.replace('https://deskillz.games/tournaments/' + tournamentId);
    },
  });

  if (aborted) return <AbortCard text={LOBBY_ABORT_COPY[aborted] ?? LOBBY_ABORT_COPY.UNKNOWN} />;
  // Render your table art with state.roster; empty seats show "Waiting..."
  // countdown.label: 'lockIn' (until seats lock) | 'dealIn' (until start) | 'starting'
  return <LobbyTable roster={state?.roster ?? []} text={countdown ? fmtCountdown(countdown.msLeft) : '--:--'} />;
}
```

| Hook behaviour | Detail |
|----------------|--------|
| Polling | my-launch every 5 s (one request at a time); on error backs off x1.5 up to 15 s |
| Fast path | `match:launch` triggers an immediate poll |
| Deadline passed, phase unchanged | Polls every 1.5 s and reports `starting` |
| `onLive` | Fires exactly once with the live payload (5.3) |
| `aborted` | `CANCELLED`, `DQ_NO_SHOW`, `NOT_REGISTERED` or `ENDED` |

Lobby screen rules:

- Render only. Do not start the game engine or realtime match code on the
  lobby screen; the live table loads fresh from `webLink`.
- Countdown targets come from server timestamps (`checkinClosesAt`,
  `scheduledStart`), never from a local timer.
- Seat order: in `SEATED` phase use `roster[].seatNumber`; in `CHECKIN` phase
  order by `checkedInAt`.
- Draw every occupied seat the same way (name, avatar).

### 10.3 Cancelled tournaments

A tournament can be cancelled before it completes (for example when it does not
reach its minimum players at start). What your game sees:

| Where | Value |
|-------|-------|
| `bridge.getTournaments()` / tournament `status` | `CANCELLED` |
| my-launch (lobby) | `phase: 'ABORTED'`, `abortReason: 'CANCELLED'` |
| `useLobbyTable` | `aborted === 'CANCELLED'` |

Entry fees are refunded to the player's Deskillz wallet (on-chain entries
through the escrow contract). There is no separate socket event: refresh the
list, and let the lobby hook report the abort.

### 10.4 Esport match modes

A tournament's `esportMatchMode` tells your game how the match is played:

| Mode | Play | Result |
|------|------|--------|
| `ASYNC` | Each player plays alone before the deadline | `submitScore` per player (7.1) |
| `SINGLE_PLAYER` | Solo score attack | `submitScore` |
| `SYNC` | Players play at the same time | `submitScore` per player; realtime relay optional (8.2) |
| `BLITZ_1V1` | Short real-time 1v1 (`dur` seconds) | `submitScore` per player |
| `DUEL_1V1` | Full real-time 1v1 (`dur` seconds) | `submitScore` per player |
| `TURN_BASED` | Players alternate turns | `submitScore` per player |

- The modes your game offers are set in the Developer Portal (Game capabilities,
  11.3). The mode arrives on the launch link as `gameplayMode` (5.2).
- Social games always use `SYNC`; the platform rejects any other mode.

---

## 11. SOCIAL GAMES

Social games (Big 2, Mahjong, Chinese 13-card poker and similar) seat 2-4
players at one table. One seat, the host (`hostUserId`, 8.2), runs the game
engine; the table plays hand by hand over the match room. Your game owns this
layer (a multiplayer manager and a chip/session manager in your `src/`).

### 11.1 Reporting a tournament table result

When a table game finishes, the **host** reports one result for the table.
Other seats never report. Add the call to your bridge subclass (the bridge's
`http` client is available to subclasses):

```typescript
// src/sdk/YourGameBridge.ts
export interface TableScore { userId: string; score: number; rank?: number }

export class YourGameBridge extends DeskillzBridge {
  async reportTableResult(matchId: string, winnerId: string, winnerScore: number, scores: TableScore[]) {
    return this.http.post(`/api/v1/tournaments/matches/${encodeURIComponent(matchId)}/result`, {
      winnerId, winnerScore, scores,
    });
  }
}
```

| Field | Rule |
|-------|------|
| `winnerId` | User id of a player seated at this table |
| `winnerScore` | The winner's score for this game |
| `scores` | Every seat: `{ userId, score, rank }`; losing scores may be negative |
| Who may call | Only a player seated at the table (the host seat) |
| Repeats | One call per table game. A second call returns an "already completed" error; treat it as success |

The platform handles best-of-N rounds, bracket advancement, prizes and payouts.

### 11.2 Host engine rules

- **Validate wins through your scorer.** Offer or accept a winning declaration
  only when your scoring engine confirms the hand meets the table's rules (for
  example a minimum score). A rejected declaration returns false and the hand
  continues; it never ends the hand for the table.
- **Apply payments before you announce them.** Update every player's total,
  then broadcast the round result:

```typescript
for (const p of scoreResult.payments) {
  players[p.to].total   += p.amount;
  players[p.from].total -= p.amount;
}
broadcastRoundEnd({
  winnerId,
  playerScores: players.map((p) => ({ id: p.id, seat: p.seat, change: changes[p.seat] ?? 0, total: p.total })),
});
```

- **Timers.** Use the tournament's `turnTimer` (5.2) for turns and for any
  claim or response window.
- **Broadcast after the turn advances** (8.2 rule 6).

### 11.3 Room settings: capabilities and defaults

The create-room form uses the shared settings components. Their options come
from two Developer Portal settings, fetched through the bridge:

```tsx
import SocialGameSettings, { createDefaultSocialGameConfig, type SocialGameConfig } from './components/rooms/SocialGameSettings';
import { DEFAULT_CAPABILITIES, type GameCapabilities } from './types/GameCapabilities';

const [caps, setCaps] = useState<GameCapabilities>(DEFAULT_CAPABILITIES);
const [config, setConfig] = useState<SocialGameConfig>(() => createDefaultSocialGameConfig());

useEffect(() => {
  bridge.getGameCapabilities().then(setCaps);                 // GET /api/v1/games/:gameId
  bridge.getQuickPlayConfig(bridge.getConfig().gameId)        // GET /api/v1/quick-play/games/:gameId
    .then((qp) => { if (qp) setConfig(createDefaultSocialGameConfig(undefined, undefined, qp)); });
}, []);

return <SocialGameSettings config={config} onChange={setConfig} capabilities={caps} />;
```

| Factory | Signature |
|---------|-----------|
| `createDefaultSocialGameConfig` | `(gameType?, capabilities?, qpConfig?)` |
| `createDefaultEsportGameConfig` | `(capabilities?, qpConfig?)` |

- `qpConfig` may be `null` (no Quick Play settings yet); the factories fall back
  to built-in defaults. Defaults seed the form; the host can change any field.
- `EsportGameSettings` works the same way for esport rooms.

`GameCapabilities` (all set in the Developer Portal, never hardcoded):

| Field | Meaning |
|-------|---------|
| `supports1v1`, `supportsFFA`, `supportsSinglePlayer` | Player modes |
| `supportsSync`, `supportsAsync`, `supportsBlitz1v1`, `supportsDuel1v1`, `supportsSinglePlayerMode`, `supportsTurnBased` | Match modes (10.4) |
| `supportsSingleElimination`, `maxTournamentSize` | Bracket support and size |
| `minPlayers`, `maxPlayers` | Players per match |
| `minMatchDurationSeconds`, `maxMatchDurationSeconds` | Duration limits (0 = none) |

### 11.4 Private social rooms

| Step | Call |
|------|------|
| Create | `bridge.createSocialRoom({ name, gameType, pointValue, currency, minPlayers, maxPlayers, rakePercent, rakeCap, minBuyIn, maxBuyIn, turnTimerSeconds, visibility, hostRole })` |
| Join by code | `bridge.joinRoom(roomCode)` |
| Browse public rooms | `bridge.getPublicRooms()` |
| Invite | `bridge.invitePlayer(roomId, { username })`, `bridge.getMyInvites()`, `bridge.respondToInvite(inviteId, accept)` |
| Buy in | `bridge.roomBuyIn(amount, currency)` -- always pass the chain-qualified currency (11.6) |
| Start (host) | `bridge.startRoom(roomId)` |
| Cash out | `bridge.roomCashOut()` |
| Leave | `bridge.leaveRoom()` |

- Hosting requires age verification: `bridge.checkAgeVerified()`, then
  `AgeVerificationModal` and `bridge.verifyAge()`.
- `gameType`: `BIG_TWO`, `MAHJONG` or `CHINESE_POKER_13`.
- `hostRole`: `PLAYER` (takes a seat) or `SPECTATOR` (hosts without playing).

### 11.5 Cash tables

Cash tables are always-open tables configured in the Developer Portal. Players
sit down with a buy-in, play hands, and leave with their chips. Add these calls
to your bridge subclass:

| Action | Endpoint | Body |
|--------|----------|------|
| List table configs | `GET /api/v1/persistent-cash-games/game/:gameId` | |
| My current seat | `GET /api/v1/persistent-cash-games/my-seat/:gameId` | |
| Sit down | `POST /api/v1/persistent-cash-games/:configId/seat` | `{ buyInAmount }` |
| Table details | `GET /api/v1/persistent-cash-games/tables/:tableId` | |
| Report a hand | `POST /api/v1/persistent-cash-games/tables/:tableId/hand-result` | `{ handNumber, potSize, results: [{ userId, pointsDelta, isWinner? }], winnerId? }` |
| Rebuy | `POST /api/v1/persistent-cash-games/tables/:tableId/rebuy` | `{ buyInAmount }` |
| Leave and cash out | `POST /api/v1/persistent-cash-games/tables/:tableId/leave` | |

```typescript
// src/sdk/YourGameBridge.ts
reportHand(tableId: string, body: { handNumber: number; potSize: number;
  results: Array<{ userId: string; pointsDelta: number; isWinner?: boolean }>; winnerId?: string }) {
  return this.http.post(`/api/v1/persistent-cash-games/tables/${encodeURIComponent(tableId)}/hand-result`, body);
}
```

- Only a player seated at the table may report a hand; the host seat reports
  once per hand.
- The platform applies the rake and settles the table when its end condition
  is reached.
- Always call these through the bridge's `http` client. Never build the URL
  from `window.location` or call `fetch` yourself: a hosted game runs on a
  different origin from the API.

### 11.6 Host dashboard and currencies

```tsx
import { useHostDashboard, getTierDisplay } from './hooks/useHostDashboard';

const host = useHostDashboard();   // polls every 60 s
// host.activeTier, host.activeTierDisplay, host.totalEarnings, host.monthlyEarnings,
// host.pendingSettlement, host.activeRooms, host.badges, host.levelInfo
// host.refresh(), host.verifyAge(), host.requestWithdrawal(amount, currency, walletAddress)
```

Use the hook; it maps the raw dashboard response safely. Do not read
`bridge.getHostDashboard()` fields directly in screens.

Currencies are always chain-qualified. Show a chain selector for USDT and USDC:

| UI selection | Value sent |
|--------------|------------|
| BNB | `BNB` |
| USDT on BNB Chain | `USDT_BSC` |
| USDT on Tron | `USDT_TRON` |
| USDC on BNB Chain | `USDC_BSC` |
| USDC on Tron | `USDC_TRON` |

Never send plain `USDT` or `USDC`; the platform rejects them.

---

## 12. QUICK PLAY

Quick play puts a player into a match in one tap, using the tiers set in the
Developer Portal (Quick Play tab).

### 12.1 The card and the hook

```tsx
import QuickPlayCard from './components/tournaments/QuickPlayCard';
import { useQuickPlayQueue } from './hooks/useQuickPlayQueue';

export default function QuickPlayScreen() {
  const bridge = window.DeskillzBridge.getInstance();
  const qp = useQuickPlayQueue(bridge.getConfig().gameId);
  const navigate = useNavigate();
  return (
    <QuickPlayCard
      qp={qp}
      onMatchStart={(matchData) => navigate('/game', { state: { mode: 'quickplay', matchData } })}
    />
  );
}
```

The card renders every state and calls the bridge itself; your code only
navigates. `onMatchStart` receives
`{ matchId, matchSessionId, gameId, deepLink, token, entryFee, currency, prizePool, players: [{ id, username }], matchDurationSecs }`.

| `qp.status` | Esport | Social |
|-------------|--------|--------|
| `idle` | Entry fee, player count, currency, Play Now | Point value, currency, open games board, Create game |
| `searching` | In the queue, elapsed timer, Cancel | |
| `waiting` | | Your game is open, seats filling, Cancel |
| `filling` | Table filling | Table filling |
| `found` | Match found; `onMatchStart` fires | Match found; `onMatchStart` fires |
| `error` | Message + Try again | Message + Try again |

Hook actions: `joinQueue()` (esport), `createGame()` and `joinGame(queueKey)`
(social), `leaveQueue()`, `resetError()`. Social open games arrive in
`qp.availableGames`: `[{ queueKey, pointValue, currency, currentPlayers, maxPlayers, secondsRemaining, mode }]`.

### 12.2 Playing and reporting a quick play match

- Esport: play the match, then `bridge.submitQuickPlayScore(matchId, score)`
  once per player (7.1). When the result says `allScoresSubmitted`, fetch the
  outcome with `bridge.getQuickPlayMatchResults(matchId)`.
- Synchronous play uses the match room exactly as in section 8.2.

### 12.3 Queue events

The bridge maps the platform's quick play socket events to bridge events (the
hook already listens):

| Bridge event | Meaning |
|--------------|---------|
| `quickPlaySearching` | Joined the queue |
| `quickPlayLobbyUpdate` | Social open games board changed |
| `quickPlayFilling` | `{ queueKey, gameId, totalPlayers, requiredPlayers, phase }` |
| `quickPlayFound` | A match was formed |
| `quickPlayStarting` | The match is about to start |

To show who is waiting in your queue, listen to the raw socket event
`quick-play:queue-roster`:

```typescript
bridge.onRealtimeEvent('quick-play:queue-roster', (data) => {
  // { queueKey, requiredPlayers, startsAt, meId, roster: [{ id, username, avatarUrl, joinedAt }] }
});
```

- `id` and `meId` are opaque ids for display only (find yourself with
  `roster.find((r) => r.id === meId)`); never send them to the API.
- `startsAt` is the ISO time the match is expected to start, or null.
---

## 13. WALLET, LEADERBOARD, PROFILE AND AVATARS

All amounts from the API arrive as decimal strings; convert with `Number()`
before math or display. Currencies are chain-qualified (11.6).

### 13.1 Wallet balances

```typescript
const wallet = await bridge.getWalletBalance();
// { total: number (USD), currency: 'USD', balances: [{ currency, amount, usdValue }] }

const usdtBsc = await bridge.getBalanceForCurrency('USDT_BSC');   // number, spendable amount
```

| Call | Endpoint | Row fields |
|------|----------|------------|
| `getWalletBalance()` | `GET /api/v1/wallet/balances` | `currency`, `total`, `available`, `pending` (decimal strings), `balance` (= available, number), `usdValue` |
| `getBalanceForCurrency(c)` | `GET /api/v1/wallet/balances/:currency` | same row for one currency |

- `amount` in the bridge result is the **available** (spendable) balance.
- Guests get `{ total: 0, currency: 'USD', balances: [] }`.
- `walletUpdated` fires each time the bridge refreshes the balance (6.2).

Transaction history: add a method to your bridge subclass.

```typescript
// src/sdk/YourGameBridge.ts
getTransactionPage(page = 1, limit = 20) {
  return this.http.get<{
    transactions: Array<{ id: string; type: string; amount: string; currency: string; status: string;
      description?: string; txHash?: string; createdAt: string; completedAt?: string }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/api/v1/wallet/transactions', { page: String(page), limit: String(limit) });
}
```

Optional filters: `type`, `status`, `currency`, `sortBy`, `sortOrder` (`asc` |
`desc`). Common `type` values: `ENTRY_FEE`, `PRIZE_WIN`, `REFUND`, `MATCH_ENTRY`,
`MATCH_PRIZE`, `PRIVATE_ROOM_ENTRY`, `PRIVATE_ROOM_PRIZE`, `CASH_GAME_BUYIN`,
`CASH_GAME_CASHOUT`.

### 13.2 Leaderboards

```typescript
const rows = await bridge.getLeaderboard(20, 'weekly');
// [{ rank, userId, username, avatarUrl, wins, totalEarnings, isCurrentUser }]

const me = await bridge.getMyGameRank(bridge.getConfig().gameId);
// { userId, username, globalRank, total, totalScore, matchesPlayed, matchesWon, earnings, winRate }
```

| Rule | Value |
|------|-------|
| Periods | `daily`, `weekly`, `monthly`, `all_time` (default) |
| Period boundaries | UTC; weeks start Monday |
| Freshness | Results can be up to 60 seconds old |
| Ranked players | Active accounts with at least one match or prize in the period |
| Wins | Matches finished in first place; for cash sessions, a session with a net profit |
| Earnings | USD value of prizes in the period |
| `globalRank` | 0 = not ranked in this period; `total` = ranked players |

| Board | Endpoint |
|-------|----------|
| This game | `GET /api/v1/leaderboard/game/:gameId?period=&page=&limit=` -> `{ entries, pagination }` |
| All games | `GET /api/v1/leaderboard/global?period=&page=&limit=` |
| My rank (all games / this game) | `GET /api/v1/leaderboard/me`, `GET /api/v1/leaderboard/me/game/:gameId` (`?period=`) |
| Another player | `GET /api/v1/leaderboard/user/:userId` |

Show an empty state ("No ranked players yet this week") when `rows` is empty.

### 13.3 Profile and stats

```typescript
const user = await bridge.getProfile();                 // GET /api/v1/users/me
await bridge.updateProfile({ username: 'new_name' });   // PUT /api/v1/users/me, emits profileUpdated
```

- `username`: letters, numbers and underscores only.
- `PUT /api/v1/users/me` also accepts `displayName`, `bio`,
  `notificationsEnabled`, `emailNotifications`.

Player stats (bridge subclass):

```typescript
getMyStats() {
  return this.http.get<{ totalWins: number; totalMatches: number; totalEarnings: string;
    skillRating: number; winRate: number; tournamentsPlayed: number; gameplayHours: number }>(
    '/api/v1/users/me/stats');
}
```

### 13.4 Avatars

Every account has an `avatarUrl`. Players who never chose one get a picture
from the Deskillz avatar library, so always render `avatarUrl` and keep an
initials fallback only for load errors.

| Action | Endpoint |
|--------|----------|
| List the library (public, no sign-in) | `GET /api/v1/avatars/library` -> `{ version, avatars: [{ id, name, url }] }` |
| Pick a library avatar | `PUT /api/v1/users/me/avatar/library` with `{ avatarId }` |

```typescript
// src/sdk/YourGameBridge.ts
getAvatarLibrary() {
  return this.http.get<{ version: number; avatars: Array<{ id: string; name: string; url: string }> }>(
    '/api/v1/avatars/library');
}
async chooseAvatar(avatarId: string) {
  await this.http.put('/api/v1/users/me/avatar/library', { avatarId });
  return this.getProfile();   // refreshes currentUser.avatarUrl
}
```

---

## 14. AUTO-UPDATER

Every Cloud Build publish records a version per platform. `useAutoUpdater`
compares it with the version baked into your build (4.3) and tells you when a
newer one exists.

```tsx
import { useAutoUpdater } from './hooks/useAutoUpdater';

const updater = useAutoUpdater({
  gameId: import.meta.env.VITE_GAME_ID,
  currentVersion: import.meta.env.VITE_APP_VERSION,   // from package.json (4.3)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  enabled: !inMatch && !onLaunchPage,                  // your app state
});

{updater.updateAvailable && !inMatch && (
  <UpdateBanner
    version={updater.updateInfo?.latestVersion}
    onUpdate={updater.applyUpdate}
    onLater={updater.dismiss}
  />
)}
```

| Option | Default | Meaning |
|--------|---------|---------|
| `gameId` | required | Your Game ID |
| `currentVersion` | required | Semver of this build |
| `apiBaseUrl` | required | `https://api.deskillz.games` |
| `checkInterval` | 300000 (5 min) | Milliseconds between checks |
| `enabled` | `true` | Turn checking off (for example during a match) |

| Result | Meaning |
|--------|---------|
| `updateAvailable` | A newer version exists and the player has not dismissed it |
| `updateInfo` | `{ available, currentVersion, latestVersion, downloadUrl, platform, publishedAt }` |
| `isChecking`, `error` | Check state |
| `checkForUpdate()` | Check now |
| `dismiss()` | Hide until a newer version appears |
| `applyUpdate()` | See the table below |

| Platform (detected) | `applyUpdate()` |
|---------------------|-----------------|
| `pwa` (browser or installed PWA) | Updates the service worker, then reloads the page |
| `apk` (Android wrapper) | Opens the new APK download |
| `windows` (desktop wrapper) | Opens the new installer download |

How it checks:

- First check 5 seconds after mount, then every `checkInterval`.
- Endpoint (public): `GET /api/v1/games/:gameId/latest-version?platform=pwa|apk|windows`
  -> `{ version, downloadUrl, releaseNotes, publishedAt }`.
- A 404 means no build exists yet for that platform; the hook stops checking
  for the rest of the session.

Rules:

- Never show the prompt or call `applyUpdate()` during a match or on a launch
  page (5.4). Menu, lobby and results screens are the right places.
- `package.json` `version` must equal the version you enter for the Cloud Build
  and must increase on every publish (18.2). A build whose baked version is
  lower than the published one prompts forever.

---

## 15. SERVICE WORKER AND CACHING

### 15.1 What the SDK service worker does

`public/deskillz-sw.js` is SDK-owned. Register it only with the block in 4.2,
never edit it, and never add a second service worker (for example
`vite-plugin-pwa`). When `deskillz-sw.js` is in your build, Cloud Build uses it
and generates no other worker (18.3).

| Request | Strategy |
|---------|----------|
| Page navigation (`index.html`) | Network first, cache fallback when offline |
| Hashed build assets (`/assets/*.<hash>.*`) | Cache first (file names change every build) |
| Other static files (images, audio, fonts) | Stale-while-revalidate |
| API (`/api/v1/`) and Socket.IO | Never cached |
| `localhost` / `127.0.0.1` | Service worker does nothing (local development) |

### 15.2 Cache names and build stamps

```
dsk2-static-<scopeKey>-<buildHash>
dsk2-dynamic-<scopeKey>-<buildHash>
```

- `buildHash` is stamped into the worker by `vite-plugin-sw-version` on every
  `npm run build` (4.3). A new stamp means a new cache.
- `scopeKey` is derived from the tail of the registration path (the hosted
  path contains your Game ID), so several Deskillz games on the same host never
  share or delete each other's caches.
- On activation the worker deletes this game's older `dsk2-` caches and any
  legacy `dsk-` caches, then takes control of open pages.
- Install precaches `./index.html` and `./manifest.json` one by one; a missing
  file is skipped instead of failing the install.

### 15.3 Checking which build a player runs (stamp gate)

After a publish, open the hosted game, then in that tab's DevTools Console run
(use the stamp your build printed, 4.3):

```javascript
caches.keys().then((k) => console.log(k.filter((n) => n.includes('PASTE_BUILD_STAMP'))));
```

The new build is live on that device when both `dsk2-static-...-<stamp>` and
`dsk2-dynamic-...-<stamp>` appear. Filter on the stamp, not on your Game ID:
cache names carry only the tail of the path. Full publish checklist: 18.5.

### 15.4 Rules

- Keep `base: './'` and relative paths (4.3, 4.5); the worker resolves its
  precache list against its own scope.
- Do not cache API responses yourself (localStorage, IndexedDB) as a substitute
  for live data; balances, seats and results must come from the API.
- If a player reports an old version, the fix is a new build with a bumped
  version, never a change to `deskillz-sw.js`.
---

# PART C -- BUILD AND PUBLISH

## 16. WHAT GOES IN THE UPLOAD ZIP

### 16.1 Include and exclude

Cloud Build takes your **built** game: the contents of `dist/` after
`npm run build`. It does not run `npm install` or your build step.

| In the zip (root level) | Notes |
|-------------------------|-------|
| `index.html` | Required, at the zip root |
| `assets/` | Hashed JS/CSS chunks plus everything copied from `public/assets/` |
| `deskillz-sw.js` | Stamped by the build (4.3) |
| `manifest.json` | PWA manifest (17.1) |
| Icons, splash images, sounds | Whatever your `public/` folder holds |

| Never in the zip | Why |
|------------------|-----|
| `node_modules/`, `src/`, `package.json`, `tsconfig.json` | Source and tooling; the zip is the built output only |
| `*.map` | Exposes your source; disable with `sourcemap: false` (4.3) |
| `.env`, `.env.local` | Local credentials; Cloud Build injects the real values (18.3) |
| `.git/` | Version control |

### 16.2 Asset budget

| Type | Format | Target |
|------|--------|--------|
| Images | WebP or PNG | Under 1 MB each; use sprite atlases for many small images |
| Audio | MP3 or OGG | Under 2 MB each (128 kbps) |
| Fonts | WOFF2 | Under 200 KB each; subset unused glyphs |
| Upload zip | ZIP | 500 MB maximum (keep it far smaller: players download it) |

---

## 17. PWA MANIFEST AND ICONS

### 17.1 manifest.json

Put it in `public/manifest.json`. Every path is relative.

```json
{
  "name": "Your Game - Deskillz",
  "short_name": "Your Game",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0A0A1A",
  "theme_color": "#00D9FF",
  "icons": [
    { "src": "./assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "./assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- `start_url` and `scope` must be `"./"`. An absolute `"/"` breaks install on
  iPhone and on the hosted path.
- Set `orientation` to what your game needs (`portrait`, `landscape` or `any`).
- If the zip has no `manifest.json`, Cloud Build generates a basic portrait one
  from your game name; ship your own.

### 17.2 Icons and splash screens

| Asset | Sizes (px) | Where |
|-------|-----------|-------|
| Game icon (Developer Portal) | 512 x 512 PNG | Upload in the portal; Cloud Build puts it into the APK, PWA and Windows builds |
| PWA icons | 72, 96, 128, 144, 152, 192, 384, 512 | `public/assets/icons/`, listed in `manifest.json` |
| iOS touch icons | 120, 152, 167, 180 | `<link rel="apple-touch-icon" ...>` in `index.html` |
| Favicons | 16, 32, 48 | `<link rel="icon" ...>` in `index.html` |
| iOS splash (optional) | 750x1334, 1125x2436, 1170x2532, 1290x2796, 2048x2732 | `<link rel="apple-touch-startup-image" ...>` |

Cloud Build writes the portal icon to `icon.png`, `icon-192.png`, `icon-256.png`
and `icon-512.png` at the zip root. Do not use those four file names for other
images.

---

## 18. CLOUD BUILD

Cloud Build turns one zip into three outputs:

| Target | Output | Published to |
|--------|--------|--------------|
| PWA | Hosted web app | `https://games.deskillz.games/hosted/<gameId>/pwa/index.html` |
| Android | Signed APK (Capacitor WebView) | Your game's download page (20.2) |
| Windows | Portable `.exe` (Electron, no installer) | Hosted Games tab (download link) |

### 18.1 Build the zip

```powershell
# Windows (PowerShell), from your game folder
npm run build
cd dist
tar -a -c -f ..\your-game-1.2.0.zip *
cd ..
tar -tf .\your-game-1.2.0.zip | Select-Object -First 10
```

```bash
# macOS / Linux
npm run build
(cd dist && zip -r ../your-game-1.2.0.zip .)
unzip -l your-game-1.2.0.zip | head
```

- Run each PowerShell command on its own line. The zip is written next to
  `dist/`, never inside it.
- The listing must show `index.html`, `deskillz-sw.js` and `assets/...` at the
  top level, with forward slashes.
- Do **not** use PowerShell `Compress-Archive`: it writes backslash paths that
  Cloud Build cannot extract correctly.
- Do not zip the project folder; zip the contents of `dist/`.

### 18.2 Versions

| Rule | Detail |
|------|--------|
| One version, three places | `package.json` `"version"` = the Version you type in the portal = what `useAutoUpdater` compares (section 14) |
| Bump before you build | Change `package.json` first, then `npm run build`; the version is baked in at build time |
| Always increase | Use semver (`1.2.0` -> `1.2.1`) |
| A version is used up once it builds | A version that reached SUCCESS (or is still building) cannot be rebuilt for that platform. Only a FAILED or CANCELLED build frees it. Fix problems with a new version |
| Android build code | A whole number that increases with every Android release |

### 18.3 What Cloud Build does to your files

1. Downloads and extracts the zip (a single top-level folder is accepted, but
   root-level files are preferred) and checks that `index.html` exists.
2. **Injects credentials.** Every quoted `'YOUR_GAME_ID'` and `'YOUR_API_KEY'`
   string in your JS and HTML is replaced with your Game ID and your game's
   active API key. This only works if:
   - the fallbacks in your code are those exact literal strings (3.2), and
   - your game has an active API key in the Developer Portal. With no active
     key, nothing is injected and the build cannot reach the platform.
3. Copies the portal icon into the build (17.2).
4. Rewrites absolute paths (`"/assets/..."`, `url(/...)`, `"start_url": "/"`)
   to relative ones. Do not rely on this: build with `base: './'`.
5. Builds the target. PWA: uses your `deskillz-sw.js` (no other worker is
   generated when it is present). Android: Capacitor WebView with `https`
   scheme, signed APK. Windows: Electron portable `.exe`.
6. Uploads the output and publishes it to your game's hosted record
   (section 20).

### 18.4 Before you upload: load test

A build can succeed and still crash when the page loads (for example an engine
file that reads an imported constant at module top level, 3.2). Catch it before
uploading:

1. Keep pure game logic (no DOM, no `window`) in its own chunk:

```typescript
// vite.config.ts -> build.rollupOptions.output
manualChunks: {
  'game-engine': ['./src/engine/GameEngine.ts', './src/engine/GameRules.ts'],
},
```

2. After `npm run build`, import that chunk with Node. It must exit with code 0:

```powershell
node (Get-ChildItem dist\assets\game-engine-*.js).FullName; echo "exit=$LASTEXITCODE"
```

3. Run `npm run preview`, open the printed URL, and confirm the menu renders
   with no red errors in the DevTools Console.

### 18.5 Publish checklist (stamp gate)

Run this in the same sitting as the upload:

1. `package.json` version bumped; `npm run build` printed
   `[sw-version] Stamped deskillz-sw.js with build hash: <stamp>`. Write the
   stamp down.
2. Load test passed (18.4).
3. Zip built with `tar` (18.1); listing checked.
4. Developer Portal -> **Game Builds**: upload the zip, choose **All
   Platforms**, enter the version, start the build.
5. Wait for **SUCCESS** on PWA, Android and Windows. On FAILED, open the build
   log, fix, bump the version, rebuild.
6. Open `https://games.deskillz.games/hosted/<gameId>/pwa/index.html`, reload
   once, then run the stamp check (15.3) in that tab's DevTools Console. Both
   `dsk2-static-...-<stamp>` and `dsk2-dynamic-...-<stamp>` must be present.
7. Sign in, open the wallet and a tournament list, and confirm data loads
   (no 401/404 in the Network panel).

---

## 19. DEVELOPER PORTAL

### 19.1 First submission (Upload Game)

Developer Portal: **https://deskillz.games/developer** -> **Upload Game**.

| Step | What you do |
|------|-------------|
| 1 Credentials | Enter the game name and target platform, then **Generate**. You get the Game ID, API key and API secret. The **API secret is shown only once**: store it somewhere safe; never put it in game code |
| 2 Basic information | Name, short and full description, genre, tags, category (**Esport** or **Social**) |
| 3 Platform and SDK | Engine (**Web/HTML5** for this guide), game mode, min/max players |
| 4 Web game upload | Upload the zip (18.1), choose build targets, version and build code, Android signing |
| 5 Tournament settings | Typical match duration, private rooms, host spectating |
| 6 Assets | 512 x 512 icon, banner, video, 2-5 screenshots (16:9) |
| 7 Review and submit | Check the summary, accept the terms, submit |

The Deskillz team reviews new games (typically 1-2 business days) and emails
you the result.

### 19.2 Updates (Game Builds)

**Game Builds** tab: upload the new zip, pick the platforms (or **All
Platforms**), enter the new version, optionally release notes, and start. The
build card shows progress (queued, preparing, building, signing, uploading) and
the log. Every successful build replaces the published version for its
platform.

**Android signing:** use the Deskillz keystore (fastest), or upload your own
keystore in the portal if you will also publish the APK in an app store. Keep
one keystore per package name for the life of the app: Android refuses to
update an app signed with a different key.

### 19.3 Where to find your Game ID

- Developer Portal -> **My Games**: the Game ID is on each game.
- It is the UUID in your hosted URL: `.../hosted/<gameId>/pwa/`.
- Gameplay capabilities (11.3) and Quick Play tiers are edited from the game in
  **My Games**; cash tables in **Cash Games**.

---

## 20. HOSTED GAMES, DOWNLOAD PAGE AND WINDOWS

### 20.1 Hosted game

Each successful build updates your game's hosted record: the PWA URL and
version, the APK link and version, the Windows `.exe` link and version. The
**Hosted Games** tab shows them. The auto-updater (section 14) reads the same
versions.

### 20.2 Download page

Players install from your game's page on deskillz.games
(`https://deskillz.games/games/<gameId>/download`). The page picks the right
option for the player's device:

| Device | Action | Player steps |
|--------|--------|--------------|
| Android | Download APK | Open the file -> allow "Install unknown apps" for the browser -> Install |
| iPhone / iPad | Add to Home Screen (PWA) | Open in **Safari** -> Share -> Add to Home Screen |
| Desktop | Play in Browser | Opens the hosted PWA, already signed in to the player's Deskillz account |

The Windows `.exe` link for each build is in the **Hosted Games** tab; share it
with players who want the desktop app. On first run Windows SmartScreen may
warn: More info -> Run anyway.

### 20.3 Windows desktop build

- Portable `.exe` built with Electron: no installer and no admin rights.
  Windows 10 or 11, 64-bit.
- Opens in a 1280 x 720 window (minimum 800 x 600) and can go full screen.
- The game runs from local files, so all API and socket traffic goes to
  `https://api.deskillz.games` exactly as in the browser.

Detect the desktop app and use its helpers:

```typescript
const desktop = (window as any).deskillzDesktop;
if (desktop?.isDesktopApp) {
  desktop.appVersion;                          // Version from the build
  desktop.toggleFullscreen();
  desktop.openExternal('https://deskillz.games');   // https/http only
  desktop.copyToClipboard('ROOM-CODE');
  desktop.showNotification('Your table is ready', 'Tap to join');
}
```

Other helpers: `minimize()`, `maximize()`, `close()`. Always open external
links with `openExternal`; plain links would navigate the game window away.
---

# PART D -- REFERENCE

## 21. API ENDPOINTS

Base URL: `https://api.deskillz.games`. Every path starts with `/api/v1`.
**Auth:** `public` = no sign-in; `player` = the bridge sends the player's
access token. **Call via:** a bridge method, or `subclass` = add a method to
your bridge subclass using `this.http` (4.1, 11.1). Your game never calls these
with its own `fetch`.

Responses are plain JSON (no envelope). Errors return
`{ statusCode, message, error }`. Unknown body fields are rejected with 400.

### 21.1 Auth and session

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| POST | `/auth/register` | public | `bridge.register` |
| POST | `/auth/login` | public | `bridge.login` |
| GET | `/auth/nonce` | public | `bridge.loginWithWallet` |
| POST | `/auth/wallet/verify` | public | `bridge.loginWithWallet` |
| POST | `/auth/refresh` | public | bridge (automatic) |
| POST | `/auth/launch/exchange` | public | bridge (automatic, 5.1) |
| POST | `/auth/logout` | player | `bridge.logout` |
| GET | `/users/me` | player | `bridge.getProfile` |
| PUT | `/users/me` | player | `bridge.updateProfile` |
| GET | `/users/me/stats` | player | subclass (13.3) |
| PUT | `/users/me/avatar/library` | player | subclass (13.4) |
| GET | `/avatars/library` | public | subclass (13.4) |

### 21.2 Games and updates

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| GET | `/games/:id` | public | `bridge.getGameCapabilities` (11.3) |
| GET | `/games/:id/latest-version?platform=pwa\|apk\|windows` | public | `useAutoUpdater` (14) |
| GET | `/quick-play/games/:gameId` | public | `bridge.getQuickPlayConfig` |
| GET | `/health` | public | status check |

### 21.3 Wallet, leaderboard, disputes

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| GET | `/wallet/balances` | player | `bridge.getWalletBalance` |
| GET | `/wallet/balances/:currency` | player | `bridge.getBalanceForCurrency` |
| GET | `/wallet/transactions?page=&limit=&type=&status=&currency=` | player | subclass (13.1) |
| GET | `/leaderboard/game/:gameId?period=&page=&limit=` | public | `bridge.getLeaderboard` |
| GET | `/leaderboard/global?period=&page=&limit=` | public | subclass |
| GET | `/leaderboard/me/game/:gameId?period=` | player | `bridge.getMyGameRank` |
| GET | `/leaderboard/me?period=` | player | `bridge.getMyRank` |
| GET | `/leaderboard/user/:userId` | public | `bridge.getUserRank` |
| POST | `/disputes` | player | `bridge.fileDispute` / `DisputeModal` |
| GET | `/disputes/me` | player | `bridge.getMyDisputes` |
| GET | `/disputes/:id` | player | `bridge.getDisputeDetails` |
| POST | `/disputes/:id/evidence` | player | `bridge.addDisputeEvidence` |
| GET | `/matches/history/me?limit=` | player | `bridge.getRecentMatchesForDispute` |

Dispute body: `{ disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM', tournamentId?, matchId?, roomCode?, reason, description, evidence?: string[] }`.
`reason`: `WRONG_SCORE`, `CHEATING`, `DISCONNECTION`, `OPPONENT_ISSUE`,
`PAYMENT_ISSUE`, `UNFAIR_MATCHMAKING`, `OTHER`.

### 21.4 Tournaments

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| GET | `/tournaments?gameId=` | public | `bridge.getTournaments` |
| GET | `/tournaments/:id` | public | subclass |
| GET | `/tournaments/:id/participants` | public | subclass |
| GET | `/tournaments/my-registrations` | player | `bridge.getMyRegistrations` |
| POST | `/tournaments/:id/register` | player | `bridge.registerTournament` |
| POST | `/tournaments/:id/checkin` | player | `bridge.checkInTournament` |
| DELETE | `/tournaments/:id/leave` | player | `bridge.leaveTournament` |
| GET | `/tournaments/:id/my-status` | player | `bridge.getEnrollmentStatus` |
| GET | `/tournaments/:id/schedule` | player | `bridge.getTournamentSchedule` |
| GET | `/tournaments/:id/my-launch` | player | `bridge.getMyLaunch` (5.3) |
| POST | `/tournaments/:id/score` | player | `bridge.submitScore` (7) |
| POST | `/tournaments/matches/:matchId/result` | player (seated host) | subclass (11.1) |

### 21.5 Quick play

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| POST | `/lobby/quick-play/join` | player | `bridge.joinQuickPlay` / `useQuickPlayQueue` |
| POST | `/lobby/quick-play/leave` | player | `bridge.leaveQuickPlay` |
| GET | `/lobby/quick-play/status` | player | `bridge.getQuickPlayStatus` |
| POST | `/lobby/quick-play/match/:matchId/score` | player | `bridge.submitQuickPlayScore` |
| GET | `/lobby/quick-play/match/:matchId/results` | player | `bridge.getQuickPlayMatchResults` |

### 21.6 Private rooms

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| GET | `/private-rooms?gameId=` | public | `bridge.getPublicRooms` |
| POST | `/private-rooms` | player | `bridge.createRoom` (esport) |
| POST | `/private-rooms/social` | player | `bridge.createSocialRoom` |
| POST | `/private-rooms/join` | player | `bridge.joinRoom` |
| POST | `/private-rooms/:roomId/start` | player (host) | `bridge.startRoom` |
| POST | `/private-rooms/:roomId/buy-in` | player | `bridge.roomBuyIn` |
| POST | `/private-rooms/:roomId/cash-out` | player | `bridge.roomCashOut` |
| POST | `/private-rooms/:roomId/leave` | player | `bridge.leaveRoom` |
| POST | `/private-rooms/:roomId/score` | player | `bridge.submitScore({ roomId })` |
| POST | `/private-rooms/:roomId/invite` | player | `bridge.invitePlayer` |
| GET | `/private-rooms/invites/my` | player | `bridge.getMyInvites` |
| POST | `/private-rooms/invites/:inviteId/respond` | player | `bridge.respondToInvite` |
| GET | `/private-rooms/my-active` | player | bridge (automatic, 6.3) |
| GET | `/host/dashboard` | player | `useHostDashboard` |
| GET | `/host/age-verified` | player | `bridge.checkAgeVerified` |
| POST | `/host/verify-age` | player | `bridge.verifyAge` |

### 21.7 Cash tables

| Method | Path | Auth | Call via |
|--------|------|------|----------|
| GET | `/persistent-cash-games/game/:gameId` | public | subclass (11.5) |
| GET | `/persistent-cash-games/my-seat/:gameId` | player | subclass |
| POST | `/persistent-cash-games/:configId/seat` | player | subclass |
| GET | `/persistent-cash-games/tables/:tableId` | public | subclass |
| POST | `/persistent-cash-games/tables/:tableId/hand-result` | player (seated) | subclass |
| POST | `/persistent-cash-games/tables/:tableId/rebuy` | player | subclass |
| POST | `/persistent-cash-games/tables/:tableId/leave` | player | subclass |

---

## 22. SOCKET EVENTS

One Socket.IO v4 connection to `wss://api.deskillz.games` (8.1). Private
events are delivered only to the player they concern.

### 22.1 Client to server

| Event | Payload | Ack / effect |
|-------|---------|--------------|
| `match:join_room` | `{ matchId }` | Ack `{ success: true }` or `{ error }`; seated players only (8.2) |
| `match:relay` | `{ matchId, event, payload }` | Forwards `payload` as `event` to the room; allowed events in 8.2 |
| `match:leave_room` | `{ matchId }` | Leaves the room |
| `match:progress` | `{ matchId, score?, board? }` | Sends a display-only progress snapshot to the room (not a score submission) |
| `board:join`, `board:move`, `board:sync_request`, `board:leave` | see 8.3 | Server-run board only |
| `cash-table:join` / `cash-table:leave` | `{ tableId }` | Subscribe to a cash table's events (22.4) |

### 22.2 Launch and match room (server to client)

| Event | Payload |
|-------|---------|
| `match:launch` | Live launch payload (5.3): `matchId`, `token`, `webLink`, `deepLink`, `tournamentId`, `roundNumber`, `tableNumber`, `gameName`, `gameSlug`, `gameplayMode`, `gameRuleVariant`, `hostUserId`, `players` |
| `match:player_joined` | `{ userId, username, timestamp }` |
| `match:progress` | `{ odid, username, score, board, at }` (`odid` = sender's user id) |
| `game:state`, `game:hand`, `game:action`, `game:round-end`, `game:game-end`, `game:request-sync`, `game:round-ready`, `game:round-ready-state`, `game:chat`, `game:ping`, `game:pong` | Whatever the sending seat relayed (8.2) |
| `board:state`, `board:start`, `board:applied`, `board:rejected`, `board:sync`, `board:presence`, `board:end` | Server-run board (8.3) |

### 22.3 Quick play (server to client)

| Event | Bridge event | Payload |
|-------|--------------|---------|
| `quick-play:searching` | `quickPlaySearching` | `{ queueKey, gameId, entryFee, playerCount, currency, position, playersInQueue }` |
| `quick-play:filling` | `quickPlayFilling` | `{ queueKey, gameId, totalPlayers, requiredPlayers, phase }` |
| `quick-play:found` | `quickPlayFound` | `{ matchId, gameId, entryFee, currency, players }` |
| `quick-play:starting` | `quickPlayStarting` | `{ matchId, gameId, entryFee, currency, players }` |
| `quick-play:match-launched` | `quickPlayMatchLaunched` | `{ matchId, matchSessionId, gameId, deepLink, token, entryFee, currency, prizePool, players }` |
| `quick-play:score-submitted` | `quickPlayScoreSubmitted` | `{ matchId, playerId, scoresIn, totalPlayers }` |
| `quick-play:match-completed` | `quickPlayMatchCompleted` | Final results |
| `quick-play:lobby-update` | `quickPlayLobbyUpdate` | Social open games board |
| `quick-play:queue-roster` | (raw event, 12.3) | `{ queueKey, requiredPlayers, startsAt, meId, roster }` |

### 22.4 Cash tables and account (server to client)

| Event | Payload |
|-------|---------|
| `cash-game:player-seated` | `{ tableId, userId, seatIndex, chipBalance }` |
| `cash-game:player-left` | `{ tableId, userId, seatIndex }` |
| `cash-game:player-rebuy` | `{ tableId, userId, seatIndex, rebuyAmount, newChipBalance }` |
| `cash-game:hand-result` | `{ tableId, handNumber, potSize, rakeAmount, winnerId, playerBalances }` |
| `cash-game:player-busted` | `{ tableId, userId, seatIndex }` |
| `cash-game:table-settled` | `{ tableId, reason, playerResults }` |
| `cash-game:table-transfer` | `{ fromTableId, toTableId, reason }` (sent to the moved player) |
| `dispute:status-changed` | `{ disputeId, oldStatus, newStatus, resolution, updatedAt }` |

Listen with `bridge.onRealtimeEvent(name, handler)`; it returns an unsubscribe
function.

---

## 23. TESTING CHECKLIST

### 23.1 Before you zip

- [ ] `tsc --noEmit` clean; `npm run build` succeeds and prints the sw-version stamp
- [ ] `package.json` version bumped (18.2)
- [ ] Engine chunk load test exits 0; `npm run preview` renders with no console errors (18.4)
- [ ] `.env.production` still has `YOUR_GAME_ID` / `YOUR_API_KEY`; `.env.local` removed
- [ ] No `sourcemap`, no absolute `/assets/` paths, `base: './'`
- [ ] `index.html` uses the SW block from 4.2 unchanged

### 23.2 SDK integration (browser, signed in)

- [ ] Sign in with email and with a wallet (signature prompt appears)
- [ ] `bridge.isLive` is true; guest mode blocks paid features (9.2)
- [ ] Wallet screen shows real balances; leaderboard shows rows or an empty state
- [ ] Reload a normal page: still signed in, one socket connection
- [ ] Two different Deskillz games open in two tabs keep separate sessions

### 23.3 Tournament flow (two accounts, two browsers)

- [ ] Register, then check in during the window; the card updates
- [ ] Launch from deskillz.games opens the table with the right mode, timer and seats
- [ ] Lobby link (`lobby=1`) shows the seated lobby and moves to the table at start
- [ ] Esport: each player's score submits once; results appear on the site
- [ ] Social: only the host posts the table result; a second post is treated as done
- [ ] Refresh mid-match on a non-launch page: the rejoin prompt appears (6.3)
- [ ] Disconnect Wi-Fi for 10 seconds: the table resyncs after reconnect (8.2)

### 23.4 Quick play, rooms and disputes

- [ ] Quick play: join, cancel, join again; match starts and `onMatchStart` navigates
- [ ] Private room: create with the portal defaults, join by code from a second account, buy in, start, cash out
- [ ] File a dispute from the results screen with each reason; it appears in the disputes list

### 23.5 After Cloud Build

- [ ] PWA, Android and Windows builds all SUCCESS for the new version
- [ ] Stamp gate passed on the hosted PWA (15.3)
- [ ] APK installs over the previous version on a real Android device
- [ ] `.exe` launches, signs in and plays one match
- [ ] iPhone Safari: Add to Home Screen installs and opens full screen
- [ ] The update prompt appears on an older installed build (section 14)

---

## 24. TROUBLESHOOTING

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank page, console error reading a property of `undefined` at load | Engine code reads an imported constant at module top level | Move the lookup inside a function; add the load test (18.4) |
| Game works locally, 404s for `assets/...` when hosted | Absolute paths or missing `base: './'` | 4.3, 4.5 |
| Cloud Build fails "Entry point not found" | Zipped the folder instead of `dist/` contents, or `Compress-Archive` | Rebuild the zip with `tar` (18.1) |
| Hosted build cannot reach the API (401 everywhere, wrong game) | Fallbacks are not the literal placeholders, or the game has no active API key | 3.2, 18.3 |
| "A build for version X already exists" | Version slot already used | Bump the version (18.2) |
| Players keep seeing the old version | Version not bumped before build, or update prompt suppressed | 14, 15.3 |
| Launch link opens the sign-in screen | Token expired (5 min), already used, or the page reloaded | Re-open from deskillz.games or call my-launch (5.3) |
| `gameplayMode` / `dur` ignored | Params read on screen mount after routing | Read at module load (5.2) |
| Opponent never sees the first moves | Relay sent before the join ack | Wait for the ack; retry with a generation counter (8.2) |
| Every client shows the previous player's turn | State broadcast before the engine advanced the turn | Broadcast after the turn changes (8.2 rule 6) |
| Two seats both think they are host | Host elected on the client | Use `hostUserId` (5.3, 8.2) |
| Components render without styles | Tailwind not scanning `src/components` | 9.1 |
| Toasts never show | No `<Toaster />` mounted | 9.1 |
| Realtime silently does nothing | `socket.io-client` not installed | 8.1 |
| 400 "property X should not exist" | Extra field in a request body | Send only the documented fields (21) |
| 400 on a currency | Plain `USDT` / `USDC` | Use `USDT_BSC`, `USDT_TRON`, `USDC_BSC`, `USDC_TRON` or `BNB` (11.6) |
| Service worker cache names not found in the stamp check | Filtering on the Game ID | Filter on the build stamp (15.3) |

Debug logging: set `VITE_ENABLE_DEBUG=true` in `.env.local` (bridge logs every
call and socket event). Never ship a build with debug on.

---

## 25. CRITICAL LESSONS

| Area | Rule |
|------|------|
| SDK files | Never edit the bridge, hooks, components or `deskillz-sw.js`; extend in your subclass (2.1) |
| Initialization | `captureLaunchParams()` first, `initialize()` exactly once, no `StrictMode` (3.2) |
| Launch pages | Never reload; never show the update prompt; read params at module load (5.2, 5.4) |
| Network | Every API call goes through the bridge or your subclass's `this.http`; never build URLs from `window.location` (11.5) |
| Scores | Submit once, through the bridge; never handle the score secret yourself (7) |
| Realtime | Acked join before relay; host from `hostUserId`; broadcast after the turn advances; resync after reconnect (8.2) |
| Seats | Render every seat the same way; never branch on who occupies a seat (1.2) |
| Money | Chain-qualified currencies; amounts arrive as strings; balances and results always from the API (11.6, 13.1) |
| Engine | No top-level reads of imported constants in engine modules (3.2, 18.4) |
| Build | `base: './'`, bump version first, `tar` zip of `dist/` contents, load test, stamp gate (18) |
| Cache | Never add a second service worker; fix stale versions with a new build (15) |
| Dependencies | React 18, Tailwind scanning `src/components`, framer-motion, lucide-react, react-hot-toast, socket.io-client (9.1) |

---

## 26. DESIGN TOKENS AND LIMITS

### 26.1 Design tokens

Import `src/styles/tokens.css` once (9.1) and use the variables instead of raw
colors so shared components and your screens match.

| Token | Value | Use |
|-------|-------|-----|
| `--dsk-card-bg` | `#1a1a2e` | Card background |
| `--dsk-card-border` | `#2a2a4a` | Card border |
| `--dsk-card-radius` | `0.75rem` | Card corners |
| `--dsk-badge-tournament` | `#a855f7` | Tournament badge |
| `--dsk-badge-cashgame` | `#ec4899` | Cash game badge |
| `--dsk-badge-quickplay` | `#06b6d4` | Quick play badge |
| `--dsk-badge-live` | `#ef4444` | In progress |
| `--dsk-btn-register` / `--dsk-btn-playnow` | `#06b6d4` | Primary actions |
| `--dsk-btn-checkin` / `--dsk-btn-found` | `#22c55e` | Check in, match found |
| `--dsk-btn-filling` | `#f59e0b` | Table filling |
| `--dsk-btn-dq` | `#ef4444` | Missed check-in |
| `--dsk-prize` | `#22c55e` | Prize amounts |
| `--dsk-rake` | `#ec4899` | Rake |

The full list is in `tokens.css`.

### 26.2 Limits

| Item | Limit |
|------|-------|
| Upload zip | 500 MB |
| Game icon (portal) | 512 x 512 PNG |
| Screenshots (portal) | 2-5, 16:9 |
| Launch token lifetime | 5 minutes, single use |
| Check-in window | 5-60 minutes (default 30) |
| Leaderboard freshness | Up to 60 seconds |
| Auto-updater interval | 5 minutes (configurable) |
| Socket reconnect attempts | 10 |
| Match room join | Seated players only |

---
*End of DESKILLZ WEB GAME DEVELOPER GUIDE v6.0 -- Web SDK 3.7.x -- https://api.deskillz.games*
