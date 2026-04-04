# DESKILLZ REACT GAME SDK v3.2 UPDATE GUIDE

## Big 2 | Mahjong | Thirteen Cards (Chinese Poker)

**Version:** 1.5
**Date:** March 30, 2026
**Applies to:** All three React/Vite standalone games
**SDK:** DeskillzBridge v3.2 + @deskillz/game-ui v3.2.0

**Changelog v1.5 (current):**
- Added Step 11: PWA Cache-Bust Setup (deskillz-sw.js + vite-plugin-sw-version)
- Added maxTournamentSize to GameCapabilities interface
- Updated index.html SW registration: ./deskillz-sw.js replaces ./sw.js
- Removed confirm() dialog from SW update handler -- auto-reloads now
- Updated build command: manual hash stamp for deskillz-sw.js after npm run build

**Changelog v1.4:**
- Added Step 10: Game Capabilities integration
- Updated Step 0 file table with GameCapabilities.ts + deskillz-sw.js
- Updated game-specific notes with capabilities values

**Changelog v1.3:**
- DeskillzBridge updated to v3.2 (2,483 lines, 50 methods -- 20 new)
- Added Step 7: Room Components for social games (8 shared UI components)
- Added Step 8: Host Dashboard screen using useHostDashboard hook
- Added Step 9: Leaderboard + Profile screens using new bridge methods
- Step 1 expanded from 8 to 19 files (social games) or 11 files (esport games)
- Updated verification checklist with host dashboard and room component tests
- Score signing (signScore/verifyScore) added for esport anti-cheat

**Changelog v1.2:**
- QuickPlayCard and useQuickPlayQueue updated to v3.2.0
- Social games: point value/currency dropdowns, live Available Games board
- Social games: Create Game + JOIN flow, new 'waiting' state

**Changelog v1.1:**
- Fixed Step 1: added tailwindcss, postcss, autoprefixer
- Added Step 0.5: window.DeskillzBridge requirement

**Changelog v1.0:**
- Initial release: fixed unstyled components, removed useNavigate from QuickPlayCard

---

## WHY THIS UPDATE IS NEEDED

**v3.2 closes the gap between the main Deskillz app and standalone games.**

Previously, the standalone games had shared Tournament and QuickPlay components,
but room UIs (buy-in, cash-out, rebuy, timers) and the host dashboard were rebuilt
from scratch in each game. This caused visual inconsistency and duplicated work.

v3.2 adds:
- 8 shared room components that render identically to the main Deskillz app
- useHostDashboard hook for the Host Dashboard screen
- 20 new DeskillzBridge methods for host, leaderboard, user profiles, and score signing

**Social games (Big 2, Mahjong, Thirteen Cards) need all 19 files.**
Esport games need the 11 core files + EsportGameSettings + AgeVerificationModal = 13 files.

---

## WHAT DOES NOT CHANGE

Your game logic is completely untouched. This update only changes lobby, tournament,
room, and dashboard UI.

| Game | Protected files -- zero changes |
|------|-------------------------------|
| **Big 2** | `Big2AI.ts`, `big2-adapter.ts`, `big2-card-counter.ts`, `big2-card-tracker.ts`, `big2-combo-planner.ts`, `big2-control-flow.ts`, `big2-hand-evaluator.ts`, `big2-strategy.ts`, `ResultsScreen.tsx`, `MainMenu.tsx` |
| **Mahjong** | All `MahjongEngine.*`, `MahjongScorer.*`, `MahjongTile.*`, tile rendering, scoring logic, sound manager |
| **Thirteen Cards** | All game logic files, `ChinesePokerEngine.*`, Midjourney assets, i18n hooks |

---

## STEP 0 -- CONFIRM YOU HAVE THE RIGHT FILES

You need the **v3.2 versions** of these files from the platform team:

| File | Version | How to identify |
|------|---------|-----------------| 
| `DeskillzBridge.ts` | v3.2 | File is ~2,483 lines; has `getHostDashboard()`, `signScore()`, `getGameLeaderboard()`, `requestHostWithdrawal()` |
| `TournamentCard.tsx` | v3.1 | Top comment says `v3.1.0`; uses `bg-gray-900/80`, NOT `bg-gaming-dark` |
| `QuickPlayCard.tsx` | v3.2 | Has social board + create/join flow; NO `useNavigate` import |
| `useQuickPlayQueue.ts` | v3.2 | Has `availableGames`, `createGame()`, `joinGame()` |
| `useHostDashboard.ts` | v3.2 | [NEW] Has `getTierDisplay()`, `verifyAge()`, `requestWithdrawal()` |
| Room components (8 files) | v3.2 | [NEW] BuyInModal, CashOutModal, RebuyModal, LowBalanceWarning, TurnTimer, PauseRequestModal, SocialGameSettings, AgeVerificationModal |

