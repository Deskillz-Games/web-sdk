// =============================================================================
// Deskillz Web SDK - Security Module Barrel Export
// Path: src/security/index.ts
// Re-exports all security utilities (score signing, hashing, timestamps)
// =============================================================================

// Score Signer class
export { ScoreSigner } from './score-signer';

// Standalone functions
export {
  signScore,
  verifyScore,
  calculateFileHash,
  calculateHash,
  getTimestamp,
  isTimestampValid,
} from './score-signer';

// Types
export type {
  ScorePayload,
  SignedScore,
  VerificationResult,
} from './score-signer';