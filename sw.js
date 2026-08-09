
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

const CACHE = 'rincon-fe-v8';
const STATIC = [
  '/rincon-de-fe-y-amor/',
  '/rincon-de-fe-y-amor/index.html',
  '/rincon-de-fe-y-amor/dashboard.html',
  '/rincon-de-fe-y-amor/devocional.html',
  '/rincon-de-fe-y-amor/streak.html',
  '/rincon-de-fe-y-amor/encouragement.html',
  '/rincon-de-fe-y-amor/gratitude.html',
  '/rincon-de-fe-y-amor/link.html',
  '/rincon-de-fe-y-amor/more.html',
  '/rincon-de-fe-y-amor/palabra.html',
  '/rincon-de-fe-y-amor/prayers.html',
  '/rincon-de-fe-y-amor/profile.html',
  '/rincon-de-fe-y-amor/register.html',
  '/rincon-de-fe-y-amor/recover.html',
  '/rincon-de-fe-y-amor/goals.html',
  '/rincon-de-fe-y-amor/dates.html',
  '/rincon-de-fe-y-amor/css/styles.css',
  '/rincon-de-fe-y-amor/js/supabase.js',
  '/rincon-de-fe-y-amor/js/auth.js',
  '/rincon-de-fe-y-amor/components/layout.js',
  '/rincon-de-fe-y-amor/manifest.json',
  '/rincon-de-fe-y-amor/img/icon-192.png',
  '/rincon-de-fe-y-amor/img/icon-512.png',
  '/rincon-de-fe-y-amor/img/icon.svg',
  '/rincon-de-fe-y-amor/img/apple-touch-icon.png',
  '/rincon-de-fe-y-amor/img/favicon.ico',
  '/rincon-de-fe-y-amor/img/favicon.png',
  '/rincon-de-fe-y-amor/img/login-bg.webp',
  '/rincon-de-fe-y-amor/img/dashboard-bg.webp',
  '/rincon-de-fe-y-amor/img/prayers-bg.webp',
  '/rincon-de-fe-y-amor/img/encouragement-bg.webp',
  '/rincon-de-fe-y-amor/img/goals-bg.webp',
  '/rincon-de-fe-y-amor/img/streak-bg.webp',
  '/rincon-de-fe-y-amor/img/devocional-bg.webp',
  '/rincon-de-fe-y-amor/img/palabra-bg.webp',
  '/rincon-de-fe-y-amor/img/donativos.webp'
];

function stripQuery(url) {
  const u = new URL(url);
  u.search = '';
  return u.href;
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }
  if (url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (url.pathname.startsWith('/rincon-de-fe-y-amor/data/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // HTML: network-first, strip query for cache fallback
  if (url.pathname.endsWith('.html')) {
    const cleanUrl = stripQuery(e.request.url);
    e.respondWith(
      fetch(e.request).catch(() => caches.match(cleanUrl))
    );
    return;
  }
  // JS & CSS: network-first with FULL URL (?v=N included)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Images & other assets: cache-first with FULL URL (?v=N included)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
      
