// =============================================================================
// useAutoUpdater -- packages/game-ui/src/hooks/useAutoUpdater.ts (SDK 3.7.0)
// Checks GET /api/v1/games/:gameId/latest-version for a newer cloud build and
// reports it. applyUpdate(): PWA -> service-worker update + reload; wrapped
// APK / Windows -> opens the download URL. The game decides when to show the
// prompt (never during a match or on a launch page).
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl?: string;
  releaseNotes?: string;
  platform: 'pwa' | 'apk' | 'windows' | 'unknown';
  publishedAt?: string;
}

export interface UseAutoUpdaterOptions {
  /** Game ID on the Deskillz platform */
  gameId: string;
  /** Current app version (semver) */
  currentVersion: string;
  /** Base URL for the Deskillz API */
  apiBaseUrl: string;
  /** Check interval in ms (default: 5 minutes) */
  checkInterval?: number;
  /** Whether auto-check is enabled (default: true) */
  enabled?: boolean;
}

export interface UseAutoUpdaterResult {
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Update details (null if no update) */
  updateInfo: UpdateInfo | null;
  /** Whether currently checking for updates */
  isChecking: boolean;
  /** Last error message */
  error: string | null;
  /** Manually trigger an update check */
  checkForUpdate: () => Promise<void>;
  /** Dismiss the update notification */
  dismiss: () => void;
  /** Apply the update (reload for PWA, open download for APK) */
  applyUpdate: () => void;
}

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

function detectPlatform(): 'pwa' | 'apk' | 'windows' | 'unknown' {
  const ua = navigator.userAgent.toLowerCase();

  // Check if running inside a Capacitor/Cordova webview (wrapped APK)
  if ((window as any).Capacitor || (window as any).cordova) return 'apk';

  // Check for Electron (Windows wrapper)
  if (ua.includes('electron')) return 'windows';

  // Check if installed as PWA
  if (window.matchMedia?.('(display-mode: standalone)')?.matches) return 'pwa';
  if ((navigator as any).standalone === true) return 'pwa'; // iOS Safari

  // Default to PWA for web browsers
  return 'pwa';
}

// =============================================================================
// VERSION COMPARISON
// =============================================================================

function isNewerVersion(current: string, latest: string): boolean {
  const parseSemver = (v: string): number[] =>
    v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

  const c = parseSemver(current);
  const l = parseSemver(latest);

  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAutoUpdater(options: UseAutoUpdaterOptions): UseAutoUpdaterResult {
  const {
    gameId,
    currentVersion,
    apiBaseUrl,
    checkInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
  } = options;

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const platform = useRef(detectPlatform());
  // N157: in-flight guard as a ref so checkForUpdate has stable identity,
  // and a permanent per-session backoff once the endpoint 404s.
  const checkingRef = useRef(false);
  const unsupportedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (checkingRef.current || unsupportedRef.current) return;
    checkingRef.current = true;
    setIsChecking(true);
    setError(null);

    try {
      const url = `${apiBaseUrl}/api/v1/games/${gameId}/latest-version?platform=${platform.current}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Endpoint not available for this game/platform -- stop asking.
          unsupportedRef.current = true; // N157
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        throw new Error(`Version check failed: ${res.status}`);
      }

      const data = await res.json();
      const latestVersion: string = data.version || data.latestVersion || currentVersion;
      const hasUpdate = isNewerVersion(currentVersion, latestVersion);

      const info: UpdateInfo = {
        available: hasUpdate,
        currentVersion,
        latestVersion,
        downloadUrl: data.downloadUrl || data.apkUrl || data.pwaUrl,
        releaseNotes: data.releaseNotes || data.changelog,
        platform: platform.current,
        publishedAt: data.publishedAt || data.createdAt,
      };

      setUpdateInfo(info);
      if (hasUpdate) setDismissed(false); // Re-show if new version detected
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update check failed';
      setError(msg);
      console.warn('[useAutoUpdater] Check failed:', msg);
    } finally {
      checkingRef.current = false; // N157
      setIsChecking(false);
    }
  }, [gameId, currentVersion, apiBaseUrl]); // N157: stable identity

  // Periodic check
  useEffect(() => {
    if (!enabled) return;

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkForUpdate, 5000);

    // Recurring check
    intervalRef.current = setInterval(checkForUpdate, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, checkInterval, checkForUpdate]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!updateInfo?.available) return;

    switch (platform.current) {
      case 'pwa':
        // Force reload to pick up new service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
              reg.update().then(() => window.location.reload());
            } else {
              window.location.reload();
            }
          });
        } else {
          window.location.reload();
        }
        break;

      case 'apk':
        // Open download page for new APK
        if (updateInfo.downloadUrl) {
          window.open(updateInfo.downloadUrl, '_blank');
        }
        break;

      case 'windows':
        // Open download page for Windows build
        if (updateInfo.downloadUrl) {
          window.open(updateInfo.downloadUrl, '_blank');
        }
        break;

      default:
        window.location.reload();
    }
  }, [updateInfo]);

  return {
    updateAvailable: !dismissed && (updateInfo?.available ?? false),
    updateInfo,
    isChecking,
    error,
    checkForUpdate,
    dismiss,
    applyUpdate,
  };
}

export default useAutoUpdater;