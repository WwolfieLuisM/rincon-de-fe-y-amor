const CACHE = 'rincon-fe-v3';
const STATIC = [
  '/rincon-de-fe-y-amor/',
  '/rincon-de-fe-y-amor/index.html',
  '/rincon-de-fe-y-amor/dashboard.html',
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
  '/rincon-de-fe-y-amor/img/apple-touch-icon.png'
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
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/rincon-de-fe-y-amor/data/')) {
    e.respondWith(fetch(e.request));
    return;
  }
  const cleanUrl = stripQuery(e.request.url);
  if (url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(cleanUrl))
    );
    return;
  }
  e.respondWith(
    caches.match(cleanUrl).then(r => r || fetch(e.request))
  );
});
