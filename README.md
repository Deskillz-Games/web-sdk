# Deskillz Web SDK

Framework-agnostic SDK for integrating competitive gaming tournaments with cryptocurrency prizes into web applications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, or vanilla JavaScript
- **Full TypeScript Support** - Complete type definitions for all APIs
- **Real-Time Updates** - WebSocket-based matchmaking, lobby, and tournament events
- **Cryptocurrency Payments** - Support for BNB, USDT, USDC on BSC and TRON networks
- **Anti-Cheat Protection** - HMAC-SHA256 score signing built-in
- **Tree-Shakeable** - Only bundle what you use
- **Two Integration Modes** - Full SDK or simplified Bridge pattern

## Two Ways to Integrate

| Approach | Best For | Files Needed |
|----------|----------|-------------|
| **DeskillzBridge** (Recommended) | Game developers building standalone web games | 1 file: `DeskillzBridge.ts` (1,172 lines) |
| **Full DeskillzSDK** | Advanced integrations needing individual service access | Full `src/` folder (~13,500 lines across 45 files) |

Most game developers should use the **DeskillzBridge** approach. It bundles everything into a single file with zero npm dependencies (socket.io-client is optional for realtime).

---

## Quick Start: DeskillzBridge (Recommended for Games)

### 1. Copy Files

Copy `DeskillzBridge.ts` from `src/` into your game project:

```
your-game/
  src/
    sdk/
      DeskillzBridge.ts      # Copy from deskillz-web-sdk/src/
      YourGameBridge.ts      # You create this (extends DeskillzBridge)
```

### 2. Optional: Install socket.io-client

```bash
npm install socket.io-client
```

This is only needed if your game uses realtime multiplayer features. The bridge degrades gracefully without it.

### 3. Initialize

```typescript
import { DeskillzBridge } from './sdk/DeskillzBridge';

const bridge = DeskillzBridge.getInstance({
  gameId: 'YOUR_GAME_ID',       // From developer portal
  gameKey: 'YOUR_API_KEY',      // From developer portal (Cloud Build auto-injects)
  apiBaseUrl: 'https://api.deskillz.games',
  socketUrl: 'wss://ws.deskillz.games/lobby',
  debug: true,
});

await bridge.initialize();
```

### 4. Authenticate

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

### 5. Use Platform Features

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

// Score Submission
await bridge.submitScore({ gameId: 'your-game', tournamentId: 't-123', score: 15000 });

// Realtime Events
bridge.connectRealtime();
bridge.onRealtimeEvent('match:found', (data) => console.log('Match!', data));
```

### 6. Extend for Your Game

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

Cloud Build will **NOT** detect or replace custom strings like `'demo-key'`, `'my-api-key'`, or `process.env.API_KEY`.

---

## Critical Integration Rules (Lessons from Big 2)

These rules were discovered during the Big 2 web game integration and apply to ALL web games:

### 1. Never Use Dynamic Import for the SDK

```typescript
// WRONG - silently fails, game runs in guest mode with no error:
const sdkModule = await import('@deskillz/web-sdk');

// CORRECT - use static import of DeskillzBridge.ts:
import { DeskillzBridge } from './sdk/DeskillzBridge';
```

### 2. Wallet Connect Requires a Real Signer

```typescript
// WRONG - falls back to guest mode silently:
await bridge.loginWithWallet('0x1234...demo');

// CORRECT - use window.ethereum for real wallet:
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
const signMessage = async (msg: string) =>
  ethereum.request({ method: 'personal_sign', params: [msg, accounts[0]] });
await bridge.loginWithWallet(accounts[0], 56, signMessage);
```

### 3. Use register() for Registration, login() for Login

```typescript
// WRONG - creates no account, username is lost:
await bridge.login(email, password);

// CORRECT:
await bridge.register(username, email, password);
```

### 4. Initialize Wallet Balance to Zero

```typescript
// WRONG - fake balance before any API call:
const [state, setState] = useState({ walletBalance: 1000 });

// CORRECT - fetch after auth:
const [state, setState] = useState({ walletBalance: 0 });
// After login:
const balance = await bridge.getWalletBalance();
```

### 5. Wire All Handlers to Real Bridge Methods

Every UI button (deposit, withdraw, stats, history, wallet connect) must call the corresponding bridge method. Toast-only stubs are not acceptable even for MVP.

### 6. Verify Live Mode After Login

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

Requires Web Crypto API for score signing (Full SDK only).

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