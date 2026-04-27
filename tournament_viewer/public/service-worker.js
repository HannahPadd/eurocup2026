const CACHE_NAME = "tournament-viewer-cache-v2";
const urlsToCache = [
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
  void self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const requestUrl = new URL(event.request.url);
        if (requestUrl.origin === self.location.origin) {
          const responseForCache = networkResponse.clone();
          void caches.open(CACHE_NAME).then((cache) => {
            void cache.put(event.request, responseForCache);
          });
        }

        return networkResponse;
      });
    }),
  );
});
