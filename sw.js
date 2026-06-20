const CACHE_NAME = 'bolofreta-app-v1';
const ASSETS = [
    'index.html',
    'manifest.json'
];

// تثبيت الملفات في الكاش
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// استدعاء الملفات بسرعة فائقة من الكاش
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
