// تحديث الكاش لضمان تحميل الملفات الفورية وحل مشكلة زر التثبيت الصريح
// ملحوظة يا هندسة: لما ترفع تعديل جديد ميز الكاش برقم جديد (مثلاً v6)
const CACHE_NAME = 'polo-fritta-cache-v5';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/llogo.jpg'
];

// تثبيت السيرفس وركر وحفظ الملفات الأساسية فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting(); // التفعيل الفوري وطرد أي وركر قديم
    })
  );
});

// تنظيف الكاش القديم تماماً فوراً بمجرد تغيير رقم الإصدار ऊपर
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
  if (url.hostname.includes('docs.google.com') || url.hostname.includes('api') || url.pathname.includes('ws')) {
    return; // اتركها للشبكة مباشرة دون تدخل
  }

  // 2. إجبار المتصفح على قراءة الـ index.html من السيرفر فوراً (تحديث فوري للزبائن)
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          // إذا نجح التحميل، نحدث الكاش بالنسخة الجديدة في الخلفية لحالات الطوارئ
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // لو الزبون معندوش إنترنت، افتح له النسخة المتسيفة فوراً
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. باقي ملفات الـ CSS والـ JS والصور الثابتة (Network First مع Fallback للكاش)
  // دي الاستراتيجية الأضمن عشان لو غيرت كود الـ CSS الزبون يشوفه فوراً لو معاه نت، ولو مفيش نت يفتح الكاش
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // في حالة انقطاع الشبكة تماماً، نرجع النسخة المتسيفة في الكاش للسرعة والأمان
        return caches.match(event.request);
      })
  );
});
