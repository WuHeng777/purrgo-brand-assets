const CACHE = 'purrgo-v16';
const ASSETS = [
  '/', './index.html', './style.css', './manifest.webmanifest',
  './data/products.json', './data/locations.json', './data/hospitals.json', './data/breeds.json',
  './logo/logo-192.png', './logo/logo-512.png', './logo/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
document.addEventListener('DOMContentLoaded', () => {
  // ====== Hamburger menu ======
  const body = document.body;
  const menuBtn = document.getElementById('menuBtn');
  const menu    = document.getElementById('menu');
  const backdrop= document.getElementById('menuBackdrop');

  const toggleMenu = (open) => {
    const willOpen = (open === undefined) ? !body.classList.contains('menu-open') : open;
    body.classList.toggle('menu-open', willOpen);
    if (willOpen) { menuBtn.setAttribute('aria-expanded','true'); }
    else { menuBtn.setAttribute('aria-expanded','false'); }
  };

  if(menuBtn){ menuBtn.addEventListener('click', () => toggleMenu()); }
  if(backdrop){ backdrop.addEventListener('click', () => toggleMenu(false)); }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') toggleMenu(false); });
  menu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => toggleMenu(false));
  });

  // ====== FAB buttons ======
  document.querySelectorAll('.fab-btn').forEach(btn=>{
    btn.addEventListener('click', () => {
      const id = btn.dataset.target;
      if(!id) return;
      const el = document.getElementById(id);
      if(!el) return;
      // 平滑滾動 + 觸發你的高亮邏輯
      el.scrollIntoView({behavior:'smooth', block:'start'});
      setTimeout(() => {
        history.replaceState(null, '', `#${id}`);
        if(typeof highlight === 'function') highlight();
      }, 300);
    });
  });
});
