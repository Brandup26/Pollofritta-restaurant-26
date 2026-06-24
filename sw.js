const CACHE_NAME = 'pwa-bolofrita-cache-v4';

// قائمة الملفات الأساسية للتشغيل أوفلاين
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. مرحلة التثبيت: كاش مسبق للملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. مرحلة التفعيل: تدمير الكاش القديم فوراً لتنفيذ التحديثات الجذرية
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. استراتيجية التحكم والـ Fetch الذكي
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // استراتيجية Network First لملفات الاكسل وجوجل شيتس لضمان الأسعار الفورية
  if (requestUrl.pathname.includes('csv') || requestUrl.hostname.includes('sheets.google.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // استراتيجية الـ Cache First للمكونات والصور لتوفير سرعة تحميل خارقة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});
