// تحديث الكاش لضمان تحميل الملفات الفورية وحل مشكلة زر التثبيت الصريح
const CACHE_NAME = 'polo-fritta-cache-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/llogo.jpg'
];

// تثبيت السيرفس وركر وحفظ الملفات الأساسية فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // التفعيل الفوري لتجنب الانتظار
      return self.skipWaiting();
    })
  );
});

// تنظيف الكاش القديم عند التفعيل لمنع تعليق النسخ السابقة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// استراتيجية جلب البيانات (Network First) لضمان السرعة القصوى مع دعم وضع الأوفلاين
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات الـ Google Sheets لتحديث المنيو لحظياً بدون كاش معلق
  if (event.request.url.includes('docs.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا كان الرد سليم، قم بحفظ نسخة منه في الكاش لزيادة سرعة الصور لاحقاً
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // في حالة ضعف أو انقطاع النت تماماً، يتم القراءة من الكاش الفوري
        return caches.match(event.request);
      })
  );
});
