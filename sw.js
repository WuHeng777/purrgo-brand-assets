// 超精簡：確保相對路徑在 GitHub Pages 正常
self.addEventListener('install',e=>{
  e.waitUntil(caches.open('purrgo-v1').then(c=>c.addAll([
    './','./index.html','./style.css','./logo/logo-192.png','./logo/logo-512.png'
  ])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});// 只做最基本的快取優先 (可依需要擴充)
const CACHE = 'purrgo-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data/products.json',
  './data/locations.json',
  './data/breeds.json',
  './data/hospitals.json',
  './logo/logo-192.png',
  './logo/logo-512.png',
  './logo/favicon.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res=>{
      // 靜態資源放入快取
      if (req.url.startsWith(self.location.origin)) {
        const clone = res.clone();
        caches.open(CACHE).then(c=>c.put(req, clone));
      }
      return res;
    }).catch(()=>hit))
  );
});
