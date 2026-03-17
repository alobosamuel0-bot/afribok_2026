/**
 * Service Worker for Afribok 2026
 * Enables offline support and background sync
 */

const CACHE_NAME = 'afribok-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API calls (handled by IndexedDB + sync)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline page if available
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for pending operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingOperations());
  }
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_REQUEST') {
    event.waitUntil(syncPendingOperations());
  }
});

/**
 * Sync pending operations with backend
 */
async function syncPendingOperations() {
  try {
    // Get pending operations from IndexedDB
    const db = await openIndexedDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const pending = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Sync each pending operation
    for (const operation of pending) {
      try {
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getStoredToken()}`
          },
          body: JSON.stringify(operation)
        });

        if (response.ok) {
          // Mark as synced in IndexedDB
          const txUpdate = db.transaction('sync_queue', 'readwrite');
          txUpdate.objectStore('sync_queue').put({
            ...operation,
            status: 'synced'
          });
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    // Notify clients of sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          timestamp: new Date().toISOString()
        });
      });
    });
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

/**
 * Open IndexedDB database
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AfribokDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get stored token (basic check)
 */
function getStoredToken() {
  // Service Worker can't access localStorage directly
  // This would be passed via message from client
  return '';
}
