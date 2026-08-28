// =============================================================================
// Deskillz Universal Service Worker
// Path: public/deskillz-sw.js
//
// IMPORTANT: Named deskillz-sw.js (NOT sw.js) to prevent Cloud Build Docker
// worker from overwriting it with Workbox generateSW. The Docker worker
// generates sw.js -- this file is untouched because the name is different.
//
// Shared across ALL standalone games (social + esport).
// The __BUILD_HASH__ placeholder is replaced by vite-plugin-sw-version
// during `npm run build`. Every build gets a unique cache name.
//
// N53: cache names are namespaced per game via a key derived from the SW
//      registration scope (/hosted/<gameId>/pwa/). All games share the R2
//      origin, so the old scheme let one game's activate purge another
//      game's caches. New prefix is dsk2-; purge only touches THIS game's
//      stale dsk2- caches. Legacy dsk- caches (unattributable) are removed
//      once during migration; each game rebuilds its own on next visit.
// N54: precache resolves URLs against the registration scope and adds them
//      individually -- a single 404 (e.g. manifest.json) no longer fails
//      the whole addAll.
//
// Strategy:
//   - Navigation (HTML): Network-first (always fresh index.html)
//   - Hashed assets (/assets/*.js|css): Cache-first (immutable filenames)
//   - Other static (images, audio, fonts): Stale-while-revalidate
//   - API + WebSocket: Bypass cache entirely
// =============================================================================

var BUILD_HASH = '__BUILD_HASH__';

// N53: stable per-game key from the registration scope path.
var SCOPE_KEY = (function () {
  try {
    var p = new URL(self.registration.scope).pathname;
    var key = p.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
    return key || 'root';
  } catch (e) {
    return 'root';
  }
})();

var CACHE_STATIC  = 'dsk2-static-'  + SCOPE_KEY + '-' + BUILD_HASH;
var CACHE_DYNAMIC = 'dsk2-dynamic-' + SCOPE_KEY + '-' + BUILD_HASH;

// Pre-cache shell files (resolved against the SW scope -- N54)
var PRECACHE_URLS = ['./', './index.html', './manifest.json'].map(function (u) {
  try {
    return new URL(u, self.registration.scope).toString();
  } catch (e) {
    return u;
  }
});

// ---------------------------------------------------------------------------
// INSTALL -- pre-cache shell (per-URL, failure-tolerant), skip waiting
// ---------------------------------------------------------------------------
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function (cache) {
      return Promise.all(
        PRECACHE_URLS.map(function (u) {
          return cache.add(u).catch(function (err) {
            console.warn('[SW] Precache skip:', u, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// ACTIVATE -- purge THIS game's stale caches + legacy dsk- caches, claim
// ---------------------------------------------------------------------------
self.addEventListener('activate', function (event) {
  var minePrefixStatic  = 'dsk2-static-'  + SCOPE_KEY + '-';
  var minePrefixDynamic = 'dsk2-dynamic-' + SCOPE_KEY + '-';
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            if (k === CACHE_STATIC || k === CACHE_DYNAMIC) return false;
            // This game's stale dsk2 caches (older builds)
            if (k.indexOf(minePrefixStatic) === 0 || k.indexOf(minePrefixDynamic) === 0) return true;
            // Legacy pre-N53 caches: one-time migration cleanup
            if (k.indexOf('dsk-static-') === 0 || k.indexOf('dsk-dynamic-') === 0) return true;
            // Another game's dsk2 caches: leave alone (N53)
            return false;
          })
          .map(function (k) {
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
self.addEventListener('fetch', function (event) {
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
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

function networkFirst(request, cacheName) {
  return fetch(request)
    .then(function (response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function (cache) { cache.put(request, clone); });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    });
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function (cache) { cache.put(request, clone); });
      }
      return response;
    }).catch(function () {
      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    });
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.match(request).then(function (cached) {
    var fetchPromise = fetch(request)
      .then(function (response) {
        if (response.ok && request.method === 'GET') {
          var clone = response.clone();
          caches.open(cacheName).then(function (cache) { cache.put(request, clone); });
        }
        return response;
      })
      .catch(function () { return null; });

    return cached || fetchPromise.then(function (resp) {
      return resp || new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    });
  });
}