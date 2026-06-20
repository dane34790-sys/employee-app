const CACHE_NAME = "employee-app-v9";

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
    caches.open(CACHE_NAME).then(async cache => {

      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
        } catch (err) {
          console.warn("Cache skipped:", file, err);
        }
      }

    })
  );

});

// فعال‌سازی
self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })
      );

    }).then(() => self.clients.claim())
  );

});

// درخواست‌ها
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(

    caches.match(event.request).then(cacheRes => {

      if (cacheRes) {
        return cacheRes;
      }

      return fetch(event.request)
        .then(networkRes => {

          if (
            networkRes &&
            networkRes.status === 200 &&
            networkRes.type === "basic"
          ) {

            const copy = networkRes.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copy);
            });

          }

          return networkRes;

        })
        .catch(() => {

          return caches.match("./index.html");

        });

    })

  );

});
