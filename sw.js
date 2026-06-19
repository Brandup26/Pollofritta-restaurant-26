const CACHE_NAME = 'polovrita-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// تثبيت التطبيق وتخزين الملفات
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// جلب البيانات من الكاش للسرعة الفائقة
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
