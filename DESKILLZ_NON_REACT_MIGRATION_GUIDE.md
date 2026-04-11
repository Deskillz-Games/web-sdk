# DESKILLZ NON-REACT TO REACT MIGRATION GUIDE

## Dou Dizhu | Bubble Battle | Candy Duel

**Version:** 1.8
**Date:** April 11, 2026
**For:** Developers of existing non-React standalone games
**Applies to:** Dou Dizhu (PixiJS), Bubble Battle (Canvas/TypeScript), Candy Duel (Canvas/TypeScript)

**Changelog v1.8 (April 11, 2026):**
- SDK v3.4.3: GameCapabilities expanded with 4 new mode flags
  (supportsBlitz1v1, supportsDuel1v1, supportsSinglePlayerMode, supportsTurnBased)
- EsportGameSettings: duration/rounds use ChipPlusFreeInput, platformFeePercent from config,
  6 game modes (SYNC, ASYNC, BLITZ_1V1, DUEL_1V1, SINGLE_PLAYER, TURN_BASED)
- Bubble Battle: set supportsDuel1v1=true in Developer Portal
- Candy Duel: set supportsBlitz1v1=true in Developer Portal
- QuickPlayCard: empty state preview UI when no QuickPlayConfig exists
- LobbyOverlay: tournament tab with filters, stats, auto-refresh, empty state

**Changelog v1.6:**
- Added Step 11: PWA Cache-Bust Setup (deskillz-sw.js + vite-plugin-sw-version)
- Added maxTournamentSize to GameCapabilities
- Updated index.html template: deskillz-sw.js registration, no confirm() dialog
- Updated build command with manual hash stamp

**Changelog v1.5:**
- Added Step 10 (after Step 9): Game Capabilities integration
- Updated Step 7 file list with GameCapabilities.ts + deskillz-sw.js
- Updated file count summary table

**Changelog v1.4 (current):**
- DeskillzBridge updated to v3.2 (2,483 lines, 50 methods -- 20 new)
- Step 7 expanded: shared components now include 8 room components + useHostDashboard
- Step 7b added: social game room files (Dou Dizhu only if configured as SOCIAL)
- Step 8 expanded: lobby screens now include HostDashboardPage + room screens
- Updated file summary table: 19 shared files for social games, 11 for esport
- Score signing (signScore/verifyScore) documented for esport anti-cheat

**Changelog v1.3:**
- Updated QuickPlayCard and useQuickPlayQueue to v3.2.0
- Social games: point value/currency dropdowns, live Available Games board

**Changelog v1.2:**
- Added window.DeskillzBridge requirement to Step 4 main.tsx

**Changelog v1.1:**
- Fixed Step 1: added tailwindcss, postcss, autoprefixer

---

## WHY THIS MIGRATION IS REQUIRED

The `DeskillzUI.umd.js` bundle that non-React games previously loaded via `<script>`
tag has been permanently retired. The correct architecture is a React/Vite shell
that wraps your existing gameplay engine. Your game logic does not change.

---

## THE CORE PRINCIPLE

```
BEFORE (broken):
  Vanilla JS / PixiJS entry point
    |-- loads DeskillzUI.js via <script> tag
    |-- DeskillzUI renders overlay on top of your canvas
    |-- Your game starts when overlay calls onMatchStart()

AFTER (correct):
  React/Vite shell (main.tsx -> App.tsx)
    |-- LobbyScreen: tournament list, QuickPlay, Host Dashboard
    |-- GameScreen: React component that MOUNTS YOUR CANVAS/PIXI APP
    |-- Room components: BuyIn, CashOut, Rebuy, Timer (social games)
    |-- Your game starts when GameScreen mounts
    |-- React shows results screen when game ends
```

**Your game engine code does not change.** You are adding a React wrapper.

---

## WHAT CHANGES AND WHAT DOES NOT