If you have v3.0 or v3.1 files, **replace ALL of them** with v3.2.

---

## STEP 0.5 -- EXPOSE BRIDGE ON window (CRITICAL -- DO THIS BEFORE STEP 1)

The shared hooks (`useEnrollmentStatus`, `useQuickPlayQueue`, `useHostDashboard`)
access the bridge at runtime via `(window as any).DeskillzBridge.getInstance()`.
If your game initialises its own bridge subclass but never assigns it to
`window.DeskillzBridge`, the hooks silently return `null` and nothing works.

**Fix: one line in your `main.tsx`, immediately after bridge creation:**

```tsx
// src/main.tsx -- after bridge init, BEFORE ReactDOM.render()
const instance = Big2Bridge.getInstance({ ... })

// CRITICAL: shared hooks read from here at runtime
;(window as any).DeskillzBridge = { getInstance: () => instance }

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

### Game-specific examples

**Big 2:** `Big2Bridge.getInstance({ ... })`
**Mahjong:** `MahjongBridge.getInstance({ ... })`
**Thirteen Cards:** `ThirteenCardsBridge.getInstance({ ... })`

All three use the same `(window as any).DeskillzBridge = { getInstance: () => instance }` pattern.

---

## STEP 1 -- DROP THE FILES

### Core files (ALL games -- esport and social):

```
FROM ZIP src/sdk/DeskillzBridge.ts
  -> YOUR_GAME/src/sdk/DeskillzBridge.ts              REPLACE

FROM ZIP src/components/tournaments/TournamentCard.tsx
  -> YOUR_GAME/src/components/tournaments/TournamentCard.tsx    REPLACE

FROM ZIP src/components/tournaments/QuickPlayCard.tsx
  -> YOUR_GAME/src/components/tournaments/QuickPlayCard.tsx     REPLACE

FROM ZIP src/hooks/useEnrollmentStatus.ts
  -> YOUR_GAME/src/hooks/useEnrollmentStatus.ts        REPLACE

FROM ZIP src/hooks/useQuickPlayQueue.ts
  -> YOUR_GAME/src/hooks/useQuickPlayQueue.ts          REPLACE

FROM ZIP src/components/ui/Badge.tsx
  -> YOUR_GAME/src/components/ui/Badge.tsx             REPLACE

FROM ZIP src/components/ui/Button.tsx
  -> YOUR_GAME/src/components/ui/Button.tsx            REPLACE

FROM ZIP src/components/ui/Card.tsx
  -> YOUR_GAME/src/components/ui/Card.tsx              REPLACE

FROM ZIP src/bridge-types.ts
  -> YOUR_GAME/src/bridge-types.ts                     NEW or REPLACE

FROM ZIP src/utils.ts
  -> YOUR_GAME/src/utils.ts                            NEW or REPLACE

FROM ZIP src/styles/tokens.css
  -> YOUR_GAME/src/styles/tokens.css                   NEW or REPLACE
```

### Social game files (Big 2, Mahjong, Thirteen Cards ONLY):

```
FROM ZIP src/hooks/useHostDashboard.ts
  -> YOUR_GAME/src/hooks/useHostDashboard.ts           NEW

FROM ZIP src/components/rooms/BuyInModal.tsx
  -> YOUR_GAME/src/components/rooms/BuyInModal.tsx     NEW

FROM ZIP src/components/rooms/CashOutModal.tsx
  -> YOUR_GAME/src/components/rooms/CashOutModal.tsx   NEW

FROM ZIP src/components/rooms/RebuyModal.tsx
  -> YOUR_GAME/src/components/rooms/RebuyModal.tsx     NEW

FROM ZIP src/components/rooms/LowBalanceWarning.tsx
  -> YOUR_GAME/src/components/rooms/LowBalanceWarning.tsx   NEW

FROM ZIP src/components/rooms/TurnTimer.tsx
  -> YOUR_GAME/src/components/rooms/TurnTimer.tsx      NEW

FROM ZIP src/components/rooms/PauseRequestModal.tsx
  -> YOUR_GAME/src/components/rooms/PauseRequestModal.tsx   NEW

FROM ZIP src/components/rooms/SocialGameSettings.tsx
  -> YOUR_GAME/src/components/rooms/SocialGameSettings.tsx  NEW

FROM ZIP src/components/rooms/AgeVerificationModal.tsx
  -> YOUR_GAME/src/components/rooms/AgeVerificationModal.tsx NEW
