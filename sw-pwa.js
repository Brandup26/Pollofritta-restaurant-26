const CACHE_NAME = 'polovrita-premium-v1';
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

// تفعيل السيرفس وركر وتحديث الكاش القديم تلقائياً لضمان الأمان
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

// استراتيجية التشغيل (Cache First): يعرض من الهاتف فوراً، وإذا لم يجد الملف يبحث في الإنترنت لسرعة تصفح لا مثيل لها
self.addEventListener('fetch', (event) => {
  // عدم عمل كاش لروابط جوجل شيت لضمان تحديث الأسعار والمنطقة فوراً من السيرفر
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
          // حفظ الصور والملفات الجديدة المستدعاة ديناميكياً في الكاش
          if (event.request.method === 'GET' && !event.request.url.startsWith('chrome-extension')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      // حل بديل في حال أوفلاين تماماً والصورة مش موجودة
      if (event.request.destination === 'image') {
        return caches.match('./images/llogo.jpg');
      }
    })
  );
});
