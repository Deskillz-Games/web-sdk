# Deskillz Web SDK

Framework-agnostic SDK for integrating competitive gaming tournaments with cryptocurrency prizes into web applications.

[![npm version](https://img.shields.io/npm/v/@deskillz/web-sdk.svg)](https://www.npmjs.com/package/@deskillz/web-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, or vanilla JavaScript
- **Full TypeScript Support** - Complete type definitions for all APIs
- **Real-Time Updates** - WebSocket-based matchmaking, lobby, and tournament events
- **Cryptocurrency Payments** - Support for BNB, USDT, USDC on BSC and TRON networks
- **Anti-Cheat Protection** - HMAC-SHA256 score signing built-in
- **Tree-Shakeable** - Only bundle what you use
- **Dual Module Format** - ESM and CommonJS builds included

## Installation

```bash
npm install @deskillz/web-sdk socket.io-client
```

Or with yarn:

```bash
yarn add @deskillz/web-sdk socket.io-client
```

## Quick Start

### 1. Initialize the SDK

```typescript
import { createDeskillzSDK } from '@deskillz/web-sdk';

const sdk = createDeskillzSDK({
  gameId: 'your-game-id',      // From developer portal
  gameKey: 'your-game-key',    // From developer portal
  apiBaseUrl: 'https://api.deskillz.games',
  debug: true,                 // Enable console logging
});
```

### 2. Authenticate User

```typescript
// Email/password login
const user = await sdk.auth.login({
  email: 'player@example.com',
  password: 'securepassword',
});

console.log('Logged in as:', user.username);

// Or register a new user
const newUser = await sdk.auth.register({
  email: 'newplayer@example.com',
  password: 'securepassword',
  username: 'ProGamer123',
});
```

### 3. Browse Games and Tournaments

```typescript
// Get available games
const games = await sdk.games.getGames();

// Get tournaments for a game
const tournaments = await sdk.tournaments.getTournaments(games[0].id);

// Join a tournament
await sdk.tournaments.join(tournaments[0].id);
```

### 4. Connect to Real-Time Events

```typescript
// Connect to WebSocket
await sdk.realtime.connect();

// Listen for match found
sdk.realtime.on('matchmaking:found', (data) => {
  console.log('Match found!', data);
});

// Join matchmaking queue
sdk.realtime.joinQueue(gameId, tournamentId);
```

### 5. Submit Score with Anti-Cheat

```typescript
import { getTimestamp } from '@deskillz/web-sdk';

// Sign the score
const signedScore = await sdk.scoreSigner.signScore({
  gameId: 'your-game-id',
  matchId: 'current-match-id',
  score: 15000,
  duration: 120.5,
  timestamp: getTimestamp(),
});

// Submit to tournament
await sdk.tournaments.submitScore(tournamentId, {
  score: signedScore.score,
  signature: signedScore.signature,
  matchId: signedScore.matchId,
  timestamp: signedScore.timestamp,
  nonce: signedScore.nonce,
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gameId` | `string` | Required | Your game ID from the developer portal |
| `gameKey` | `string` | Required | Your game API key (used for score signing) |
| `apiBaseUrl` | `string` | `'https://api.deskillz.games'` | Backend API URL |
| `socketUrl` | `string` | `'wss://ws.deskillz.games'` | WebSocket server URL |
| `timeout` | `number` | `120000` | HTTP request timeout (ms) |
| `debug` | `boolean` | `false` | Enable debug logging |
| `storage` | `StorageAdapter` | `LocalStorageAdapter` | Token storage adapter |
| `autoReconnect` | `boolean` | `true` | Auto-reconnect WebSocket |
| `maxReconnectAttempts` | `number` | `10` | Max reconnection attempts |

## API Reference

### SDK Modules

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

### Authentication

```typescript
// Login
const user = await sdk.auth.login({ email, password });

// Register
const user = await sdk.auth.register({ email, password, username });

// Logout
await sdk.auth.logout();

// Get current user
const me = await sdk.auth.getMe();

// Check authentication status
const isLoggedIn = sdk.auth.isAuthenticated();
```

### Wallet

```typescript
// Get balances
const balances = await sdk.wallet.getBalances();

// Get deposit address
const address = await sdk.wallet.getDepositAddress('BNB');

// Request withdrawal
await sdk.wallet.withdraw({
  currency: 'USDT',
  amount: 100,
  toAddress: '0x...',
});

// Get transaction history
const transactions = await sdk.wallet.getTransactions({ page: 1, limit: 20 });
```

### Tournaments

```typescript
// List tournaments
const tournaments = await sdk.tournaments.getTournaments(gameId);

// Get tournament details
const tournament = await sdk.tournaments.getTournament(tournamentId);

// Join tournament
await sdk.tournaments.join(tournamentId);

// Submit score
await sdk.tournaments.submitScore(tournamentId, scoreData);

// Get leaderboard
const leaderboard = await sdk.tournaments.getLeaderboard(tournamentId);
```

### Private Rooms

```typescript
// Create a private room
const room = await sdk.rooms.createRoom({
  gameId: 'game-123',
  name: 'Friday Night Gaming',
  maxPlayers: 8,
  entryFee: 5,
  currency: 'USDT',
});

// Join with code
await sdk.rooms.joinByCode('ABC123');

// Ready up
await sdk.rooms.setReady(roomId, true);

// Start match (host only)
await sdk.rooms.startMatch(roomId);
```

### Real-Time Events

```typescript
// Connect
await sdk.realtime.connect();

// Subscribe to events
sdk.realtime.on('matchmaking:found', (match) => { /* ... */ });
sdk.realtime.on('tournament:started', (data) => { /* ... */ });
sdk.realtime.on('room:player-joined', (player) => { /* ... */ });
sdk.realtime.on('notification', (notif) => { /* ... */ });

// Join queue
sdk.realtime.joinQueue(gameId, tournamentId);

// Leave queue
sdk.realtime.leaveQueue();

// Disconnect
sdk.realtime.disconnect();
```

## Custom Storage Adapter

For environments without `localStorage` (e.g., React Native WebView):

```typescript
import { createDeskillzSDK, MemoryStorageAdapter } from '@deskillz/web-sdk';

// Use in-memory storage
const sdk = createDeskillzSDK({
  gameId: 'your-game-id',
  gameKey: 'your-game-key',
  storage: new MemoryStorageAdapter(),
});

// Or create a custom adapter
const customStorage = {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

const sdk = createDeskillzSDK({
  gameId: 'your-game-id',
  gameKey: 'your-game-key',
  storage: customStorage,
});
```

## Subpath Imports

Import only what you need for smaller bundles:

```typescript
// Import specific modules
import { AuthService } from '@deskillz/web-sdk/auth';
import { WalletService } from '@deskillz/web-sdk/wallet';
import { ScoreSigner } from '@deskillz/web-sdk/security';

// Import types only
import type { Tournament, Game, UserProfile } from '@deskillz/web-sdk';
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

Requires Web Crypto API for score signing.

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  DeskillzConfig,
  UserProfile,
  Tournament,
  Game,
  WalletBalance,
  PrivateRoom,
  ScorePayload,
  SignedScore,
} from '@deskillz/web-sdk';
```

## Error Handling

```typescript
import { DeskillzError, AuthError, NetworkError } from '@deskillz/web-sdk';

try {
  await sdk.auth.login({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof DeskillzError) {
    console.error('API error:', error.code, error.message);
  }
}
```

## Cleanup

Always destroy the SDK when done:

```typescript
// Disconnects WebSocket, clears event listeners
sdk.destroy();
```

## Links

- [Developer Portal](https://developers.deskillz.games)
- [API Documentation](https://docs.deskillz.games)
- [Discord Community](https://discord.gg/deskillz)
- [GitHub Issues](https://github.com/deskillz/web-sdk/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.