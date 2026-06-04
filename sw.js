const CACHE_NAME = 'polo-frita-v1';
// الأصول الأساسية التي يتم حفظها في ذاكرة الهاتف ليعمل التطبيق بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/llogo.jpg'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل الملف وتنظيف الكاش القديم لتجنب التعليق أو تداخل البيانات
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية جلب البيانات: السحب من الكاش للسرعة، مع جلب التحديثات من الشبكة بأمان
self.addEventListener('fetch', (event) => {
  // استثناء روابط جداول جوجل من الكاش الميت لضمان تحديث الأسعار والمنيو لحظياً
  if (event.request.url.includes('docs.google.com')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // نرسل النسخة المحفوظة فوراً لسرعة فتح التطبيق، ونحدث الكاش في الخلفية
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* صامت لحالات عدم وجود شبكة */});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
