const CACHE_NAME = 'notisaas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/styles.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Forzar activación inmediata
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch básico para eliminar el warning "no-op"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});