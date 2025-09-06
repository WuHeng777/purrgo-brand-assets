/* PurrGo Service Worker — clean single version */
const CACHE = 'purrgo-v17'; // ← 每次前端改版請改這個字串
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  // data
  './data/products.json',
  './data/locations.json',
  './data/breeds.json',
  './data/hospitals.json',
  // logo / icons
  './logo/favicon.png',
  './logo/logo-192.png',
  './logo/logo-512.png',
];

/* 安裝：預先快取主要資產並立即接管 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

/* 啟用：清理舊版快取並接手控制 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* 取用策略：
   1) 非 GET、跨網域要求：直接走網路。
   2) 地圖圖磚/外站（tile.openstreetmap.org、*.tile.openstreetmap.org、unpkg.com 等）：直接走網路，不快取。
   3) ASSETS 列表內的靜態檔：Cache First。
   4) 其他同源 GET：Stale-While-Revalidate。 */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只處理 GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // 地圖圖磚 / 外站資源：不快取，直接網路
  const isMapTile =
    /(^|\.)(tile\.openstreetmap\.org)$/.test(url.hostname) ||
    url.hostname.includes('tile.openstreetmap.org');
  const is3rdParty = !isSameOrigin;

  if (isMapTile || is3rdParty || url.hostname.includes('unpkg.com')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // 靜態資產（Cache First）
  const isAsset =
    ASSETS.some((p) => new URL(p, self.location.origin).href === url.href) ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isAsset) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
            return res;
          })
      )
    );
    return;
  }

  // 其他同源 GET：Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || net;
    })
  );
});
