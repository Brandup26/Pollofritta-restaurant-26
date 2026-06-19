const CACHE_NAME = 'polovrita-premium-v2';
// الملفات الأساسية التي سيتم حفظها في ذاكرة الهاتف لسرعة تصفح خارقة
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/llogo.jpg'
];

// مرحلة التثبيت وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Polovrita Assets Cached Successfully! 🔥');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل السيرفس وركر وحذف الكاش القديم فوراً لتحديث التطبيق عند العميل
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية التشغيل السريع (Cache First) لملفات المنيو والصور
self.addEventListener('fetch', (event) => {
  // استثناء روابط جوجل شيت لضمان تحديث الأسعار والمنطقة فوراً من السيرفر
  if (event.request.url.includes('docs.google.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; 
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET' && !event.request.url.startsWith('chrome-extension')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      if (event.request.destination === 'image') {
        return caches.match('./images/llogo.jpg');
      }
    })
  );
});
