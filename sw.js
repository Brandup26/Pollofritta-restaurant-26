// تحديث الكاش لضمان تحميل الملفات الفورية وحل مشكلة زر التثبيت الصريح
// ملحوظة يا هندسة: لما ترفع تعديل جديد ميز الكاش برقم جديد (مثلاً v6)
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
      // استخدام طريقتين لضمان الكاش حتى لو فيه ملف غاب
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting(); // التفعيل الفوري
    })
  );
});

// تنظيف الكاش القديم وتفعيل الوركر الجديد فوراً طرد للقديم
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
      return self.clients.claim(); // السيطرة الفورية على كل الصفحات المفتوحة
    })
  );
});

// استراتيجية جلب البيانات لضمان السرعة القصوى والتحديث اللحظي
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. استثناء طلبات الـ Google Sheets والـ API تماماً للحصول على المنيو والبيانات لحظياً
  if (url.hostname.includes('docs.google.com') || url.hostname.includes('api')) {
    return;
  }

  // 2. منع كاش صفحة الـ index.html تماماً لإجبار المتصفح على مراجعة السيرفر فوراً
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // 3. باقي الملفات والصور (سرعة صاروخية مع تحديث في الخلفية)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => null); // منع ضرب الأبلكيشن لو مفيش نت

      // رجّع الكاش فوراً للسرعة، ولو مش موجود استنى السيرفر
      return cachedResponse || fetchPromise;
    })
  );
});
