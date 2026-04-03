// =============================================================================
// Deskillz Universal Service Worker
// Path: public/sw.js
//
// Shared across ALL standalone games (social + esport).
// The __BUILD_HASH__ placeholder below is replaced automatically by the
// vite-plugin-sw-version Vite plugin during `npm run build`.
// Every build produces a unique cache name -- no manual version bumping needed.
//
// Strategy:
//   - Navigation requests (HTML): Network-first (always fresh index.html)
//   - Hashed static assets (JS/CSS in /assets/): Cache-first (immutable)
//   - Other static assets (images, audio, fonts): Stale-while-revalidate
//   - API + WebSocket: Bypass cache entirely
//
// On activation, all caches from previous builds are purged automatically.
// =============================================================================

const BUILD_HASH = '__BUILD_HASH__';
const CACHE_STATIC  = 'dsk-static-'  + BUILD_HASH;
const CACHE_DYNAMIC = 'dsk-dynamic-' + BUILD_HASH;

// Minimal set of shell files to pre-cache on install.
// Vite-hashed JS/CSS in /assets/ are cached on first fetch (cache-first).
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
];

// ---------------------------------------------------------------------------
// INSTALL -- pre-cache shell, skip waiting immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] Precache failed:', err))
  );
  // Activate immediately -- do not wait for old tabs to close
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// ACTIVATE -- purge ALL caches from previous builds, claim clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map((k) => {
            console.log('[SW] Purging old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  // Take control of all open tabs immediately (no reload required for fetch)
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// FETCH -- route requests by type
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  // --- Skip in local dev (prevents HMR console spam) ---
  if (
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1'
  ) {
    return;
  }

  const url = new URL(event.request.url);

  // --- Skip non-HTTP schemes (chrome-extension://, data:, blob:) ---
  if (!url.protocol.startsWith('http')) return;

  // --- Skip API calls and WebSocket -- always network ---
  if (url.pathname.includes('/api/v1/') || url.pathname.includes('socket.io')) return;

  // --- Skip range requests (audio/video streaming) ---
  if (event.request.headers.has('range')) return;

  // --- Navigation requests (HTML pages): Network-first ---
  // This ensures index.html is ALWAYS fresh after a new deploy.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, CACHE_STATIC));
    return;
  }

  // --- Vite hashed assets (/assets/index-abc123.js): Cache-first ---
  // These files have content hashes in their filenames -- they are immutable.
  // Once cached, they never need to be re-fetched.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // --- Everything else (images, audio, fonts, manifest): Stale-while-revalidate ---
  event.respondWith(staleWhileRevalidate(event.request, CACHE_DYNAMIC));
});

// ---------------------------------------------------------------------------
// MESSAGE -- handle SKIP_WAITING from index.html update listener
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

/**
 * Network-first: Try network, fall back to cache.
 * Used for navigation (index.html) so users always get the latest deploy.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Cache-first: Serve from cache, only fetch if not cached.
 * Used for Vite hashed assets (immutable filenames like index-abc123.js).
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Stale-while-revalidate: Serve cached immediately, update cache in background.
 * Used for images, audio, fonts -- fast loads with eventual freshness.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && request.method === 'GET') {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}