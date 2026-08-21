/* Tabboz Mobile service worker — network-first for code, cache-first for media. */
const VERSION = '31';
const CACHE_NAME = 'tabboz-mobile-' + VERSION;

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
        './',
        './index.html',
        './manifest.json'
    ]).catch(() => undefined)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key.indexOf('tabboz-mobile-') === 0 && key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

function isCodeRequest(request, url) {
    const dest = request.destination;
    if (dest === 'script' || dest === 'document' || dest === 'worker') return true;
    return /\.(js|wasm|html|json)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    if (isCodeRequest(request, url)) {
        event.respondWith(
            fetch(request).then((response) => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
                }
                return response;
            }).catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
                }
                return response;
            });
        })
    );
});
