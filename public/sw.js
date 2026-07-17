const CACHE = "president-to-go-v2";
const STATIC = ["/", "/korpa", "/manifest.webmanifest", "/images/products/lubenito.png"];
self.addEventListener("install", (event) => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC))); });
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request)));
});
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : "" }; }
  const title = data.title || "President To Go";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "Stigla je nova porudžbina.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: "new-order",
    renotify: true,
    data: { url: data.url || "/admin/porudzbine" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin/porudzbine";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) { if (client.url.includes(target) && "focus" in client) return client.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
