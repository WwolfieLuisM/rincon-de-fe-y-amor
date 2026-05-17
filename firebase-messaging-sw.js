importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCoJCMqWTAgP12-BFqi4Kwt58F0FK8J8po",
  authDomain: "prayerprojectapp.firebaseapp.com",
  projectId: "prayerprojectapp",
  storageBucket: "prayerprojectapp.firebasestorage.app",
  messagingSenderId: "527928200076",
  appId: "1:527928200076:web:79f7ba46de2427bd3fe4a9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/rincon-de-fe-y-amor/img/icon-192.png',
    badge: '/rincon-de-fe-y-amor/img/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/rincon-de-fe-y-amor/dashboard.html';
  event.waitUntil(clients.openWindow(url));
});
