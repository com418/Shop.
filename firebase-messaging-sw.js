// Firebase Messaging Service Worker
// LuxeStore - Push Notifications

importScripts(
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBLx6RK5sRIduaKiDSTAGlKPmfUH7iDSBM",
  authDomain: "shop-3d56c.firebaseapp.com",
  projectId: "shop-3d56c",
  storageBucket: "shop-3d56c.firebasestorage.app",
  messagingSenderId: "285039032126",
  appId: "1:285039032126:web:c2226d1aeb02a555c35e6f"
});

const messaging = firebase.messaging();

// Receive notifications when the admin page is closed
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "New LuxeStore Order 🛍️";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "A customer has placed a new order.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "luxestore-new-order",
    renotify: true,
    data: {
      url: "/admin.html"
    }
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Open admin panel when notification is tapped
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    event.notification?.data?.url || "/admin.html";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
