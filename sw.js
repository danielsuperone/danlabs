// Minimal service worker: serves basic offline responses and caches manifest and assets for PWA install experience
const CACHE = 'danlabs-cache-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/assets/profile-picture.png',
  '/assets/profile-picture.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Network-first for navigation, cache-first for other assets
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then((r)=> r || fetch(e.request)).catch(()=>{}));
});