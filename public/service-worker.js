/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

// Import the Workbox library from the CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);

  // Set up preloading
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Cache the Google Fonts stylesheets
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  // Cache the underlying font files
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          maxEntries: 30,
        }),
      ],
    })
  );

  // Cache JavaScript and CSS files
  workbox.routing.registerRoute(
    /\.(?:js|css)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|jpeg|svg)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache sound files
  workbox.routing.registerRoute(
    /\.(?:mp3|wav)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'sounds',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
} else {
  console.log(`Workbox didn't load`);
}

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      // Show notification
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/logo192.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100, 50, 100],
        data: data.actionData,
        requireInteraction: true
      });
    } catch (error) {
      console.error('Error processing push notification:', error);
    }
  }
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Find existing window or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Find if a window is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline email actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'email-read-sync') {
    event.waitUntil(syncEmailReadStatus());
  }
});

// Simulate syncing email read status when back online
async function syncEmailReadStatus() {
  try {
    // Get pending read statuses from IndexedDB or other storage
    // In a real implementation, this would fetch from a database and sync with server
    console.log('Syncing email read statuses');
    return true;
  } catch (error) {
    console.error('Error syncing email read status:', error);
    return false;
  }
}