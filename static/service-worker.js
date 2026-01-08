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


self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/static/images/icon-192.png', // Asegúrate que exista
    vibrate: [500, 200, 500, 200, 500],
    data: { url: '/dashboard' }, // Para abrir al hacer clic
    requireInteraction: true, // Se queda en pantalla hasta que el usuario toque
    actions: [
        {action: 'confirm', title: '🔴 VER ALERTA'}
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});