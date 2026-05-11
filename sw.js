const CACHE = 'rincon-fe-v1';
const STATIC = [
  '/rincon-de-fe-y-amor/',
  '/rincon-de-fe-y-amor/index.html',
  '/rincon-de-fe-y-amor/register.html',
  '/rincon-de-fe-y-amor/recover.html',
  '/rincon-de-fe-y-amor/link.html',
  '/rincon-de-fe-y-amor/dashboard.html',
  '/rincon-de-fe-y-amor/prayers.html',
  '/rincon-de-fe-y-amor/gratitude.html',
  '/rincon-de-fe-y-amor/encouragement.html',
  '/rincon-de-fe-y-amor/goals.html',
  '/rincon-de-fe-y-amor/dates.html',
  '/rincon-de-fe-y-amor/profile.html',
  '/rincon-de-fe-y-amor/more.html',
  '/rincon-de-fe-y-amor/css/styles.css',
  '/rincon-de-fe-y-amor/js/supabase.js',
  '/rincon-de-fe-y-amor/js/auth.js',
  '/rincon-de-fe-y-amor/components/layout.js',
  '/rincon-de-fe-y-amor/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
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
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
