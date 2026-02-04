# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-03

### Added

#### Core
- Framework-agnostic SDK architecture (works with React, Vue, Angular, vanilla JS)
- Native `fetch` HTTP client with automatic token refresh
- Storage adapter pattern for flexible token storage
- Typed event emitter for SDK-wide events
- Comprehensive error classes (DeskillzError, AuthError, NetworkError, ValidationError)

#### Authentication
- Email/password authentication (login, register, logout)
- Social authentication (Google, Apple, Discord, Twitter, Twitch)
- Wallet-based authentication (SIWE - Sign-In with Ethereum)
- Two-factor authentication (TOTP setup, verify, recovery codes)
- Automatic token refresh on 401 responses

#### Wallet
- Multi-currency balance management (BNB, USDT, USDC)
- Deposit address generation per currency
- Withdrawal requests with address validation
- Transaction history with pagination
- Support for BSC and TRON networks

#### Real-Time
- WebSocket connection with automatic reconnection
- Matchmaking queue events (join, leave, found, ready)
- Tournament real-time updates
- Private room events (player joined/left, ready status, launch)
- Notification system

#### Lobby & Matchmaking
- Game catalog browsing with filters
- Tournament queue management
- Match details retrieval
- Deep link support for game launches
- Live stats (online players, active matches)

#### Tournaments
- Tournament listing with filters (status, game, entry fee)
- Tournament details and rules
- Join/leave tournaments
- Score submission with anti-cheat signatures
- Real-time leaderboards

#### Private Rooms
- Esports room creation and management
- Social game rooms with rake mechanics
- Join by code functionality
- Host controls (kick, start, cancel)
- Spectator mode support

#### Host System
- 6-tier host progression (Bronze to Elite)
- Badge system with achievements
- Earnings dashboard and history
- Withdrawal requests
- Leaderboard rankings

#### Developer Portal
- Dashboard with game analytics
- Revenue reports and payouts
- SDK key management
- Game build uploads (presigned URL and direct)
- API key rotation

#### Users & Leaderboard
- User profile management
- Settings (notifications, preferences, privacy)
- Role upgrade (Player to Developer)
- Global and per-game leaderboards
- Platform statistics

#### Security
- HMAC-SHA256 score signing
- SHA-256 file hashing for uploads
- Timestamp validation utilities
- Nonce generation for replay protection

#### Build System
- ESM and CommonJS dual builds
- TypeScript declaration files
- Tree-shakeable exports
- Subpath imports for selective bundling
- Vite-based build pipeline

### Changed
- Migrated from axios to native fetch API
- Replaced Zustand state management with custom event emitter
- Socket.io-client is now a peer dependency (not bundled)

### Security
- All scores are cryptographically signed before submission
- Constant-time comparison for signature verification
- Secure nonce generation using Web Crypto API

## [2.x.x] - Previous Versions

Previous versions were platform-specific SDKs (Unity, Unreal Engine).
Version 3.0.0 is the first web-specific release with a unified API.

---

## Migration Guide

### From Unity/Unreal SDK

The Web SDK follows the same API patterns as the mobile SDKs but is designed for browser environments:

1. **Initialization**: Use `createDeskillzSDK()` instead of native SDK initialization
2. **Authentication**: Email/password is primary; wallet connection is optional
3. **Score Submission**: Use `sdk.scoreSigner.signScore()` before submitting
4. **Real-Time**: Connect via `sdk.realtime.connect()` after authentication

### Key Differences

| Feature | Mobile SDK | Web SDK |
|---------|-----------|---------|
| Storage | Native secure storage | localStorage / custom adapter |
| WebSocket | Native implementation | socket.io-client |
| Crypto | Platform-specific | Web Crypto API |
| Build Output | Native library | ES/CJS modules |

---

[3.0.0]: https://github.com/deskillz/web-sdk/releases/tag/v3.0.0