| Item | Changes? | Detail |
|------|----------|--------|
| Game engine (PixiJS, canvas, physics, AI) | NO | Zero changes |
| Game rules, scoring | NO | Zero changes |
| `DeskillzBridge.ts` | YES -- replace with v3.2 | 2,483 lines, 50 methods |
| `index.html` | YES -- simplified | React mounts into `#root` div |
| `main.ts` / `App.ts` | YES -- replaced by `main.tsx` + `App.tsx` | React entry point |
| Lobby UI (tournaments, QuickPlay, host) | YES -- now React | Use shared components |
| Room UI (buy-in, cash-out, timer) | YES -- now React | Use shared room components (social) |
| Auth UI | YES -- now React | Standard Deskillz auth screens |
| `package.json` | YES -- add React deps | react, react-dom, react-router-dom, etc. |
| `vite.config.ts` | YES -- add React plugin | @vitejs/plugin-react |
| `tsconfig.json` | YES -- add JSX config | "jsx": "react-jsx" |
| `public/sdk/DeskillzUI.js` | REMOVE | Permanently retired |

---

## PART A: CANDY DUEL (Canvas/TypeScript) -- LOW EFFORT

Candy Duel is an esport game. It needs the 11 core shared files.
Estimated effort: 2-3 sessions.

### Step 0.5 -- Understand the window.DeskillzBridge requirement (READ FIRST)

The shared hooks (`useEnrollmentStatus`, `useQuickPlayQueue`, `useHostDashboard`)
access the bridge at runtime via `(window as any).DeskillzBridge?.getInstance?.()`.

Your `main.tsx` MUST assign the bridge instance to `window.DeskillzBridge`
BEFORE React renders. Without this, every hook returns `null` silently.

### Step 1 -- Add React dependencies

```bash
npm install react react-dom react-router-dom framer-motion lucide-react react-hot-toast clsx tailwind-merge
npm install -D @types/react @types/react-dom @vitejs/plugin-react tailwindcss postcss autoprefixer
```

### Step 1b -- Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

### Step 1c -- Create global CSS entry file

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 2 -- Update `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',              // CRITICAL: top-level, NOT inside build: {}
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
  },
})
```

### Step 3 -- Update `tsconfig.json`

Add these to `compilerOptions`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### Step 4 -- Create `src/main.tsx` (replaces old entry point)

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/tokens.css'
import { DeskillzBridge } from './sdk/DeskillzBridge'

// Initialize bridge BEFORE React renders
DeskillzBridge.getInstance({
  gameId:     import.meta.env.VITE_GAME_ID     || 'YOUR_GAME_ID',
  gameKey:    import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://newdeskillzgames-production.up.railway.app',
  socketUrl:  import.meta.env.VITE_SOCKET_URL   || 'wss://newdeskillzgames-production.up.railway.app',
})

// CRITICAL: shared hooks read from window at runtime
const instance = DeskillzBridge.getInstance()
;(window as any).DeskillzBridge = { getInstance: () => instance }

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

