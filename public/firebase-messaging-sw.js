importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyDQg8HwwXTvXddadwdfbyuhsUmrRI8UbLE",
  authDomain: "maxigo-98598.firebaseapp.com",
  projectId: "maxigo-98598",
  storageBucket: "maxigo-98598.firebasestorage.app",
  messagingSenderId: "237028561931",
  appId: "1:237028561931:web:84f162dd73c1c90e00e30e",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle =
    payload.notification?.title || "MaxiGo - New Order";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "A new order has been received.",
    icon: "/maxigo-admin-logo.png",
    badge: "/maxigo-admin-logo.png",
    data: {
      url: "/?page=Orders",
      ...payload.data,
    },
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});