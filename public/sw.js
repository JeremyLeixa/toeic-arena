// ═══════════════════════════════════════════════════════════
// sw.js — Verse Arena Service Worker v4
// Cache static assets + handle push notifications
// ═══════════════════════════════════════════════════════════

var CACHE_NAME = "toeic-arena-v4";

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

  // Only cache same-origin GET requests
  if (e.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Skip API calls and large media files
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.match(/\.(mp3|wav|ogg)$/)
  ) {
    return;
  }

  // Network-first with cache fallback (same-origin only)
  // Use cache:'no-cache' to bypass browser HTTP cache for HTML/JS
  // (forces revalidation with server, ensures fresh builds are picked up)
  var fetchOpts = {};
  if (url.pathname.endsWith(".html") || url.pathname.endsWith(".js") || url.pathname === "/") {
    fetchOpts.cache = "no-cache";
  }

  e.respondWith(
    fetch(e.request, fetchOpts)
      .then(function (response) {
        if (response.ok && response.type === "basic") {
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

// ─── PUSH NOTIFICATION: parse payload + sanitize + show ───
function sanitizeText(str, maxLen) {
  if (typeof str !== "string") return null;
  // Strip HTML tags and limit length
  return str.replace(/<[^>]*>/g, "").substring(0, maxLen || 200);
}
function sanitizeUrl(str) {
  if (typeof str !== "string") return null;
  // Only allow relative paths starting with /
  if (str.charAt(0) === "/") return str;
  return "/";
}

self.addEventListener("push", function (e) {
  var data = {
    title: "Verse Arena",
    body: "Time to train!",
    icon: "/icon-192.png",
    tag: "toeic-default",
    url: "/"
  };

  try {
    if (e.data) {
      var payload = e.data.json();
      var t = sanitizeText(payload.title, 100);
      var b = sanitizeText(payload.body, 300);
      var tag = sanitizeText(payload.tag, 50);
      var u = sanitizeUrl(payload.url);
      if (t) data.title = t;
      if (b) data.body = b;
      if (tag) data.tag = tag;
      if (u) data.url = u;
      // icon: only allow same-origin paths
      if (typeof payload.icon === "string" && payload.icon.charAt(0) === "/") data.icon = payload.icon;
    }
  } catch (err) {
    // If JSON parse fails, use defaults
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/icon-192.png",
      tag: data.tag,
      vibrate: [210, 100, 210],
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
