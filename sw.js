const CACHE = 'rincon-fe-v6';
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
    )).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: 'window' }).then(clients =>
        Promise.all(clients.map(c => c.navigate(c.url)))
      )
    )
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
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
  // Assets (JS, CSS, images): cache-first with FULL URL (?v=N included)
  // This way layout.js?v=11 and layout.js?v=10 are separate cache entries
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
