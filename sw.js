const CACHE_NAME = 'pwa-restaurant-cache-v1';

// أضف هنا الملفات الأساسية التي تريد تشغيلها بدون إنترنت (Offline)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // أضف ملفات الـ CSS والـ JS والصور الأساسية (مثل اللوجو وأيقونات التثبيت) هنا
];

// 1. مرحلة التثبيت: تخزين الملفات الثابتة مسبقًا
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // تفعيل الـ SW الجديد فورًا دون انتظار إغلاق التبويبات القديمة
  );
});

// 2. مرحلة التفعيل: تنظيف الكاش القديم إذا تغير رقم الإصدار (v1 إلى v2 مثلاً)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // السيطرة على كل الصفحات المفتوحة فورًا
  );
});

// 3. استراتيجيات جلب البيانات (Fetch)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // استراتيجية خاصة ببيانات المنيو الديناميكية (مثل روابط Google Sheets أو الـ API)
  // تحاول الجلب من الشبكة أولاً لتحديث الأسعار، وإذا فشت (بدون إنترنت) تعود للكاش
  if (requestUrl.pathname.includes('csv') || requestUrl.hostname.includes('sheets.google.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // حفظ نسخة محدثة في الكاش فور نجاح الاتصال
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // في حال أوفلاين، ابحث عنها في الكاش
          return caches.match(event.request);
        })
    );
    return;
  }

  // الاستراتيجية العامة للملفات الثابتة (Cache First): تسريع التحميل من الكاش، وإذا لم تجدها تجلبها من الشبكة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // إذا كان الملف المستدعى آمنًا وصالحًا، نخزنه للمستقبل
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