```

**Verify immediately after dropping files:**

```powershell
npx tsc --noEmit
```

Zero errors required before proceeding.

Common errors and fixes:

| Error | Fix |
|-------|-----|
| `Cannot find module 'framer-motion'` | `npm install framer-motion` |
| `Cannot find module 'lucide-react'` | `npm install lucide-react` |
| `Cannot find module 'react-hot-toast'` | `npm install react-hot-toast` |
| `Cannot find module 'clsx'` | `npm install clsx tailwind-merge` |
| `Cannot find module '../../utils'` | Ensure `src/utils.ts` exists with `cn()` export |

---

## STEP 2 -- REWRITE TournamentListScreen.tsx

Remove `MOCK_TOURNAMENTS` and custom card JSX. Replace with shared TournamentCard:

```tsx
// src/screens/TournamentListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'
import TournamentCard from '../components/tournaments/TournamentCard'
import { useEnrollmentStatus } from '../hooks/useEnrollmentStatus'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

function TournamentRow({ tournament }: { tournament: any }) {
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
      appUrl={undefined}
      onRegister={() => register()}
      onCheckIn={() => checkIn()}
    />
  )
}

export default function TournamentListScreen() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gameId = DeskillzBridge.getInstance().getConfig().gameId

  const loadTournaments = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await DeskillzBridge.getInstance().getTournaments({ gameId })
      setTournaments(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load tournaments')
    } finally { setLoading(false) }
  }, [gameId])

  useEffect(() => { loadTournaments() }, [loadTournaments])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading tournaments...</div>
  if (error) return <div style={{ padding: '1rem', color: '#f87171' }}>{error} <button onClick={loadTournaments} style={{ marginLeft: 8, color: '#06b6d4' }}>Retry</button></div>
  if (tournaments.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No active tournaments right now.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
      {tournaments.map((t) => <TournamentRow key={t.id} tournament={t} />)}
    </div>
  )
}
```

---

## STEP 3 -- ADD QuickPlayPage.tsx

```tsx
// src/screens/QuickPlayPage.tsx (NEW FILE)
import { useNavigate } from 'react-router-dom'
import QuickPlayCard from '../components/tournaments/QuickPlayCard'
import { useQuickPlayQueue } from '../hooks/useQuickPlayQueue'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

