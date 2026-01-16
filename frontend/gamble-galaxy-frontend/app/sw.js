importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.2.0/workbox-sw.js');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

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

workbox.routing.registerRoute(
  ({ url }) => url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif)$/),
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.href.match(/^https:\/\/gamblegalaxy\.onrender\.com\/api\/.*/i),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.href.match(/^wss:\/\/gamblegalaxy\.onrender\.com\/ws\/aviator\/.*/i),
  new workbox.strategies.NetworkOnly()
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});