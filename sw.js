const CACHE_NAME = "employee-app-v12";

const BASE = "/employee-app/";

const FILES_TO_CACHE = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
  BASE + "app.js",
  BASE + "manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {

        // 🔥 مهم‌ترین FIX: اگر صفحه route بود → برگرد به index.html
        if (event.request.mode === "navigate") {
          return caches.match(BASE + "index.html");
        }

        return caches.match(event.request);
      })
  );
});
