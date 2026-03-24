// ═══════════════════════════════════════════════════════════
// sw.js — TOEIC Arena Service Worker
// Cache static assets + handle push notifications
// ═══════════════════════════════════════════════════════════

var CACHE_NAME = "toeic-arena-v1";

// Install: cache the app shell
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png",
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API/data, cache-first for static assets
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  // Always go to network for API calls and Supabase
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("elevenlabs") ||
    url.pathname.startsWith("/api/") ||
    e.request.method !== "GET"
  ) {
    return;
  }

  // For audio files: network-first (they're large, don't bloat cache)
  if (url.pathname.match(/\.(mp3|wav|ogg)$/)) {
    return;
  }

  // Everything else: network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(e.request);
      })
  );
});

// ─── PUSH NOTIFICATIONS ───
self.addEventListener("push", function (e) {
  var data = { title: "TOEIC Arena", body: "Time to train!", icon: "/icon-192.png" };
  try {
    if (e.data) data = Object.assign(data, e.data.json());
  } catch (err) {
    if (e.data) data.body = e.data.text();
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "toeic-default",
      data: { url: data.url || "/" },
    })
  );
});

// Click on notification: open / focus the app
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes(self.location.origin) && "focus" in list[i]) {
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
