/* AeroKrest VTOL Racer — 오프라인 저장용 서비스 워커 (scope: ./milab_vr_055 로 이 앱에만 적용) */
var VERSION = '1.2.0';
var CACHE = 'milab55-' + VERSION;
var CORE = ['milab55_manifest.json', 'milab55_icon-192.png', 'milab55_icon-512.png', 'milab55_icon-180.png'];
var PAGE = 'milab_vr_055.html';
function keyOf(url){ var u = new URL(url, self.location); return u.origin + u.pathname; }
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(CORE.concat([PAGE]).map(function(p){
      return fetch(p, { cache:'reload' }).then(function(r){ if(r.ok) return c.put(keyOf(p), r); }).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('milab55-')===0 && k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
function isPage(req){ var p = new URL(req.url).pathname; return req.mode==='navigate' || /milab_vr_055[^/]*\.html$/.test(p); }
self.addEventListener('fetch', function(e){
  var req = e.request; if(req.method !== 'GET') return;
  var url = new URL(req.url); if(url.origin !== self.location.origin) return;  /* GA·QR CDN 등 외부는 그대로 */
  var key = keyOf(req.url);
  if(isPage(req)){
    /* 게임 화면: 인터넷 먼저(최대 3초) → 실패하면 저장본. 받은 최신본은 저장해 다음 실행에 사용 */
    e.respondWith(caches.open(CACHE).then(function(c){
      var net = fetch(req, { cache:'no-store' }).then(function(r){ if(r && r.ok) c.put(key, r.clone()); return r; });
      var timeout = new Promise(function(res){ setTimeout(res, 3000); });
      return Promise.race([net, timeout.then(function(){ return null; })]).then(function(r){
        return r || c.match(key).then(function(m){ return m || c.match(keyOf(PAGE)) || net; });
      }).catch(function(){ return c.match(key).then(function(m){ return m || c.match(keyOf(PAGE)); }); });
    }));
    return;
  }
  if(CORE.some(function(p){ return key === keyOf(p); })){
    e.respondWith(caches.match(key).then(function(m){ return m || fetch(req).then(function(r){ if(r.ok) caches.open(CACHE).then(function(c){ c.put(key, r.clone()); }); return r; }); }));
  }
});
self.addEventListener('message', function(e){ if(e.data==='version' && e.source) e.source.postMessage({ sw:VERSION }); });
