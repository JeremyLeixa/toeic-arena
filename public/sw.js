// ═══════════════════════════════════════════════════════════
// sw.js — TOEIC Arena Service Worker v2
// Cache static assets + handle push notifications
// ═══════════════════════════════════════════════════════════

var CACHE_NAME = "toeic-arena-v2";

// ─── INSTALL: cache app shell + force activate ───
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

// ─── ACTIVATE: clean old caches + claim all clients ───
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ─── FETCH: network-first with cache fallback ───
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  // Always go to network for API calls, Supabase, audio
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("elevenlabs") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.match(/\.(mp3|wav|ogg)$/) ||
    e.request.method !== "GET"
  ) {
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

// ─── PUSH NOTIFICATION: parse payload + show with vibration ───
self.addEventListener("push", function (e) {
  var data = {
    title: "TOEIC Arena",
    body: "Time to train!",
    icon: "/icon-192.png",
    tag: "toeic-default",
    url: "/"
  };

  try {
    if (e.data) {
      var payload = e.data.json();
      if (payload.title) data.title = payload.title;
      if (payload.body) data.body = payload.body;
      if (payload.icon) data.icon = payload.icon;
      if (payload.tag) data.tag = payload.tag;
      if (payload.url) data.url = payload.url;
    }
  } catch (err) {
    // If JSON parse fails, try plain text
    if (e.data) data.body = e.data.text();
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/icon-192.png",
      tag: data.tag,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: { url: data.url }
    })
  );
});

// ─── NOTIFICATION CLICK: open or focus the app ───
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      // Focus existing window if open
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes(self.location.origin) && "focus" in list[i]) {
          return list[i].focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
