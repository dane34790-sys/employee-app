const CACHE_NAME = "employee-app-v8";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./images/app-icon.png",
  "./images/login-bg.png",
  "./images/employee-bg.png"
];

// نصب
self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(
    (async () => {

      const cache = await caches.open(CACHE_NAME);

      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
          console.log("Cached:", file);
        } catch (e) {
          console.error("Cache failed:", file, e);
        }
      }

    })()
  );

});

// فعال‌سازی
self.addEventListener("activate", event => {

  event.waitUntil(
    (async () => {

      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();

    })()
  );

});

// دریافت فایل‌ها
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {

      const cached = await caches.match(event.request);

      if (cached) {
        return cached;
      }

      try {

        const response = await fetch(event.request);

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());

        }

        return response;

      } catch (e) {

        const offline = await caches.match("./index.html");

        if (offline) return offline;

        throw e;

      }

    })()
  );

});
