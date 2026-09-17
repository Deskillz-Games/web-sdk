<!-- sdk-version: v3.7.0 | released: 2026-09-16 -->
<!-- SDK 3.7.0 P4 interim README -->
# Deskillz Web SDK

Source files for connecting a React + Vite web game to the Deskillz platform:
accounts, wallet, tournaments, quick play, private rooms and leaderboards.
Cloud Build wraps an integrated game as a PWA, an Android APK and a Windows app.

- API: `https://api.deskillz.games` (REST under `/api/v1`, Socket.IO on the same host)
- Distribution: **GitHub Releases** of this repository. The SDK is not published to npm.
- Developer guide: https://deskillz.games/docs (Web Game Developer Guide v6.0 ships with SDK 3.7.1)
- Developer Portal (Game ID, API key, uploads): https://deskillz.games/developer

## Install

1. Download `deskillz-web-sdk-<version>.zip` from the Releases page.
2. Copy its `src/` and `public/` folders into the same places in your game.
3. Start from `templates/index.html` and `templates/.env.production`.
4. Never edit `src/sdk/DeskillzBridge.ts`, the hooks, the components or
   `public/deskillz-sw.js` in your game: every release replaces them.

## Quick start

```typescript
// main.tsx
import { DeskillzBridge } from './sdk/DeskillzBridge';
import { captureLaunchParams } from './hooks/useLaunchDeepLink';

captureLaunchParams(); // before React renders

const bridge = DeskillzBridge.getInstance({
  gameId: import.meta.env.VITE_GAME_ID || 'YOUR_GAME_ID',
  gameKey: import.meta.env.VITE_GAME_API_KEY || 'YOUR_API_KEY',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.deskillz.games',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'wss://api.deskillz.games',
});
(window as any).DeskillzBridge = { getInstance: () => bridge };

await bridge.initialize(); // exactly once per page load
```

Keep the literal placeholders `YOUR_GAME_ID` and `YOUR_API_KEY` in production
builds; Cloud Build replaces them.

## Upgrading from 3.6.x

1. Replace the bridge, `bridge-types.ts`, hooks, components and
   `public/deskillz-sw.js` with the 3.7.0 copies.
2. Set `VITE_API_BASE_URL=https://api.deskillz.games` and
   `VITE_SOCKET_URL=wss://api.deskillz.games` (no `/lobby`).
3. Shared tables: use `hostUserId` from `getMyLaunch()` or `match:launch` to pick
   the host seat.
4. Listen for `quickPlayFilling`; dispute reason `OPPONENT_ISSUE`.
5. Bump `package.json`, build, zip `dist` with `tar -a`, upload in the Developer
   Portal, then confirm the new service-worker cache stamp in the game tab.

See `CHANGELOG.md` in the release zip for the full list.

## License

See `LICENSE`.
