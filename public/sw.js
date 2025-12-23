// Service Worker for ReliefAnchor PWA
//
// IMPORTANT: Navigation requests ("/") must be network-first to avoid serving a stale
// cached index.html after a new deploy (otherwise production can appear "not updated").

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const CACHE_NAME = 'reliefanchor-runtime-v5';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache what exists; ignore missing optional files.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // ignore
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => (name !== CACHE_NAME ? caches.delete(name) : undefined))
      );
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function pathnameOf(req) {
  try {
    return new URL(req.url).pathname;
  } catch {
    return '';
  }
}

function hasExt(pathname, exts) {
  return exts.some((ext) => pathname.endsWith(ext));
}

// Safari sometimes reports request.destination as "" (empty), which can cause stale JS/CSS to be served.
function isScriptOrStyleRequest(req) {
  const path = pathnameOf(req);
  return (
    req.destination === 'script' ||
    req.destination === 'style' ||
    hasExt(path, ['.js', '.mjs', '.css'])
  );
}

function isImageOrFontRequest(req) {
  const path = pathnameOf(req);
  return (
    req.destination === 'image' ||
    req.destination === 'font' ||
    hasExt(path, ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf'])
  );
}

async function networkFirst(req, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    // Only cache successful same-origin GET responses
    if (fresh && fresh.ok && isSameOrigin(req.url)) {
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    // Offline / network error
    const cached = await cache.match(req);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error('No cached response available');
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;

  const fresh = await fetch(req);
  if (fresh && fresh.ok && isSameOrigin(req.url)) {
    cache.put(req, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never cache cross-origin requests (e.g. backend/API calls)
  if (!isSameOrigin(request.url)) {
    return;
  }

  // Network-first for app shell / navigations so new deploys are picked up.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  // Network-first for JS/CSS to avoid mixing cached assets across deploys.
  if (isScriptOrStyleRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets that are safe to keep stale longer
  if (isImageOrFontRequest(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default
  event.respondWith(cacheFirst(request));
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' },
    ],
  };

  let title = 'ReliefAnchor';
  let body = 'You have a new notification';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      if (data.icon) options.icon = data.icon;
    } catch {
      body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, { ...options, body }));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline mood entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mood') {
    event.waitUntil(syncMoodEntries());
  }
});

async function syncMoodEntries() {
  // This would sync offline mood entries when back online
  console.log('Syncing offline mood entries...');
}

