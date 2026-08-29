<!-- sdk-version: v3.6.1 | released: 2026-08-29 -->
# Deskillz Web SDK

Framework-agnostic SDK for integrating competitive gaming tournaments with cryptocurrency prizes into web applications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, or vanilla JavaScript
- **Full TypeScript Support** - Complete type definitions for all APIs
- **Real-Time Updates** - WebSocket-based matchmaking, lobby, and tournament events
- **Cryptocurrency Payments** - Support for BNB, USDT, USDC on BSC and TRON networks
- **Anti-Cheat Score Signing** - HMAC-SHA256 per-session score signatures built into the bridge
- **Tournament Deep-Link Launch** - Single-use launch token capture and exchange
- **Per-Game Isolation** - Namespaced auth tokens and service worker caches (multi-game safe)
- **Tree-Shakeable** - Only bundle what you use
- **Two Integration Modes** - Full SDK or simplified Bridge pattern

## Two Ways to Integrate

| Approach | Best For | Files Needed |
|----------|----------|-------------|
| **DeskillzBridge** (Recommended) | Game developers building standalone web games | 3 files (see File Inventory below) |
| **Full DeskillzSDK** | Advanced integrations needing individual service access | Full `src/` folder (~13,500 lines across 45 files) |

Most game developers should use the **DeskillzBridge** approach. It bundles everything into a single bridge file with zero npm dependencies (socket.io-client is optional for realtime).

---

## File Inventory (Bridge Integration)

| File | From (this repo) | To (your game) | Ownership |
|------|------------------|----------------|-----------|
| `DeskillzBridge.ts` | `src/sdk/DeskillzBridge.ts` | `src/sdk/DeskillzBridge.ts` | **SDK-owned. Never modify at game level.** Wholesale-replaced on each SDK release. |
| `useLaunchDeepLink.ts` | `src/hooks/useLaunchDeepLink.ts` | `src/hooks/useLaunchDeepLink.ts` | SDK-owned React hook for the launch contract. |
| `deskillz-sw.js` | `public/deskillz-sw.js` | `public/deskillz-sw.js` | **SDK-owned. Never modify at game level.** |

Rules that keep six games on one SDK:

