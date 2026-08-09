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

// ============ CACHE V9 ============
const CACHE = 'rincon-fe-v9';

const STATIC = [
  // HTML (16 páginas)
  '/rincon-de-fe-y-amor/',
  '/rincon-de-fe-y-amor/index.html',
  '/rincon-de-fe-y-amor/register.html',
  '/rincon-de-fe-y-amor/recover.html',
  '/rincon-de-fe-y-amor/dashboard.html',
  '/rincon-de-fe-y-amor/prayers.html',
  '/rincon-de-fe-y-amor/gratitude.html',
  '/rincon-de-fe-y-amor/palabra.html',
  '/rincon-de-fe-y-amor/devocional.html',
  '/rincon-de-fe-y-amor/encouragement.html',
  '/rincon-de-fe-y-amor/goals.html',
  '/rincon-de-fe-y-amor/dates.html',
  '/rincon-de-fe-y-amor/streak.html',
  '/rincon-de-fe-y-amor/notifications.html',
  '/rincon-de-fe-y-amor/profile.html',
  '/rincon-de-fe-y-amor/more.html',
  '/rincon-de-fe-y-amor/link.html',

  // CSS
  '/rincon-de-fe-y-amor/css/styles.css',

  // JS Base (global)
  '/rincon-de-fe-y-amor/js/supabase.js',
  '/rincon-de-fe-y-amor/js/auth.js',
  '/rincon-de-fe-y-amor/js/devotional.js',
  '/rincon-de-fe-y-amor/js/streak.js',
  '/rincon-de-fe-y-amor/js/notifications.js',
  '/rincon-de-fe-y-amor/components/layout.js',

  // JS Pages (TODOS los módulos)
  '/rincon-de-fe-y-amor/js/pages/dashboard.js',
  '/rincon-de-fe-y-amor/js/pages/prayers-page.js',
  '/rincon-de-fe-y-amor/js/pages/gratitude-page.js',
  '/rincon-de-fe-y-amor/js/pages/palabra-page.js',
  '/rincon-de-fe-y-amor/js/pages/devocional-page.js',
  '/rincon-de-fe-y-amor/js/pages/encouragement-page.js',
  '/rincon-de-fe-y-amor/js/pages/goals-page.js',
  '/rincon-de-fe-y-amor/js/pages/dates-page.js',
  '/rincon-de-fe-y-amor/js/pages/streak-page.js',
  '/rincon-de-fe-y-amor/js/pages/notifications-page.js',
  '/rincon-de-fe-y-amor/js/pages/profile.js',
  '/rincon-de-fe-y-amor/js/pages/more.js',
  '/rincon-de-fe-y-amor/js/pages/link.js',

  // PWA
  '/rincon-de-fe-y-amor/manifest.json',

  // Imágenes (favicons + backgrounds)
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
  '/rincon-de-fe-y-amor/img/donativos.webp',
  '/rincon-de-fe-y-amor/img/register-bg.webp',
  '/rincon-de-fe-y-amor/img/recover-bg.webp',
  '/rincon-de-fe-y-amor/img/link-bg.webp',
  '/rincon-de-fe-y-amor/img/more-bg.webp',
  '/rincon-de-fe-y-amor/img/notifications-bg.webp',
  '/rincon-de-fe-y-amor/img/profile-bg.webp',
  '/rincon-de-fe-y-amor/img/dates-bg.webp'
];

// ============ UTILITY ============
function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.href;
  } catch {
    return url;
  }
}

// ============ INSTALL ============
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .catch(err => console.warn('SW: Precache error', err))
  );
  self.skipWaiting();
});

// ============ ACTIVATE ============
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ============ FETCH ============
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. SOLO GET
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // 2. EXTERNAL APIS → network-only
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('firebaseio.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 3. DATA (Biblia JSON) → network-first
  if (url.pathname.startsWith('/rincon-de-fe-y-amor/data/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // 4. HTML → network-first, fallback a cache (sin query params)
  if (url.pathname.endsWith('.html') || url.pathname === '/rincon-de-fe-y-amor/') {
    const cleanUrl = stripQuery(e.request.url);
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(cleanUrl, clone));
          return res;
        })
        .catch(() => caches.match(cleanUrl))
    );
    return;
  }

  // 5. JS / CSS → network-first, actualiza caché, fallback a caché (con ?v=N)
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

  // 6. IMAGES & ASSETS → cache-first, fallback a red
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
  );
});
