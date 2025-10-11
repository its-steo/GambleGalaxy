// app/sw.js (create this file)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.2.0/workbox-sw.js');

// Precache assets using the manifest injected by Workbox
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Register a route for HTTPS URLs to use StaleWhileRevalidate strategy
workbox.routing.registerRoute(
  ({ url }) => url.protocol.startsWith('https'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'offlineCache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
      }),
    ],
  })
);

// Register a route for images to use CacheFirst strategy
workbox.routing.registerRoute(
  ({ url }) => url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif)$/),
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Skip waiting on install to activate the service worker immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Claim clients on activation to take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});