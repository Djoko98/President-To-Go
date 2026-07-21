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
    data: { url: "/admin/porudzbine?tab=nove" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = "/admin/porudzbine?tab=nove";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
    // A window already on the orders page: focus it and switch to the "Nove" tab.
    for (const client of list) {
      if (client.url.includes("/admin/porudzbine")) { await client.focus(); client.postMessage({ type: "orders-tab", tab: "nove" }); return; }
    }
    // Any other open window: reuse it and navigate to the orders page.
    for (const client of list) {
      if ("navigate" in client) { try { await client.focus(); await client.navigate(target); return; } catch { /* fall back to openWindow */ } }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
