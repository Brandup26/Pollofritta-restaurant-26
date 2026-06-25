// تحديث الكاش لضمان تحميل الملفات الفورية وحل مشكلة زر التثبيت الصريح
// ملحوظة يا هندسة: لما ترفع تعديل جديد ميز الكاش برقم جديد (مثلاً v6) عشان السيستم يلقطه فوراً
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

// استراتيجية جلب البيانات لضمان السرعة القصوى مع دعم وضع الأوفلاين والتحديث الفوري
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. تجاهل طلبات الـ Google Sheets لتحديث المنيو لحظياً بدون كاش معلق
  if (url.hostname.includes('docs.google.com')) {
    return;
  }

  // 2. السر السحري: منع كاش صفحة الـ index.html والـ Root تماماً من الـ Fetch 
  // ده بيجبر المتصفح يروح للسيرفر دايماً يتأكد لو فيه كود جديد، فيلقط الـ Service Worker المعدل فوراً
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // لو مفيش نت خالص (أوفلاين)، بنجيب النسخة المحفوظة في الكاش كخطة بديلة
        return caches.match(event.request);
      })
    );
    return;
  }

  // 3. باقي الملفات والصور (باقي الـ Assets اللى محتاجة سرعة وكاش)
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
