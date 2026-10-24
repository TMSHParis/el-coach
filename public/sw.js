/* Service worker EL COACH METHOD : notifications push (partie 5, mission 4A). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "EL COACH METHOD", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "EL COACH METHOD", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  );
});

// Un toucher ouvre l'écran concerné (check-in, séance du jour, profil, progression).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c && "navigate" in c) {
          return c.navigate(url).then((w) => (w || c).focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
