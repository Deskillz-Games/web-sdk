// =============================================================================
// Deskillz Universal Service Worker
// Path: public/sw.js
//
// Shared across ALL standalone games (social + esport).
// The __BUILD_HASH__ placeholder is replaced by vite-plugin-sw-version
// during `npm run build`. Every build gets a unique cache name.
//
// WORKBOX COMPATIBILITY:
// Cloud Build Docker worker may run `workbox injectManifest` which injects
// a precache list into self.__WB_MANIFEST. If it runs `workbox generateSW`
// instead, it will OVERWRITE this file entirely -- the workbox-config.js
// in the project root prevents that by specifying injectManifest mode.
//
// Strategy:
//   - Navigation (HTML): Network-first (always fresh index.html)
//   - Hashed assets (/assets/*.js|css): Cache-first (immutable filenames)
//   - Other static (images, audio, fonts): Stale-while-revalidate
//   - API + WebSocket: Bypass cache entirely
// =============================================================================

const BUILD_HASH = '__BUILD_HASH__';
const CACHE_STATIC  = 'dsk-static-'  + BUILD_HASH;
const CACHE_DYNAMIC = 'dsk-dynamic-' + BUILD_HASH;

// Workbox injectManifest will replace this with the precache list.
// If Workbox does NOT run, this is just an empty array and our
// manual caching strategies handle everything.
const WB_MANIFEST = self.__WB_MANIFEST || [];

// Pre-cache: shell files + any Workbox-injected assets
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  ...WB_MANIFEST.map(function(entry) {
    return typeof entry === 'string' ? entry : entry.url;
  }),
];

// ---------------------------------------------------------------------------
// INSTALL -- pre-cache shell, skip waiting immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) {
        return cache.addAll(PRECACHE_URLS).catch(function(err) {
          console.warn('[SW] Precache partial failure:', err);
        });
      })
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// ACTIVATE -- purge ALL caches from previous builds, claim clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_STATIC && k !== CACHE_DYNAMIC; })
          .map(function(k) {
            console.log('[SW] Purging old cache:', k);
            return caches.delete(k);
          })
      );
    })
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// FETCH -- route requests by type
// ---------------------------------------------------------------------------
self.addEventListener('fetch', function(event) {
  // Skip in local dev
  if (
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1'
  ) {
    return;
  }

  var url = new URL(event.request.url);

  // Skip non-HTTP schemes
  if (!url.protocol.startsWith('http')) return;

  // Skip API calls and WebSocket
  if (url.pathname.indexOf('/api/v1/') !== -1 || url.pathname.indexOf('socket.io') !== -1) return;

  // Skip range requests
  if (event.request.headers.has('range')) return;

  // Navigation (HTML): Network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, CACHE_STATIC));
    return;
  }

  // Hashed assets: Cache-first
  if (url.pathname.indexOf('/assets/') !== -1 && /\.[a-f0-9]{8,}\./i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // Everything else: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_DYNAMIC));
});

// ---------------------------------------------------------------------------
// MESSAGE -- handle SKIP_WAITING from index.html
// ---------------------------------------------------------------------------
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

function networkFirst(request, cacheName) {
  return fetch(request)
    .then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function(cache) { cache.put(request, clone); });
      }
      return response;
    })
    .catch(function() {
      return caches.match(request).then(function(cached) {
        return cached || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    });
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function(cache) { cache.put(request, clone); });
      }
      return response;
    }).catch(function() {
      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    });
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.match(request).then(function(cached) {
    var fetchPromise = fetch(request)
      .then(function(response) {
        if (response.ok && request.method === 'GET') {
          var clone = response.clone();
          caches.open(cacheName).then(function(cache) { cache.put(request, clone); });
        }
        return response;
      })
      .catch(function() { return null; });

    return cached || fetchPromise.then(function(resp) {
      return resp || new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    });
  });
}