// اسم الكاش - يتم تحديث الرقم (v4) تلقائياً عند تغيير الكود لضمان تجديد الكاش
const CACHE_NAME = 'polo-fritta-cache-v4';

// الملفات الأساسية التي يتم حفظها في الكاش ليعمل الأبلكيشن أوفلاين وبسرعة صاروخية
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/llogo.jpg'
];

// 1. حدث التثبيت (Install): يتم حفظ الملفات الأساسية في الكاش فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // الحتة المحفوظة: تفعيل الـ Service Worker الجديد فوراً دون انتظار إغلاق التبويبات القديمة
      return self.skipWaiting();
    })
  );
});

// 2. حدث التفعيل (Activate): تنظيف الكاش القديم تماماً لعدم استهلاك مساحة الموبايل
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
    }).then(() => {
      // جعل الـ Service Worker الجديد يسيطر على الصفحة فوراً
      return self.clients.claim();
    })
  );
});

// 3. استراتيجية جلب البيانات (Fetch Strategy): الشبكة أولاً ثم الكاش (Network First, Falling Back to Cache)
// هذه الاستراتيجية هي الأفضل للمنيو الديناميكي المرتبط بجوجل شيت لضمان ظهور الأسعار الجديدة فوراً للزبون لو كان متصلاً بالإنترنت
self.addEventListener('fetch', (event) => {
  // تخطي روابط جوجل شيتس من الكاش لضمان جلب الأسعار اللحظية دائماً من السيرفر
  if (event.request.url.includes('docs.google.com/spreadsheets')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال بالشبكة، قم بتحديث الكاش بالنسخة الجديدة المستلمة
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // في حالة انقطاع الإنترنت، يتم القراءة من الكاش المحفوظ مسبقاً لحماية تجربة المستخدم
        return caches.match(event.request);
      })
  );
});
