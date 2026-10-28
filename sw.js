// Offline režim: network-first (vždy čerstvé súbory, keď je pripojenie), inak z cache.
// Cache obsahuje len statické súbory aplikácie, nikdy žiadne údaje žiaka.
const CACHE = 'password-quest-v12';
const FILES = [
  './', 'index.html', 'icon.svg', 'manifest.webmanifest', 'css/styles.css',
  'js/main.js', 'js/config.js', 'js/i18n.js', 'js/i18n/sk.js', 'js/i18n/en.js', 'js/i18n/zh.js', 'js/util.js', 'js/icons.js', 'js/store.js',
  'js/progress.js', 'js/wordlists.js', 'js/lab.js', 'js/glossary.js', 'js/nextStep.js', 'js/cipher.js', 'js/cipherPage.js', 'js/engine.js', 'js/views.js', 'js/teacher.js',
  'js/content/index.js', 'js/content/helpers.js',
  'js/content/sk/meta.js', 'js/content/sk/level1.js', 'js/content/sk/level2.js', 'js/content/sk/level3.js', 'js/content/sk/level4.js', 'js/content/sk/email.js', 'js/content/sk/extra.js',
  'js/content/en/meta.js', 'js/content/en/level1.js', 'js/content/en/level2.js', 'js/content/en/level3.js', 'js/content/en/level4.js', 'js/content/en/email.js', 'js/content/en/extra.js',
  'js/content/zh/meta.js', 'js/content/zh/level1.js', 'js/content/zh/level2.js', 'js/content/zh/level3.js', 'js/content/zh/level4.js', 'js/content/zh/email.js', 'js/content/zh/extra.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))),
  );
});
