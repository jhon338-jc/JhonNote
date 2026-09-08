/* Jhon Note · JHON338 — Service Worker (offline PWA) */
'use strict';

const CACHE_NAME = 'jhon-note-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* Install: cache app shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Aktifkan: bersihkan cache lama */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first untuk aset, network-first untuk navigasi */
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET' || req.url.includes('extension:')) return;

  // Navigasi (HTML): coba network dulu, fallback ke cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => {
            c.put('./index.html', copy);
            c.put('./', copy.clone());
          });
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Aset statis: cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req)
        .then(res => {
          if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});