const CACHE_NAME = "employee-app-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",

  // 📌 مهم: آیکن و عکس‌ها هم اضافه شد
  "./images/app-icon.png",
  "./images/employee-bg.png",
  "./images/login-bg.png",
  "./images/mypdf.jpg",
  "./images/telegram.png",
  "./images/trustwallet.png",
  "./images/line.png"
];

// نصب و کش کردن فایل‌ها
self.addEventListener("install", event => {
  self.skipWaiting(); // 🚀 سریع فعال شود

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// فعال شدن
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim(); // 🚀 کنترل فوری
});

// گرفتن فایل‌ها از کش یا اینترنت
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
