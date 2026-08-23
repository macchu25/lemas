// Lemas.AI Service Worker for Progressive Web App (PWA)
const CACHE_NAME = 'lemas-ai-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let network handle dynamic API requests directly
  if (event.request.url.includes('/api/') || event.request.url.includes('/v1/')) {
    return;
  }
});