### Step 5 -- Create `src/App.tsx`

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthScreen from './screens/AuthScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import TournamentPage from './screens/TournamentPage'
import QuickPlayPage from './screens/QuickPlayPage'
import ResultsScreen from './screens/ResultsScreen'
import ProfileScreen from './screens/ProfileScreen'
import WalletScreen from './screens/WalletScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/lobby" element={<LobbyScreen />} />
        <Route path="/tournaments" element={<TournamentPage />} />
        <Route path="/quick-play" element={<QuickPlayPage />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/wallet" element={<WalletScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Step 6 -- Create `src/screens/GameScreen.tsx`

For Canvas-based games (Candy Duel, Bubble Battle):

```tsx
import { useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const { state } = useLocation()

  useEffect(() => {
    if (!canvasRef.current) return

    // YOUR EXISTING GAME ENGINE -- no changes to game logic
    const game = new YourGameEngine({
      canvas: canvasRef.current,
      matchData: state?.matchData,
      onGameEnd: async (result: { score: number }) => {
        await DeskillzBridge.getInstance().submitScore({
          score: result.score,
          matchId: state?.matchData?.matchId,
        })
        navigate('/results', { state: { result } })
      },
    })

    return () => { try { game.destroy() } catch {} }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh' }} />
}
```

### Step 7 -- Copy shared UI components

**Core files (ALL games):**

```
FROM ZIP src/sdk/DeskillzBridge.ts        -> YOUR_GAME/src/sdk/DeskillzBridge.ts          REPLACE
FROM ZIP src/components/tournaments/TournamentCard.tsx  -> YOUR_GAME/src/components/tournaments/
FROM ZIP src/components/tournaments/QuickPlayCard.tsx   -> YOUR_GAME/src/components/tournaments/
FROM ZIP src/hooks/useEnrollmentStatus.ts              -> YOUR_GAME/src/hooks/
FROM ZIP src/hooks/useQuickPlayQueue.ts                -> YOUR_GAME/src/hooks/
FROM ZIP src/components/ui/Badge.tsx                   -> YOUR_GAME/src/components/ui/
FROM ZIP src/components/ui/Button.tsx                  -> YOUR_GAME/src/components/ui/
FROM ZIP src/components/ui/Card.tsx                    -> YOUR_GAME/src/components/ui/
FROM ZIP src/utils.ts                                  -> YOUR_GAME/src/utils.ts
FROM ZIP src/bridge-types.ts                           -> YOUR_GAME/src/bridge-types.ts
FROM ZIP src/styles/tokens.css                         -> YOUR_GAME/src/styles/tokens.css
```

### Step 7b -- Copy esport room files (Candy Duel, Bubble Battle)

**Esport games need these 2 additional files for private room creation:**

```
FROM ZIP src/components/rooms/EsportGameSettings.tsx     -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/AgeVerificationModal.tsx   -> YOUR_GAME/src/components/rooms/
```

EsportGameSettings handles: entry fee (quick-select chips), currency, player count,
game mode (sync/async), match duration, rounds, prize distribution split, visibility.
Entry fee is fixed at room creation -- players pay it when joining via bridge.joinRoom().
No BuyInModal, RebuyModal, CashOutModal, or TurnTimer needed for esport games.

### Step 7c -- Copy social room files (Dou Dizhu ONLY)

**Skip this step for Candy Duel and Bubble Battle (esport games).**
Dou Dizhu only needs these if configured as a SOCIAL game.

```
FROM ZIP src/hooks/useHostDashboard.ts                       -> YOUR_GAME/src/hooks/
FROM ZIP src/components/rooms/BuyInModal.tsx                  -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/CashOutModal.tsx                -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/RebuyModal.tsx                  -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/LowBalanceWarning.tsx           -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/TurnTimer.tsx                   -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/PauseRequestModal.tsx           -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/SocialGameSettings.tsx          -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/AgeVerificationModal.tsx        -> YOUR_GAME/src/components/rooms/
```

**Verify after copying:**

```powershell
npx tsc --noEmit
```

### Step 8 -- Build lobby screens

Create these React screens following the patterns from
DESKILLZ_STANDALONE_GAME_UI_BUILD_HANDOFF_v3.0.md:

**All games:**
- `src/screens/AuthScreen.tsx` -- login/register
- `src/screens/LobbyScreen.tsx` -- tab shell (Tournaments, QuickPlay, Profile)
- `src/screens/TournamentPage.tsx` -- TournamentCard + useEnrollmentStatus
- `src/screens/QuickPlayPage.tsx` -- QuickPlayCard + useQuickPlayQueue
- `src/screens/ResultsScreen.tsx` -- score display
- `src/screens/ProfileScreen.tsx` -- stats + history
- `src/screens/WalletScreen.tsx` -- balance + transactions

**Esport games (Candy Duel, Bubble Battle) -- add these:**
- `src/screens/CreateRoomScreen.tsx` -- EsportGameSettings + AgeVerificationModal
- Prize pool preview is built into EsportGameSettings (shows gross, rake, net)
- Entry fee is fixed at creation -- no BuyInModal needed when players join

**Esport games -- add routes in App.tsx:**
```tsx
<Route path="/rooms/create" element={<CreateRoomScreen />} />
<Route path="/rooms/:roomId" element={<RoomLobbyScreen />} />
```

**Social games (Dou Dizhu if SOCIAL) -- add these:**
- `src/screens/HostDashboardPage.tsx` -- focused operational view with deep link to full dashboard. Copy from React Game Update Guide v1.3 Step 8. Shows: tier + earnings + active rooms + create room + withdraw. Links to `https://deskillz.games/host` for badges, level progression, and settings.
- `src/screens/CreateRoomScreen.tsx` -- SocialGameSettings (use `lockedGameType` prop) + AgeVerificationModal. Supports two modes: Cash Game (rake-based, open-ended) and Tournament (bracket, entry fee, prize pool). See React Game Update Guide v1.3 Step 7a for complete code.
- `src/screens/RoomLobbyScreen.tsx` -- BuyInModal + CashOutModal + RebuyModal + LowBalanceWarning + TurnTimer + PauseRequestModal

**Social games -- add routes in App.tsx:**
```tsx
<Route path="/host" element={<HostDashboardPage />} />
<Route path="/rooms/create" element={<CreateRoomScreen />} />
<Route path="/rooms/:roomId" element={<RoomLobbyScreen />} />
```

### Step 9 -- Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Your Game Name</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

No `<script src="DeskillzUI.js">` tag. No `<script src="main.ts">`. React handles everything.

### Step 10 -- Remove dead files

```
DELETE: public/sdk/DeskillzUI.js
DELETE: Any DeskillzUI.renderLobby() calls
DELETE: Any DeskillzUI.showLobby() / hideLobby() calls
DELETE: The old entry point that called DeskillzUI.renderLobby()
```

### Step 11 -- Verify + build

```powershell
npx tsc --noEmit         # 0 errors required
npx vite build           # must succeed

# ZIP for Cloud Build
Remove-Item .env.local -ErrorAction SilentlyContinue
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

---

## PART B: BUBBLE BATTLE (Canvas/TypeScript) -- LOW-MEDIUM EFFORT

### Step 1-9: Follow Candy Duel steps exactly, substituting:

| Candy Duel | Bubble Battle |
|-----------|---------------|
| `CandyGameEngine` | `BubbleBattleEngine` |
| `CandyRenderer.ts` | `BubbleRenderer.ts` |
| Game category: ESPORTS | Game category: ESPORTS |

Bubble Battle is esport-only. Skip Step 7c (social room components).
Do Step 7b (EsportGameSettings + AgeVerificationModal).

---

## PART C: DOU DIZHU (PixiJS) -- MEDIUM EFFORT

### Step 1-3: Same as Candy Duel (React deps + Tailwind, vite.config, tsconfig)

### Step 4: Create `src/main.tsx` -- Same as Candy Duel

Use `DdzBridge` instead of `DeskillzBridge`:

```tsx
import { DdzBridge } from './sdk/DdzBridge'

const instance = DdzBridge.getInstance({ ... })
;(window as any).DeskillzBridge = { getInstance: () => instance }
```

### Step 5: Create `src/App.tsx`

Same as Candy Duel, but add social game routes:

```tsx
import HostDashboardPage from './screens/HostDashboardPage'
import CreateRoomScreen from './screens/CreateRoomScreen'
import RoomLobbyScreen from './screens/RoomLobbyScreen'

// Add these routes:
<Route path="/host" element={<HostDashboardPage />} />
<Route path="/rooms/create" element={<CreateRoomScreen />} />
<Route path="/rooms/:roomId" element={<RoomLobbyScreen />} />
```

### Step 6 -- Create `src/screens/GameScreen.tsx` for PixiJS

PixiJS creates its own canvas. Use `useRef<HTMLDivElement>` not `<canvas>`:

```tsx
import { useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

export default function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { state } = useLocation()

  useEffect(() => {
    if (!containerRef.current) return

    const game = new DouDizhuGame({
      container: containerRef.current,
      matchData: state?.matchData,
      onGameEnd: async (result) => {
        await DeskillzBridge.getInstance().submitScore({ score: result.score })
        navigate('/results', { state: { result } })
      },
    })

    return () => { try { game.destroy() } catch {} }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
```

### Step 6b -- Update DouDizhuGame to accept a container element

```typescript
// Change your existing DouDizhuGame constructor:
// FROM:
constructor() {
  this.app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight })
  document.getElementById('game-container')?.appendChild(this.app.view as HTMLCanvasElement)
}

// TO:
constructor(options: { container: HTMLElement; onGameEnd: (result: any) => void; matchData?: any }) {
  this.app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight })
  options.container.appendChild(this.app.view as HTMLCanvasElement)
  this.onGameEnd = options.onGameEnd
}
```

### Step 7-7b: Same as Part A

Copy all 11 core files + 8 room components (Dou Dizhu is a social game).

### Step 8-11: Same as Part A

Build lobby screens including HostDashboardPage, CreateRoomScreen, RoomLobbyScreen.

### Dou Dizhu Specific: Protected Files

```
DO NOT TOUCH:
  ai/           -- All AI decision logic
  engine/       -- Card engine, game state
  renderer/     -- PixiJS rendering
  types/        -- Game type definitions
  i18n.ts       -- Internationalisation
  DdzBridge.ts  -- Game-specific bridge subclass
  SocialGameManager.ts -- Rake, chip tracking
