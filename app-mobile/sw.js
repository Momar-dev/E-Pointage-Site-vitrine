const CACHE_NAME = 'epointage-pwa-v2';

// Fichiers de base à mettre en cache immédiatement
const ASSETS_TO_CACHE = [
  '/app-mobile/',
  '/app-mobile/index.html',
  '/app-mobile/pwa-icon.png',
  '/app-mobile/favicon.ico'
];

// Installation : on met en cache les fichiers de base
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activation : on nettoie les anciens caches si on change de version
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie "Network First, falling back to cache" pour HTML/API
// Stratégie "Cache First, falling back to network" pour JS/Images
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Pour les fichiers statiques (JS, CSS, Images), on préfère le cache
  if (url.pathname.includes('/_expo/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Pour le reste (HTML, API locale si besoin), on préfère le réseau
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si pas de réseau, on cherche dans le cache
        return caches.match(event.request).then((cachedResponse) => {
          // Si c'est une navigation vers une page qui n'est pas en cache, 
          // on renvoie index.html pour que l'app s'ouvre hors-ligne
          if (!cachedResponse && event.request.mode === 'navigate') {
            return caches.match('/app-mobile/index.html');
          }
          return cachedResponse;
        });
      })
  );
});
