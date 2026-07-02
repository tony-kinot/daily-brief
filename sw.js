const CACHE = 'daily-brief-v2';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: 最新ブリーフを優先取得、失敗時はキャッシュにフォールバック
// 2026-07-02修正：cache:'no-store'を付けないとブラウザのHTTPキャッシュ（GitHub PagesのCache-Control分）を
// fetch()が経由してしまい、実機で「デプロイしても反映されない」状態が最大10分程度続いていたため明示的にバイパスする
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, {cache: 'no-store'})
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
