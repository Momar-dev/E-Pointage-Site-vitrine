const CACHE_NAME = 'e-pointage-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Installation - mise en cache des ressources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation - nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - stratégie Cache First, puis Network
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes API (pas de cache pour les données dynamiques)
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retourner le cache si trouvé
      if (response) {
        return response;
      }
      
      // Sinon, fetch depuis le réseau
      return fetch(event.request).then(response => {
        // Ne pas mettre en cache les réponses non-valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Mettre en cache la nouvelle ressource
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Si offline et pas en cache, retourner la page offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Sync en arrière-plan pour les données en attente
self.addEventListener('sync', event => {
  if (event.tag === 'sync-presences') {
    event.waitUntil(syncPresences());
  }
});

async function syncPresences() {
  // Déclencher la sync depuis l'app
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_PRESENCES' });
  });
}