export default function QuickPlayPage() {
  const navigate = useNavigate()
  const gameId = DeskillzBridge.getInstance().getConfig().gameId
  const qp = useQuickPlayQueue(gameId)

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

---

## STEP 4 -- ADD ROUTES IN App.tsx

```tsx
// App.tsx -- add these imports
import QuickPlayPage from './screens/QuickPlayPage'
import HostDashboardPage from './screens/HostDashboardPage'  // Step 8

// App.tsx -- add these routes
<Route path="/quick-play" element={<QuickPlayPage />} />
<Route path="/host" element={<HostDashboardPage />} />
```

---

## STEP 5 -- UPDATE LOBBY TABS

In your `LobbyScreen.tsx`, update tab navigation:

```tsx
const navigate = useNavigate()

// Quick Play tab
onClick={() => navigate('/quick-play')}

// Host Dashboard tab (social games only)
onClick={() => navigate('/host')}
```

---

## STEP 6 -- VERIFY CORE (before room components)

```powershell
npx tsc --noEmit
npx vite build
```

If both pass, tournament list and QuickPlay are working. Proceed to Step 7.

---

## STEP 7 -- ROOM COMPONENTS (Social Games Only)

**Skip this step if your game is esport-only (Candy Duel, Bubble Battle).**
**Esport games: see Step 7b below for EsportGameSettings instead.**

The 8 room components are pure display components -- they accept props and render UI.
Your game screens call bridge methods and pass the results as props.

### 7a. Update CreateRoomScreen.tsx

The host's Create Room modal supports two modes: **Cash Game** (rake-based, open-ended)
and **Tournament** (bracket, entry fee, prize pool). The `SocialGameSettings` component
handles both via a mode toggle at the top.

```tsx
import SocialGameSettings, { createDefaultSocialGameConfig } from '../components/rooms/SocialGameSettings'
import AgeVerificationModal from '../components/rooms/AgeVerificationModal'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

// In your component:
const [gameConfig, setGameConfig] = useState(createDefaultSocialGameConfig('BIG_TWO'))
const [showAgeVerify, setShowAgeVerify] = useState(false)

// Before creating room, check age verification:
const handleCreateRoom = async () => {
  const ageStatus = await DeskillzBridge.getInstance().checkAgeVerified()
  if (!ageStatus.isVerified) {
    setShowAgeVerify(true)
    return
  }

  if (gameConfig.socialMode === 'CASH_GAME') {
    // Cash Game — rake-based, open-ended
    await DeskillzBridge.getInstance().createSocialRoom({
      gameType: gameConfig.gameType,
      pointValue: gameConfig.pointValueUsd,       // Host sets $0.01 to $100
      rakePercent: gameConfig.rakePercentage,      // Host sets 5% to 10%
      rakeCap: gameConfig.rakeCapPerRound,
      turnTimerSeconds: gameConfig.turnTimerSeconds,
      pointTarget: gameConfig.pointTarget,         // Big 2: race to X pts, Mahjong: 4/8/16 rounds
      maxBid: gameConfig.maxBid,
      springBonus: gameConfig.springBonus,
      visibility: gameConfig.visibility,
      hostAsPlayer: gameConfig.hostRole === 'PLAYER',
      currency: gameConfig.currency,
    })
  } else {
    // Tournament — bracket structure with entry fee and prize pool
    await DeskillzBridge.getInstance().createSocialRoom({
      gameType: gameConfig.gameType,
      socialMode: 'TOURNAMENT',
      entryFee: gameConfig.entryFee,
      entryCurrency: gameConfig.entryCurrency,
      prizeDistribution: gameConfig.prizeDistribution,
      numberOfTables: gameConfig.numberOfTables,
      seatsPerTable: gameConfig.seatsPerTable,
      pointTarget: gameConfig.pointTarget,
      turnTimerSeconds: gameConfig.turnTimerSeconds,
      visibility: gameConfig.visibility,
      hostAsPlayer: gameConfig.hostRole === 'PLAYER',
    })
  }
}

// In JSX — lockedGameType hides the game picker in standalone apps:
<SocialGameSettings
  lockedGameType="BIG_TWO"
  config={gameConfig}
  onChange={setGameConfig}
/>
<AgeVerificationModal
  isOpen={showAgeVerify}
  onClose={() => setShowAgeVerify(false)}
  onVerify={async () => { await DeskillzBridge.getInstance().verifyAge() }}
/>
```

**Cash Game mode shows:** point value (free input $0.01-$100), rake % (5-10%), rake cap,
game end condition (Big 2: race to pts / Mahjong: 1 wind 4 rounds, 2 winds 8 rounds,
full game 16 rounds), max bid, spring bonus toggle.

**Tournament mode shows:** entry fee, prize split presets, number of tables, seats per table,
point target, turn timer, tournament preview card.

### 7b. Update RoomLobbyScreen.tsx

Add `BuyInModal`, `RebuyModal`, `LowBalanceWarning`, `TurnTimer`, `CashOutModal`,
and `PauseRequestModal`:

```tsx
import BuyInModal, { createBuyInConfig } from '../components/rooms/BuyInModal'
import CashOutModal from '../components/rooms/CashOutModal'
import RebuyModal, { createRebuyConfig } from '../components/rooms/RebuyModal'
import LowBalanceWarning from '../components/rooms/LowBalanceWarning'
import TurnTimer from '../components/rooms/TurnTimer'
import PauseRequestModal from '../components/rooms/PauseRequestModal'

// BuyInModal -- shown when player joins room
<BuyInModal
  isOpen={showBuyIn}
  onClose={() => setShowBuyIn(false)}
  onConfirm={async (amount, currency) => {
    await DeskillzBridge.getInstance().roomBuyIn(amount, currency)
    setShowBuyIn(false)
  }}
  config={createBuyInConfig(room.pointValueUsd, room.entryCurrency, room.maxBuyIn)}
  roomName={room.name}
  gameName="Big 2"
/>

// RebuyModal -- shown when player balance hits 0
<RebuyModal
  isOpen={playerBusted}
  onClose={() => setPlayerBusted(false)}
  onRebuy={async (amount) => {
    await DeskillzBridge.getInstance().roomBuyIn(amount, room.entryCurrency)
    setPlayerBusted(false)
  }}
  onLeaveRoom={() => { DeskillzBridge.getInstance().leaveRoom(); navigate('/lobby') }}
  config={createRebuyConfig(room.pointValueUsd, room.entryCurrency, rebuyCount)}
  roomName={room.name}
  walletBalance={walletUsdBalance}
/>

// CashOutModal -- shown when player wants to leave
<CashOutModal
  isOpen={showCashOut}
  onClose={() => setShowCashOut(false)}
  onConfirm={async () => {
    await DeskillzBridge.getInstance().roomCashOut()
    navigate('/lobby')
  }}
  stats={sessionStats}
  roomName={room.name}
  entryCurrency={room.entryCurrency}
/>

// LowBalanceWarning -- floating toast during gameplay
<LowBalanceWarning
  currentBalance={chipBalance}
  pointValueUsd={room.pointValueUsd}
  onRebuy={() => setShowBuyIn(true)}
/>

// TurnTimer -- during each player's turn
<TurnTimer
  totalSeconds={room.turnTimerSeconds}
  remainingSeconds={turnTimeLeft}
  isMyTurn={isMyTurn}
  isRunning={!isPaused}
  currentPlayerName={currentPlayer?.username}
  onTimeExpired={handleAutoPass}
/>
```

---

## STEP 7b -- ESPORT ROOM SETTINGS (Esport Games Only)

**Skip this step if your game is social (Big 2, Mahjong, Thirteen Cards).**

Esport games need `EsportGameSettings` and `AgeVerificationModal` for private room creation.

Copy these 2 files from the SDK ZIP:
```
FROM ZIP src/components/rooms/EsportGameSettings.tsx     -> YOUR_GAME/src/components/rooms/
FROM ZIP src/components/rooms/AgeVerificationModal.tsx   -> YOUR_GAME/src/components/rooms/
```

### Update CreateRoomScreen.tsx for esport rooms:

```tsx
import EsportGameSettings, { createDefaultEsportGameConfig } from '../components/rooms/EsportGameSettings'
import AgeVerificationModal from '../components/rooms/AgeVerificationModal'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

// In your component:
const [gameConfig, setGameConfig] = useState(createDefaultEsportGameConfig())
const [showAgeVerify, setShowAgeVerify] = useState(false)

const handleCreateRoom = async () => {
  const ageStatus = await DeskillzBridge.getInstance().checkAgeVerified()
  if (!ageStatus.isVerified) {
    setShowAgeVerify(true)
    return
  }
  await DeskillzBridge.getInstance().createRoom({
    name: roomName,
    gameId: DeskillzBridge.getInstance().getConfig().gameId,
    entryFee: gameConfig.entryFee,
    entryCurrency: gameConfig.entryCurrency,
    minPlayers: gameConfig.minPlayers,
    maxPlayers: gameConfig.maxPlayers,
    mode: gameConfig.mode,
    matchDuration: gameConfig.matchDurationSeconds,
    roundsCount: gameConfig.roundsCount,
    prizeDistribution: gameConfig.prizeDistribution,
    visibility: gameConfig.visibility,
  })
}

// In JSX:
<EsportGameSettings config={gameConfig} onChange={setGameConfig} />
<AgeVerificationModal
  isOpen={showAgeVerify}
  onClose={() => setShowAgeVerify(false)}
  onVerify={async () => { await DeskillzBridge.getInstance().verifyAge() }}
/>
```

### What esport rooms do NOT need:

| Social Component | Esport Equivalent |
|-----------------|-------------------|
| BuyInModal (variable chips) | Not needed -- fixed entry fee paid on join |
| CashOutModal (leave anytime) | Not needed -- prizes auto-distributed at match end |
| RebuyModal (bust recovery) | Not needed -- eliminated = out |
| LowBalanceWarning | Not needed -- no chip balance to track |
| TurnTimer (per-turn) | Not needed -- match has a total duration set at creation |
| PauseRequestModal | Not needed -- esport matches don't pause |
| SocialGameSettings | Replaced by EsportGameSettings |

---

## STEP 8 -- HOST DASHBOARD (Social Games Only)

**Skip this step if your game is esport-only.**

Create `src/screens/HostDashboardPage.tsx`:

The standalone host dashboard is a **focused operational view** — just enough for the
host to manage their rooms and track earnings. For the full dashboard with badges,
level progression, tier comparisons, room templates, and settings, a deep link takes
the user to the main Deskillz app.

```tsx
// src/screens/HostDashboardPage.tsx (NEW FILE)
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useHostDashboard, getTierDisplay } from '../hooks/useHostDashboard'
import {
  Crown, DollarSign, Users, Plus, ExternalLink, RefreshCw,
  ArrowUpRight, Clock, Copy, Check,
} from 'lucide-react'
import { DeskillzBridge } from '../sdk/DeskillzBridge'

// Deep link to full host dashboard on main app
const FULL_DASHBOARD_URL = 'https://deskillz.games/host'

export default function HostDashboardPage() {
  const navigate = useNavigate()
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const {
    profile, earnings, activeRooms, recentSettlements,
    activeTierDisplay, totalEarnings, monthlyEarnings, pendingSettlement,
    isLoading, error, isAgeVerified, refresh, verifyAge, requestWithdrawal,
  } = useHostDashboard()

  // Get the relevant tier for this game type
  const gameId = DeskillzBridge.getInstance().getConfig().gameId

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <RefreshCw style={{ width: 24, height: 24, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        Loading host dashboard...
      </div>
    )
  }

  // ── Age Verification Gate ──
  if (!isAgeVerified) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Crown style={{ width: 56, height: 56, color: '#a855f7', margin: '0 auto 16px' }} />
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Become a Host</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.5 }}>
          Create private rooms, invite friends, earn revenue from every game played.
          You must be 21+ to host rooms.
        </p>
        <button
          onClick={async () => { await verifyAge(); refresh() }}
          style={{
            padding: '14px 36px', background: 'linear-gradient(135deg, #9d4edd, #06b6d4)',
            color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 12, cursor: 'pointer',
          }}
        >
          Verify Age & Start Hosting
        </button>
      </div>
    )
  }

  // ── Main Dashboard ──
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem' }}>

      {/* Tier + Level Header */}
      <div style={{
        padding: 16, borderRadius: 16, marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.1))',
        border: '1px solid rgba(168,85,247,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{activeTierDisplay.icon}</span>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{activeTierDisplay.name}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Level {profile?.hostLevel ?? 1} Host
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Revenue Share</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
              {activeTierDisplay?.hostShare ?? 15}%
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 14, background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>All-Time</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>${totalEarnings.toFixed(2)}</p>
        </div>
        <div style={{ padding: 14, background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>This Month</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>${monthlyEarnings.toFixed(2)}</p>
        </div>
        <div style={{ padding: 14, background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Pending</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#eab308' }}>${pendingSettlement.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/rooms/create')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', background: 'linear-gradient(135deg, #9d4edd, #06b6d4)',
            color: '#fff', fontWeight: 700, border: 'none', borderRadius: 12, cursor: 'pointer',
          }}
        >
          <Plus style={{ width: 18, height: 18 }} /> Create Room
        </button>
        {pendingSettlement > 0 && (
          <button
            onClick={() => requestWithdrawal(pendingSettlement, 'USDT_BSC')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', background: '#1a1a2e', border: '1px solid #22c55e',
              color: '#22c55e', fontWeight: 700, borderRadius: 12, cursor: 'pointer',
            }}
          >
            <ArrowUpRight style={{ width: 18, height: 18 }} /> Withdraw
          </button>
        )}
      </div>

      {/* Active Rooms */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            Active Rooms ({activeRooms.length})
          </h3>
          <button onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <RefreshCw style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
        {activeRooms.length === 0 ? (
          <div style={{
            padding: 24, background: '#1a1a2e', borderRadius: 12, border: '1px dashed #2a2a4a',
            textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>
            No active rooms. Create one to start earning.
          </div>
        ) : (
          activeRooms.map((room) => (
            <div key={room.id} style={{
              padding: 14, background: '#1a1a2e', borderRadius: 12,
              border: '1px solid #2a2a4a', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{room.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {room.gameType || 'Game Room'}
                  </p>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: room.status === 'IN_PROGRESS' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
                  color: room.status === 'IN_PROGRESS' ? '#22c55e' : '#eab308',
                }}>
                  {room.status === 'IN_PROGRESS' ? 'PLAYING' : 'WAITING'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <Users style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                    {room.currentPlayers}/{room.maxPlayers}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <DollarSign style={{ width: 12, height: 12, display: 'inline', marginRight: 2 }} />
                    Rake: ${room.rakeEarned ?? '0.00'}
                  </span>
                </div>
                <button
                  onClick={() => copyRoomCode(room.roomCode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                    borderRadius: 6, cursor: 'pointer', color: '#06b6d4', fontSize: 11,
                  }}
                >
                  {copiedCode === room.roomCode ? (
                    <><Check style={{ width: 12, height: 12 }} /> Copied</>
                  ) : (
                    <><Copy style={{ width: 12, height: 12 }} /> {room.roomCode}</>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Settlements */}
      {recentSettlements.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Recent Earnings</h3>
          {recentSettlements.slice(0, 5).map((s) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', background: '#1a1a2e', borderRadius: 8, marginBottom: 6,
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{s.roomName}</span>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {new Date(s.settledAt).toLocaleDateString()}
                </p>
              </div>
              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
                +${Number(s.hostShare).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Deep Link to Full Dashboard */}
      <a
        href={FULL_DASHBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', width: '100%', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
          color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none',
          cursor: 'pointer', marginBottom: 12,
        }}
      >
        <ExternalLink style={{ width: 16, height: 16 }} />
        View Full Host Dashboard on Deskillz
      </a>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
        Badges, level progression, tier details, and settings are available on the main dashboard.
      </p>
    </div>
  )
}
```

---

## STEP 9 -- VERIFY AND BUILD

```powershell
# TypeScript check -- must be 0 errors
npx tsc --noEmit

# Build check
npx vite build

# ZIP for Cloud Build
Remove-Item .env.local -ErrorAction SilentlyContinue
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

---

## TESTING CHECKLIST

### Core SDK (all 3 games)

- [ ] `npx tsc --noEmit` = 0 errors
- [ ] `npx vite build` succeeds
- [ ] `window.DeskillzBridge.getInstance()` returns bridge object in browser console
- [ ] Login works -- `bridge.isLive === true` after auth
- [ ] Network tab shows real API calls (not guest mode)

### Tournament List

- [ ] Tournament list loads from bridge (no `MOCK_TOURNAMENTS` left)
- [ ] TournamentCard renders with correct badge colours
- [ ] Register/CheckIn/DQ flow works end-to-end
- [ ] DQ countdown ticks in real time

### Quick Play

- [ ] QuickPlayCard renders (no useNavigate crash)
- [ ] Social: point value + currency dropdowns populated from config
- [ ] Social: Available Games board shows open games
- [ ] Social: Create Game + JOIN buttons work
- [ ] Esport: entry fee chips + Play Now queue works
- [ ] Match found fires onMatchStart callback

### Host Dashboard (social games)

- [ ] `/host` route renders HostDashboardPage
- [ ] Age verification modal appears for unverified users
- [ ] After verification, dashboard loads with profile, earnings, tier
- [ ] Active rooms list shows current rooms
- [ ] Create Room button navigates to create screen
- [ ] Earnings show real data (not zeros -- test after hosting a room)

### Room Components (social games)

- [ ] BuyInModal opens when joining room -- quick-select chips work
- [ ] Currency dropdown shows wallet balances
- [ ] Insufficient balance warning appears when needed
- [ ] RebuyModal opens when balance hits 0 -- cannot dismiss without choosing
- [ ] RebuyModal: rebuy adds points, leave exits room
- [ ] CashOutModal shows session P/L summary
- [ ] CashOutModal: blocked during active round
- [ ] LowBalanceWarning toast appears at 20 points
- [ ] TurnTimer counts down with colour changes (normal/warning/critical)
- [ ] PauseRequestModal: request, vote, status sub-modals all render

### Cloud Build

- [ ] `vite.config.ts` has `base: './'` at top level
- [ ] `dist/index.html` at ZIP root
- [ ] No `public/sdk/DeskillzUI.js` in ZIP (retired)
- [ ] APK installs and loads on Android
- [ ] PWA installs via Safari on iOS

---

## SUMMARY: FILES CHANGED PER GAME

### Core files (all 3 games):

| File | Action |
|------|--------|
| `src/sdk/DeskillzBridge.ts` | REPLACE with v3.2 |
| `src/components/tournaments/TournamentCard.tsx` | REPLACE |
| `src/components/tournaments/QuickPlayCard.tsx` | REPLACE with v3.2 |
| `src/hooks/useEnrollmentStatus.ts` | REPLACE |
| `src/hooks/useQuickPlayQueue.ts` | REPLACE with v3.2 |
| `src/components/ui/Badge.tsx` | REPLACE |
| `src/components/ui/Button.tsx` | REPLACE |
| `src/components/ui/Card.tsx` | REPLACE |
| `src/bridge-types.ts` | NEW or REPLACE |
| `src/utils.ts` | NEW or REPLACE |
| `src/styles/tokens.css` | NEW or REPLACE |
| `src/screens/TournamentListScreen.tsx` | REWRITE |
| `src/screens/QuickPlayPage.tsx` | NEW |
| `src/App.tsx` | ADD routes |
| `public/sdk/DeskillzUI.js` | DELETE if present |

### Social game files (Big 2, Mahjong, Thirteen Cards):

| File | Action |
|------|--------|
| `src/hooks/useHostDashboard.ts` | NEW |
| `src/components/rooms/BuyInModal.tsx` | NEW |
| `src/components/rooms/CashOutModal.tsx` | NEW |
| `src/components/rooms/RebuyModal.tsx` | NEW |
| `src/components/rooms/LowBalanceWarning.tsx` | NEW |
| `src/components/rooms/TurnTimer.tsx` | NEW |
| `src/components/rooms/PauseRequestModal.tsx` | NEW |
| `src/components/rooms/SocialGameSettings.tsx` | NEW |
| `src/components/rooms/AgeVerificationModal.tsx` | NEW |
| `src/screens/HostDashboardPage.tsx` | NEW |

### Esport game files (Candy Duel, Bubble Battle, future arcade/puzzle games):

| File | Action |
|------|--------|
| `src/components/rooms/EsportGameSettings.tsx` | NEW |
| `src/components/rooms/AgeVerificationModal.tsx` | NEW |

**Total per social game: 11 files replaced, 1 screen rewritten, 11 new files, 2 routes added.**
**Total per esport game: 11 files replaced, 1 screen rewritten, 3 new files (QuickPlayPage + EsportGameSettings + AgeVerificationModal), 2 routes added.**
**Game logic: zero changes.**

---

## GAME-SPECIFIC NOTES

### Big 2

- All `Big2AI.ts` and `big2-*.ts` game logic files are completely untouched.
- `CreateRoomScreen.tsx` and `RoomLobbyScreen.tsx` -- integrate new room components
  per Step 7 but keep existing game-specific logic (straight rules, last-card rules).
- `socialOnly={true}` on CreateRoomScreen should remain.

### Mahjong

- **Known bugs remain** (pre-existing, not introduced by v3.2):
  MahjongScorer discard-win payment, Cantonese chicken hand, STYLE_INFO min=0,
  HowToPlay.tsx rewrite needed. These are tracked separately.
- All Mahjong scoring, tile rendering, sound files are untouched.
- `App.tsx` SDK v3.1 patch (14th file) is still pending from previous session.

### Thirteen Cards (Chinese Poker)

- Replace the placeholder `DeskillzBridge.ts` with the real v3.2 file.
- Midjourney assets and i18n hooks are untouched.
- Landscape 2x2 grid layout is untouched.

---

---

## Step 11 -- PWA Cache-Bust Setup (deskillz-sw.js)

Cloud Build Docker worker runs `workbox generateSW` which creates a `sw.js` file.
To prevent it from overwriting your custom service worker, we use `deskillz-sw.js`.

### 11a. Drop these files into your game:

| File | Location | Source |
|------|----------|--------|
| `deskillz-sw.js` | `public/deskillz-sw.js` | From SDK `public/` |
| `vite-plugin-sw-version.ts` | `src/plugins/vite-plugin-sw-version.ts` | From SDK `src/plugins/` |

Delete any old `public/sw.js` or `public/sw.js.bak`.

### 11b. Add plugin to vite.config.ts:

```typescript
import { swVersionPlugin } from './src/plugins/vite-plugin-sw-version';

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  // ... rest unchanged
});
```

### 11c. Update index.html SW registration:

Replace the service worker registration script in your index.html:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      var scope = new URL('./', window.location.href).pathname;
      navigator.serviceWorker.register('./deskillz-sw.js', { scope: scope })
        .then(function(reg) {
          console.log('[SW] Registered:', reg.scope);
          reg.addEventListener('updatefound', function() {
            var nw = reg.installing;
            if (nw) {
              nw.addEventListener('statechange', function() {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                  nw.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch(function(err) { console.warn('[SW] Failed:', err); });
    });
  }
</script>
```

