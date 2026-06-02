self.addEventListener("install", () => {
    void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(
                        (cacheName) =>
                            cacheName === "tournament-viewer-cache-v2" ||
                            cacheName.startsWith("workbox-"),
                    )
                    .map((cacheName) => caches.delete(cacheName)),
            );

            await self.clients.claim();

            await self.registration.unregister();
        })(),
    );
});