```

### Dou Dizhu Testing Checklist

- [ ] All Candy Duel checklist items
- [ ] PixiJS application mounts inside React div (no blank screen)
- [ ] WebGL context initialises correctly
- [ ] Card sprites render at correct size
- [ ] game.destroy() cleans up WebGL context (no memory leak on remount)
- [ ] Sound plays on first user interaction
- [ ] BuyInModal opens on room join (social game)
- [ ] TurnTimer displays during each player's turn
- [ ] RebuyModal triggers when balance hits 0
- [ ] Host dashboard loads with tier and earnings data
- [ ] All 14 existing game files compile with 0 errors

---

## COMMON ISSUES AND FIXES

### Hooks return null / screens are blank

```typescript
// MUST be in main.tsx BEFORE ReactDOM.render():
;(window as any).DeskillzBridge = { getInstance: () => instance }
```

Verify: `window.DeskillzBridge.getInstance()` in browser console.

### Shared components render as unstyled boxes

Tailwind CSS not configured. Run all five steps:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Update `tailwind.config.js` content paths, create `src/index.css` with @tailwind directives,
import `./index.css` in `main.tsx`. Restart dev server.

### QuickPlay shows loading spinner forever

Admin has not created a QuickPlayConfig for the game's gameId. Ask the admin
to create one in the Deskillz admin panel. Once created, the card renders immediately.

### Empty tournament list

Correct behaviour -- no tournaments exist for the gameId yet. Admin must create
a test tournament. Do NOT add mock data.

### "DeskillzUI is not defined"

Remove all `DeskillzUI.*` calls. The UMD bundle is permanently retired:
- `DeskillzUI.renderLobby()` -- React handles this automatically
- `DeskillzUI.showLobby()` -- `navigate('/lobby')`
- `DeskillzUI.hideLobby()` -- navigate to `/game` route

### PixiJS "context already lost" on remount

Add try-catch around `app.destroy()` in the cleanup. React StrictMode mounts/unmounts
twice in development -- remove `<React.StrictMode>` from production builds.

### Canvas wrong size

Set explicit pixel dimensions in useEffect, not CSS percentages.

---

## SUMMARY: FILES PER GAME

| Game | Type | Core files | Room files | Total shared |
|------|------|:----------:|:----------:|:------------:|
| Candy Duel | Esport | 11 | 2 (EsportSettings + AgeVerify) | 13 |
| Bubble Battle | Esport | 11 | 2 (EsportSettings + AgeVerify) | 13 |
| Dou Dizhu | Social | 11 | 8 + hook | 20 |

**Game logic: zero changes for all three games.**

---

---

### Step 11 -- PWA Cache-Bust Setup (deskillz-sw.js)

Same as React Game Update Guide v1.5 Step 11. Drop these files:

| File | Location |
|------|----------|
| `deskillz-sw.js` | `public/deskillz-sw.js` |
| `vite-plugin-sw-version.ts` | `src/plugins/vite-plugin-sw-version.ts` |

Add `swVersionPlugin()` to `vite.config.ts` plugins array.
Update `index.html` to register `./deskillz-sw.js` (not `./sw.js`).
Remove any `confirm()` dialog in the SW update handler.
Delete old `public/sw.js` or `public/sw.js.bak`.

Build command:
```powershell
npm run build
$hash = "{0}-{1}" -f ([System.DateTimeOffset]::Now.ToUnixTimeSeconds().ToString("x")), (Get-Random -Maximum 99999999).ToString("x8")
(Get-Content .\dist\deskillz-sw.js -Raw) -replace '__BUILD_HASH__', $hash | Set-Content .\dist\deskillz-sw.js -Encoding UTF8 -NoNewline
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

See React Game Update Guide v1.5 Step 11 for full details and rationale.

---

*Migration Guide v1.6 -- April 4, 2026*
*Applies to: Dou Dizhu, Bubble Battle, Candy Duel*
*For React game updates (Big 2, Mahjong, Thirteen Cards):*
*see DESKILLZ_REACT_GAME_UPDATE_GUIDE.md v1.3*