IMPORTANT: No `confirm()` dialog -- auto-reloads immediately on update.

### 11d. Build command (with manual hash stamp):

```powershell
npm run build
$hash = "{0}-{1}" -f ([System.DateTimeOffset]::Now.ToUnixTimeSeconds().ToString("x")), (Get-Random -Maximum 99999999).ToString("x8")
(Get-Content .\dist\deskillz-sw.js -Raw) -replace '__BUILD_HASH__', $hash | Set-Content .\dist\deskillz-sw.js -Encoding UTF8 -NoNewline
Write-Host "[sw-version] Stamped deskillz-sw.js with build hash: $hash" -ForegroundColor Green
Compress-Archive -Path .\dist\* -DestinationPath .\game-cloud-build.zip -Force
```

The hash stamp is done manually because Vite plugin caching can prevent the
`closeBundle` hook from running the updated code. The PowerShell command is reliable.

### Why deskillz-sw.js (not sw.js)?

Cloud Build Docker worker always runs `workbox generateSW` which creates `sw.js`.
By naming our file `deskillz-sw.js`, Workbox never touches it. Both files exist
on R2 but `index.html` registers `deskillz-sw.js` (ours), not `sw.js` (Workbox).

---

*React Game Update Guide v1.5 -- April 4, 2026*
*Applies to: Big 2, Mahjong, Thirteen Cards (Chinese Poker)*
*For non-React migration (Dou Dizhu, Bubble Battle, Candy Duel):*
*see DESKILLZ_NON_REACT_MIGRATION_GUIDE.md v1.4*