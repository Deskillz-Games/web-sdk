<!-- sdk-version: v3.7.3 | released: 2026-09-18 -->
<!-- SDK 3.7.1 A2 README -->
# Deskillz Web SDK

Source files that connect a React + Vite web game to the Deskillz platform:
accounts, wallet, tournaments, quick play, private rooms, leaderboards and
disputes. Cloud Build wraps an integrated game as a PWA, an Android APK and a
Windows app.

- API: `https://api.deskillz.games` (REST under `/api/v1`, Socket.IO on the same host)
- Distribution: **GitHub Releases** of this repository. The SDK is not published to npm.
- Full documentation: `DESKILLZ_WEB_GAME_DEVELOPER_GUIDE_v6_0.md` (in the release zip)
- Developer Portal (Game ID, API key, uploads): https://deskillz.games/developer

## Install

1. Download `deskillz-web-sdk-<version>.zip` from the
   [Releases](https://github.com/Deskillz-Games/web-sdk/releases) page.
2. Copy its `src/` and `public/` folders into the same places in your game.
3. Start `index.html` and `.env.production` from `templates/`.
4. Add the dependencies below.

Every file from the release (bridge, hooks, components, `deskillz-sw.js`) is
replaced on each SDK update. Never edit them; put game-specific code in your own
bridge subclass (`src/sdk/<YourGame>Bridge.ts`).

| Release folder | Contents |
|----------------|----------|
| `src/sdk/DeskillzBridge.ts` | The only API layer: auth, launch exchange, score signing, realtime |
| `src/bridge-types.ts`, `src/types/` | Shared types |
| `src/hooks/` | Launch, tournaments, lobby table, quick play, auto-updater, host dashboard |
| `src/components/` | Tournament, quick play, dispute and room UI |
| `src/styles/tokens.css` | Design tokens |
| `src/plugins/vite-plugin-sw-version.mjs` | Stamps a build hash into the service worker |
| `public/deskillz-sw.js` | Service worker |
| `templates/` | `index.html` (service worker block) and `.env.production` |

## Dependencies

| Package | Version |
|---------|---------|
| `react`, `react-dom` | 18.x |
| `tailwindcss` | 3.4+ or 4.x (content must include `./src/**/*.{ts,tsx}`) |
| `framer-motion` | 10.x or later |
| `lucide-react` | 0.383 or later |
| `react-hot-toast` | 2.4+ (mount one `<Toaster />`) |
| `socket.io-client` | 4.7+ (required for realtime) |

## Quick start

```typescript
// main.tsx
import { DeskillzBridge } from './sdk/DeskillzBridge';
import { captureLaunchParams } from './hooks/useLaunchDeepLink';
import './styles/tokens.css';

captureLaunchParams(); // before React renders

const bridge = DeskillzBridge.getInstance({
  gameId: import.meta.env.VITE_GAME_ID || 'YOUR_GAME_ID',
  gameKey: import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.deskillz.games',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'wss://api.deskillz.games',
  debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
});
(window as any).DeskillzBridge = { getInstance: () => bridge };

await bridge.initialize(); // exactly once per page load
```

Keep the literal placeholders `YOUR_GAME_ID` and `YOUR_API_KEY`; Cloud Build
replaces them. Do not use React `StrictMode`.

## Key methods

| Area | Methods and hooks |
|------|-------------------|
| Sign-in | `login`, `register`, `loginWithWallet(address, chainId, sign)`, `logout`, `getIsAuthenticated`, `isLive`, `getCurrentUser`, `on(event, fn)` |
| Launch | `captureLaunchParams`, `useLaunchDeepLink`, `getMyLaunch(tournamentId)`, `useLobbyTable` |
| Scores | `submitScore({ gameId, tournamentId or roomId, score })`, `submitQuickPlayScore(matchId, score)`, `getQuickPlayMatchResults` |
| Realtime | `connectRealtime`, `onRealtimeEvent`, `sendRealtimeMessage`, `isRealtimeConnected` |
| Tournaments | `getTournaments`, `useEnrollmentStatus` + `TournamentCard`, `getTournamentSchedule` |
| Quick play | `useQuickPlayQueue` + `QuickPlayCard` |
| Private rooms | `createRoom`, `createSocialRoom`, `joinRoom`, `startRoom`, `roomBuyIn(amount, currency)`, `roomCashOut`, `leaveRoom`, `invitePlayer`, `getMyInvites`, `respondToInvite` |
| Wallet and ranks | `getWalletBalance`, `getBalanceForCurrency`, `getLeaderboard(limit, period)`, `getMyGameRank`, `getProfile`, `updateProfile` |
| Disputes | `DisputeModal`, `fileDispute`, `getMyDisputes` |
| Game settings | `getGameCapabilities`, `getQuickPlayConfig` |
| Updates | `useAutoUpdater` |

Currencies are chain-qualified: `BNB`, `USDT_BSC`, `USDT_TRON`, `USDC_BSC`,
`USDC_TRON`. The guide's API reference (section 21) lists every endpoint.

## Build and publish

1. Bump `version` in `package.json` (it must match the version you enter in the portal).
2. `npm run build` and note the printed service-worker build stamp.
3. Load-test your engine chunk with Node, then check `npm run preview`.
4. Zip the **contents** of `dist/` with `tar` (never `Compress-Archive`):
   `cd dist`, then `tar -a -c -f ..\your-game-1.2.0.zip *`.
5. Developer Portal -> Game Builds: upload, All Platforms, start.
6. After SUCCESS, open the hosted PWA and confirm the new cache stamp.

Guide section 18 has the full checklist.

## Upgrading

**3.7.0 -> 3.7.1:** documentation only. No code change.

**3.6.x -> 3.7.x:**

1. Replace the bridge, `bridge-types.ts`, hooks, components and
   `public/deskillz-sw.js` with the release copies.
2. Set `VITE_API_BASE_URL=https://api.deskillz.games` and
   `VITE_SOCKET_URL=wss://api.deskillz.games` (no path).
3. Shared tables: take the host seat from `hostUserId` (`getMyLaunch` or `match:launch`).
4. Quick play filling event is `quickPlayFilling`; dispute reason `OPPONENT_ISSUE`.
5. Bump, build, load test, zip with `tar`, upload, confirm the cache stamp.

`CHANGELOG.md` in the release zip lists the changes in each version.

## License

See `LICENSE`.