- `DeskillzBridge.ts` and `deskillz-sw.js` are canonical in **this repo** (deskillz-web-sdk). Do not fork, patch, or hand-edit copies inside a game. When a new SDK version drops, replace the files wholesale.
- If your game needs custom behavior, **extend** the bridge in your own subclass file (see "Extend for Your Game" below). Never edit `DeskillzBridge.ts` itself.
- The service worker is named `deskillz-sw.js`, not `sw.js`. Workbox and some build tooling overwrite `sw.js`; the distinct name prevents the collision.
- The Vite SW-version plugin ships as `vite-plugin-sw-version.mjs`. Use the `.mjs` file. Do not keep a `.ts` copy of the plugin in the game repo (esbuild's compile cache can serve stale plugin code from `.ts`).

### Quick copy (PowerShell, from the monorepo root)

```powershell
Copy-Item deskillz-web-sdk\src\sdk\DeskillzBridge.ts      your-game\src\sdk\
Copy-Item deskillz-web-sdk\src\hooks\useLaunchDeepLink.ts your-game\src\hooks\
Copy-Item deskillz-web-sdk\public\deskillz-sw.js          your-game\public\
```

---

## Quick Start: DeskillzBridge (Recommended for Games)

### 1. Copy Files

Copy the three files listed in the File Inventory into your game project:

```
your-game/
  public/
    deskillz-sw.js           # Copy from deskillz-web-sdk/public/  (do not modify)
  src/
    sdk/
      DeskillzBridge.ts      # Copy from deskillz-web-sdk/src/sdk/ (do not modify)
      YourGameBridge.ts      # You create this (extends DeskillzBridge)
    hooks/
      useLaunchDeepLink.ts   # Copy from deskillz-web-sdk/src/hooks/
```

### 2. Optional: Install socket.io-client

```bash
npm install socket.io-client
```

This is only needed if your game uses realtime multiplayer features. The bridge degrades gracefully without it.

### 3. Initialize -- EXACTLY ONCE

Create the bridge and initialize it in your app entry point (`main.tsx`), **before** React renders, and expose the instance on `window` for shared hooks:

```typescript
// main.tsx
import { DeskillzBridge } from './sdk/DeskillzBridge';

// 1. Capture ?launch= / ?token= params BEFORE anything can mutate the URL.
DeskillzBridge.captureLaunchParams();

// 2. Create the singleton.
const bridge = DeskillzBridge.getInstance({
  gameId: 'YOUR_GAME_ID',       // Placeholder -- Cloud Build injects the real value
  gameKey: 'YOUR_API_KEY',      // Placeholder -- Cloud Build injects the real value
  apiBaseUrl: 'https://api.deskillz.games',
  socketUrl: 'wss://ws.deskillz.games/lobby',
  debug: true,
});

// 3. Required: shared hooks resolve the bridge through this global.
(window as any).DeskillzBridge = { getInstance: () => bridge };

// 4. Initialize exactly once. The bridge is single-flight internally:
//    concurrent callers await the same in-flight promise, and a completed
//    initialize() is never re-run. Do NOT try to "re-initialize" on
//    remount, hot-reload, or route change.
await bridge.initialize();
```

Rules:

- Call `initialize()` **exactly once** per page load. The single-flight guard makes accidental duplicates harmless, but code that intentionally calls it twice is a bug.
- **Never** call `DeskillzBridge.getInstance()` at module top level in any file other than `main.tsx`. Module-level calls run before `main.tsx` configures the singleton and will throw or produce a mis-configured instance. Inside components/hooks, resolve it lazily via `window.DeskillzBridge.getInstance()`.
- Remove React `StrictMode` from standalone games. StrictMode double-invokes effects in development and masks or manufactures lifecycle bugs around initialization.

### 4. The Launch Contract (Tournament Deep Links)

When the Deskillz platform launches your game for a tournament or private room match, it opens your hosted `index.html` with a **single-use launch token** in the URL. The contract:

1. `DeskillzBridge.captureLaunchParams()` runs first thing in `main.tsx` (before React, before routing). It snapshots and strips the launch params from the URL.
2. The bridge exchanges the launch token for a session **exactly once**. Launch tokens are single-use on the server: a second exchange attempt fails with an auth error. This is why duplicate `initialize()` calls and page reloads during launch are forbidden.
3. In React games, mount `useLaunchDeepLink()` near the root. It tracks bridge `initialized` / `authenticated` events and routes the player into tournament mode when the exchange completes. Treat any `authed` prop as a seed only -- the hook maintains its own state from bridge events.
4. **Never auto-reload on a launch page.** Service-worker update flows (`updatefound`, `controllerchange`) must not call `location.reload()` while launch params are present or a match is active -- a reload burns the single-use token and strands the player. The canonical SW registration block ships with a query-string guard for this; do not remove it. In-app "update available" prompts must also be suppressed on launch pages.
5. Match end: submit the score (see Score Signing), then return the player to the platform. Do not reload into a fresh session.

### 5. Authenticate (Standalone / Non-Launch Sessions)

```typescript
// Email/password login
const user = await bridge.login('player@example.com', 'password');
console.log('Logged in as:', user.username);

// Register new account
const newUser = await bridge.register('ProGamer', 'player@example.com', 'password');

// Wallet connect (SIWE)
const ethereum = (window as any).ethereum;
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const signMessage = async (msg: string) =>
  ethereum.request({ method: 'personal_sign', params: [msg, accounts[0]] });
const walletUser = await bridge.loginWithWallet(accounts[0], 56, signMessage);
```

Auth tokens are stored in `localStorage` under **per-game namespaced keys** (keyed by `gameId`), so multiple Deskillz games on the same origin never clobber each other's sessions. On first run after upgrading, the bridge copies any legacy un-namespaced tokens forward automatically; the legacy keys themselves are removed in a later cleanup release -- do not depend on them.

### 6. Score Signing (Anti-Cheat)

During launch-token exchange the server issues a per-session `scoreSecret`. The bridge holds it in memory and signs every score submission with HMAC-SHA256 automatically:

```typescript
await bridge.submitScore({
  gameId: 'your-game',
  tournamentId: 't-123',
  score: 15000,
});
// The bridge attaches: signature, timestamp, nonce -- you never handle the secret.
```

Rules:

- Never log, persist, or transmit the `scoreSecret` yourself. It lives only in bridge memory for the session.
- Server verification runs in `log` mode (signatures verified and logged) or `enforce` mode (unsigned/invalid submissions rejected). Build against enforce: always submit through `bridge.submitScore()` -- never hand-roll the HTTP call.
- One score submission per player per match session. Retries are handled inside the bridge.

### 7. Use Platform Features

```typescript
// Wallet
const balance = await bridge.getWalletBalance();
await bridge.deposit('USDT', 50);
await bridge.withdraw('USDT', 25);

// Profile
const stats = await bridge.getPlayerStats();
const history = await bridge.getMatchHistory();

// Private Rooms
const room = await bridge.createRoom({ entryFee: 5, maxPlayers: 4, isSocialGame: true });
await bridge.joinRoom('ABC123');
await bridge.roomBuyIn(100, 'USDT');

// Realtime Events
bridge.connectRealtime();
bridge.onRealtimeEvent('match:found', (data) => console.log('Match!', data));
```

Event subscription supports both styles -- two-arg named events and a single catch-all callback:

```typescript
bridge.on('authenticated', (user) => { /* ... */ });   // named
bridge.on((event, data) => { /* ... */ });             // catch-all
```

### 8. Extend for Your Game

```typescript
import { DeskillzBridge, type BridgeConfig } from './DeskillzBridge';

export class MahjongBridge extends DeskillzBridge {
  private static mahjongInstance: MahjongBridge | null = null;

  protected constructor(config: BridgeConfig) { super(config); }

  static override getInstance(config?: BridgeConfig): MahjongBridge {
    if (!MahjongBridge.mahjongInstance) {
      if (!config) throw new Error('Config required on first init');
      MahjongBridge.mahjongInstance = new MahjongBridge(config);
    }
    return MahjongBridge.mahjongInstance;
  }

  // Game-specific methods
  async submitGameResults(winnerId: string, scores: Record<string, number>) {
    return this.submitScore({
      gameId: this.getConfig().gameId,
      roomId: this.getCurrentRoom()?.id,
      score: scores[winnerId],
      metadata: { scores, winnerId },
    });
  }
}
```

---

## Service Worker and Caching

The canonical service worker is `public/deskillz-sw.js` (SDK-owned).

- **Cache naming:** caches are namespaced per game and per build as `dsk2-<scopekey>-<buildhash>`. The scope key is derived from the hosting path, so multiple games under one origin (e.g. `hosted/<gameId>/pwa/`) never share or evict each other's caches. When verifying in DevTools, check that the cache name **contains** your build hash (other suffixes may follow it).
- **Legacy purge:** the first load after upgrading from the old `dsk-` scheme performs a one-time purge of legacy `dsk-*` caches and logs it to the console. This is expected -- once per browser profile per game.
- **Registration:** register `deskillz-sw.js` from the canonical guarded block in `index.html`. The guard skips reload-on-update behavior when launch params are present (see Launch Contract rule 4).
- **Relative paths:** all asset paths and the SW registration use `./` relative prefixes (never `/`). This is required for R2 subdirectory hosting, APK WebView (`base: './'` in `vite.config.ts`), Electron `file://`, and iOS PWA scope resolution.
- **Build versioning:** `vite-plugin-sw-version.mjs` stamps the build hash into the SW at build time. Keep the plugin as `.mjs`.

---

## Alternative: Full DeskillzSDK (Advanced)

For integrations that need fine-grained control over individual services:

```typescript
import { DeskillzSDK } from '@deskillz/web-sdk';

const sdk = new DeskillzSDK({
  gameId: 'your-game-id',
  gameKey: 'your-game-key',
  apiBaseUrl: 'https://api.deskillz.games',
  debug: true,
});

// Individual service access
const user = await sdk.auth.loginWithEmail({ email, password });
const games = await sdk.games.getGames();
const balances = await sdk.wallet.getBalances();
await sdk.realtime.connect();
sdk.destroy();
```

### Full SDK Modules

| Module | Access | Description |
|--------|--------|-------------|
| `auth` | `sdk.auth` | Authentication (login, register, 2FA, social) |
| `walletAuth` | `sdk.walletAuth` | Wallet-based authentication (SIWE) |
| `twoFactor` | `sdk.twoFactor` | Two-factor authentication management |
| `wallet` | `sdk.wallet` | Wallet balances, deposits, withdrawals |
| `games` | `sdk.games` | Game catalog and details |
| `tournaments` | `sdk.tournaments` | Tournament management and scoring |
| `lobby` | `sdk.lobby` | Queue management and matchmaking |
| `rooms` | `sdk.rooms` | Private room creation and management |
| `spectator` | `sdk.spectator` | Spectator mode for watching games |
| `host` | `sdk.host` | Host system (tiers, badges, earnings) |
| `developer` | `sdk.developer` | Developer portal (dashboard, analytics) |
| `builds` | `sdk.builds` | Game build uploads and management |
| `users` | `sdk.users` | User profiles and settings |
| `leaderboard` | `sdk.leaderboard` | Global and game leaderboards |
| `realtime` | `sdk.realtime` | WebSocket connection and events |
| `scoreSigner` | `sdk.scoreSigner` | HMAC-SHA256 score signing |

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gameId` | `string` | Required | Your game ID from the developer portal |
| `gameKey` | `string` | Required | Your game API key (used for score signing) |
| `apiBaseUrl` | `string` | `'https://api.deskillz.games'` | Backend API URL |
| `socketUrl` | `string` | `'wss://ws.deskillz.games/lobby'` | WebSocket server URL |
| `timeout` | `number` | `120000` | HTTP request timeout (ms) |
| `debug` | `boolean` | `false` | Enable debug logging |
| `storage` | `StorageAdapter` | `LocalStorageAdapter` | Token storage adapter (full SDK only) |
| `autoReconnect` | `boolean` | `true` | Auto-reconnect WebSocket |
| `maxReconnectAttempts` | `number` | `10` | Max reconnection attempts |

---

## Cloud Build Credential Injection

When your web game is built via the Cloud Build service, the build worker automatically injects your real credentials by replacing these exact placeholder strings in the compiled JavaScript:

```typescript
// Use EXACTLY these placeholders in your source:
gameId: 'YOUR_GAME_ID',
gameKey: 'YOUR_API_KEY',
```

Cloud Build will **NOT** detect or replace custom strings like `'demo-key'`, `'my-api-key'`, or `process.env.API_KEY`. Never put real credentials in `.env` or source -- placeholders only.

---

## Critical Integration Rules

These rules were discovered during real game integrations (Big 2, Candy Duel, Thirteen Cards) and apply to ALL web games:

### 1. Never Use Dynamic Import for the SDK

```typescript
// WRONG - silently fails, game runs in guest mode with no error:
const sdkModule = await import('@deskillz/web-sdk');

// CORRECT - use static import of DeskillzBridge.ts:
import { DeskillzBridge } from './sdk/DeskillzBridge';
```

### 2. Initialize Exactly Once, From main.tsx Only

`initialize()` is single-flight, but the contract is one call per page load, made from `main.tsx`. Never call `getInstance()` at module top level outside `main.tsx`, and never re-initialize on remount or route change.

### 3. Never Auto-Reload on a Launch Page

No `location.reload()` from SW update handlers, update prompts, or error recovery while launch params are present or a match is active. Launch tokens are single-use; a reload burns them.

### 4. Wallet Connect Requires a Real Signer

```typescript
// WRONG - falls back to guest mode silently:
await bridge.loginWithWallet('0x1234...demo');

// CORRECT - use window.ethereum for real wallet:
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const signMessage = async (msg: string) =>
  ethereum.request({ method: 'personal_sign', params: [msg, accounts[0]] });
await bridge.loginWithWallet(accounts[0], 56, signMessage);
```

### 5. Use register() for Registration, login() for Login

```typescript
// WRONG - creates no account, username is lost:
await bridge.login(email, password);

// CORRECT:
await bridge.register(username, email, password);
```

### 6. Initialize Wallet Balance to Zero

```typescript
// WRONG - fake balance before any API call:
const [state, setState] = useState({ walletBalance: 1000 });

// CORRECT - fetch after auth:
const [state, setState] = useState({ walletBalance: 0 });
// After login:
const balance = await bridge.getWalletBalance();
```

### 7. Wire All Handlers to Real Bridge Methods

Every UI button (deposit, withdraw, stats, history, wallet connect) must call the corresponding bridge method. Toast-only stubs are not acceptable even for MVP.

### 8. Always Submit Scores Through the Bridge

`bridge.submitScore()` attaches the HMAC signature. Hand-rolled fetch calls to the score endpoint will be rejected once enforce mode is on.

### 9. Use ./ Relative Paths Everywhere

All asset URLs, the SW registration, the manifest `start_url`, and `base` in `vite.config.ts` use `./` relative paths. Absolute `/` paths break subdirectory hosting, APK WebView, and iOS PWA.

### 10. Verify Live Mode After Login

```typescript
const bridge = DeskillzBridge.getInstance();
console.log('Live:', bridge.isLive);                    // Should be: true
console.log('User:', bridge.getCurrentUser()?.id);      // Should NOT start with 'guest_'
console.log('Guest:', bridge.getIsGuest());             // Should be: false
```

---

## API Endpoints Reference

All endpoints use the `/api/v1/` prefix.

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/api/v1/auth/login` |
| Register | POST | `/api/v1/auth/register` |
| Logout | POST | `/api/v1/auth/logout` |
| Token Refresh | POST | `/api/v1/auth/refresh` |
| Wallet Nonce | GET | `/api/v1/auth/nonce?walletAddress=0x...` |
| Wallet Verify (SIWE) | POST | `/api/v1/auth/wallet/verify` |
| User Profile | GET | `/api/v1/users/me` |
| Update Profile | PATCH | `/api/v1/users/me` |
| Player Stats | GET | `/api/v1/users/stats` |
| Match History | GET | `/api/v1/users/match-history` |
| Wallet Balances | GET | `/api/v1/wallet/balance` |
| Balance Total | GET | `/api/v1/wallet/balance/total` |
| Balance by Currency | GET | `/api/v1/wallet/balance/{currency}` |
| Deposit | POST | `/api/v1/wallet/deposit` |
| Withdraw | POST | `/api/v1/wallet/withdraw` |
| Create Room | POST | `/api/v1/private-rooms` |
| Join Room | POST | `/api/v1/private-rooms/join` |
| Leave Room | POST | `/api/v1/private-rooms/{id}/leave` |
| Room Buy-In | POST | `/api/v1/private-rooms/{id}/buy-in` |
| Room Cash-Out | POST | `/api/v1/private-rooms/{id}/cash-out` |
| Submit Score | POST | `/api/v1/tournaments/{id}/score` |

---

## Error Handling

### DeskillzBridge

The bridge catches all errors internally and returns safe defaults for guest mode. For live mode, errors are thrown and should be caught:

```typescript
try {
  await bridge.login(email, password);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Full DeskillzSDK

```typescript
import { DeskillzError, AuthError, NetworkError } from '@deskillz/web-sdk';

try {
  await sdk.auth.loginWithEmail({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Auth failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

---

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

Requires Web Crypto API (used for HMAC-SHA256 score signing).

---

## Cleanup

```typescript
// DeskillzBridge
DeskillzBridge.destroy();

// Full DeskillzSDK
sdk.destroy();
```

---

## Links

- **Developer Portal:** https://deskillz.games/developer
- **Platform:** https://deskillz.games
- **Developer Guide:** See `DESKILLZ_WEB_GAME_DEVELOPER_GUIDELINE.md`
- **Architecture:** See `DESKILLZ_SELF_SUFFICIENT_ARCHITECTURE_FINAL_HANDOFF_v5.md`

## License

MIT License - see [LICENSE](LICENSE) for details.