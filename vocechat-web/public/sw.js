const CACHE_NAME = 'neko-talk-v4';
const STATIC_ASSETS = ['/', '/index.html', '/share.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API: network-first
  if (url.pathname.startsWith('/api/')) {
    // /api/resource/file 強制 conditional request：伺服器刪檔後，瀏覽器 HTTP cache 不會再餵舊圖
    const init = url.pathname.startsWith('/api/resource/file') ? { cache: 'no-cache' } : undefined;
    event.respondWith(
      fetch(request, init).catch(() => caches.match(request))
    );
    return;
  }

  // 貼圖 / 圖片資產：stale-while-revalidate（先回 cache、背景更新，下次刷新就最新）
  // 避免 cache-first 把舊圖卡死（例如重產 _key.png 後使用者看不到新版）
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request).then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // JS/CSS/字型：cache-first（這些檔名含 hash，更新時檔名會變，cache key 不衝突）
  if (url.pathname.match(/\.(js|css|woff2?|ttf)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Navigation: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    const fallback = url.pathname === '/share.html' ? '/share.html' : '/index.html';
    event.respondWith(
      fetch(request).catch(() => caches.match(fallback))
    );
  }
});
