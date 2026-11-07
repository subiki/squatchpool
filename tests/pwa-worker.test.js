import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const template = readFileSync(new URL('../scripts/sw-template.js', import.meta.url), 'utf8');
const assets = ['/index.html','/but-wait.html','/caroms.html','/cutthroat.html','/press-your-luck.html','/tuna.html','/rules.html','/archive.html','/src/game.js'];
function workerHarness() {
  const events = new Map();
  const stored = new Map();
  const deleted = [];
  let fetches = 0;
  let response = {ok:true, type:'basic', body:'from network', clone() {return {...this};}};
  let offline = false;
  const cache = {
    match: async key => stored.get(key),
    put: async (key, value) => {stored.set(key, value);},
    addAll: async urls => {
      if (offline || !response.ok || response.type === 'opaque') throw Error('precache fetch failed');
      for (const url of urls) stored.set(url, {ok:true,body:'preloaded '+url});
    }
  };
  const context = {
    URL, Set, Promise,
    caches: {
      open: async () => cache,
      keys: async () => ['squatch-offline-old','squatch-offline-test'],
      delete: async key => {deleted.push(key);return true;}
    },
    fetch: async () => {fetches++;if (offline) throw Error('offline');return response;},
    self: {
      location: {origin:'https://squatch.example'},
      addEventListener: (name, handler) => events.set(name,handler),
      skipWaiting: async () => {}, // Browser service worker API used when precache succeeds.
      clients: {claim: async () => {}}
    }
  };
  const source = template.replace('__CACHE_VERSION__','test')
    .replace('__PRECACHE_LIST__',JSON.stringify(assets));
  runInNewContext(source,context);
  async function request(path, method='GET', mode='navigate', origin='https://squatch.example') {
    let responsePromise;
    events.get('fetch')({request:{url:origin+path,method,mode},respondWith(p){responsePromise=p;}});
    return responsePromise;
  }
  async function lifecycle(name) {
    let pending;
    events.get(name)({waitUntil(p){pending=p;}});
    await pending;
  }
  async function offlineStatus(type='SQUATCH_OFFLINE_STATUS') {
    let pending,reply;
    events.get('message')({data:{type},
      ports:[{postMessage(value){reply=value;}}],waitUntil(p){pending=p;}});
    await pending;
    return reply;
  }
  return {request,lifecycle,offlineStatus,stored,deleted,cache,setOffline(value){offline=value;},setResponse(value){response=value;},get fetches(){return fetches;}};
}

test('browser owns installation UI while offline status and repair remain available', () => {
  const page = readFileSync(new URL('../src/pwa.js', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /beforeinstallprompt|preventDefault\(|Install game|pendingInstall/,
    'Do not suppress native browser install promotion or render a site install button');
  assert.match(page, /navigator\.serviceWorker\.register\('\/service-worker\.js'/,
    'Keep offline installation and updates working');
  assert.match(page, /Retry offline download/,
    'Keep the explicit repair control for damaged offline caches');
  assert.match(page, /Ready to play offline/,
    'Keep the offline readiness status');
});

test('install preloads playable pages and activation retains only new offline edition',async () => {
  const h=workerHarness();
  await h.lifecycle('install');
  for (const path of assets) assert.ok(h.stored.has(path),path);
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted,['squatch-offline-old']);
});

test('cached homepage, rules and games load offline after network fallback',async () => {
  const h=workerHarness();
  await h.lifecycle('install');
  h.setOffline(true);
  for (const path of ['/','/caroms.html','/cutthroat.html','/press-your-luck.html','/tuna.html','/rules.html','/archive.html']) {
    const response=await h.request(path);
    assert.ok(response?.ok,path);
  }
  assert.equal(h.fetches,7); // Network-first navigation tries online, then uses cached HTML.
});

test('evicted allowlisted assets are repaired online, then served offline',async () => {
  const h=workerHarness();
  const online=await h.request('/caroms.html');
  assert.equal(online.body,'from network');
  assert.ok(h.stored.has('/caroms.html'));
  h.setOffline(true);
  const offline=await h.request('/caroms.html');
  assert.equal(offline.body,'from network');
  assert.equal(h.fetches,2);
});

test('API requests, cross-origin and writes are never intercepted or cached',async () => {
  const h=workerHarness();
  assert.equal(await h.request('/api/stats'),undefined);
  assert.equal(await h.request('/api/stats','POST'),undefined);
  assert.equal(await h.request('/index.html','GET','navigate','https://elsewhere.example'),undefined);
  assert.equal(await h.request('/index.html','POST'),undefined);
  assert.equal(h.stored.size,0);
  assert.equal(h.fetches,0);
});

test('failed responses and offline misses never pollute the cache',async () => {
  const h=workerHarness();
  h.setResponse({ok:false,type:'basic',clone(){return {...this};}});
  const bad=await h.request('/cutthroat.html');
  assert.equal(bad.ok,false);
  assert.equal(h.stored.size,0);
  h.setOffline(true);
  await assert.rejects(h.request('/cutthroat.html'),/offline/);
  assert.equal(h.stored.size,0);
});


test('offline-ready handshake refuses to claim readiness after cache eviction',async () => {
  const h=workerHarness();
  assert.equal((await h.offlineStatus()).ready,false);
  await h.lifecycle('install');
  const complete=await h.offlineStatus();
  assert.equal(complete.type,'SQUATCH_OFFLINE_STATUS');
  assert.equal(complete.ready,true);
  assert.equal(complete.assetCount,assets.length);
  h.stored.delete('/caroms.html');
  assert.equal((await h.offlineStatus()).ready,false);
});

test('repair handshake restores every evicted asset before reporting ready',async () => {
  const h=workerHarness();
  await h.lifecycle('install');
  h.stored.delete('/caroms.html');
  h.stored.delete('/archive.html');
  assert.equal((await h.offlineStatus()).ready,false);
  const repaired=await h.offlineStatus('SQUATCH_OFFLINE_REPAIR');
  assert.equal(repaired.ready,true);
  assert.ok(h.stored.has('/caroms.html'));
  assert.ok(h.stored.has('/archive.html'));
  assert.equal(h.fetches,0);
  h.setOffline(true);
  assert.equal((await h.request('/caroms.html')).ok,true);
  assert.equal(await h.request('/api/stats'),undefined);
});

test('offline or failed repair never falsely reports readiness',async () => {
  const h=workerHarness();
  await h.lifecycle('install');
  h.stored.delete('/rules.html');
  h.setOffline(true);
  assert.equal((await h.offlineStatus('SQUATCH_OFFLINE_REPAIR')).ready,false);
  assert.equal(h.stored.has('/rules.html'),false);
  h.setOffline(false);
  h.setResponse({ok:false,type:'basic',clone(){return {...this};}});
  assert.equal((await h.offlineStatus('SQUATCH_OFFLINE_REPAIR')).ready,false);
  assert.equal(h.stored.has('/rules.html'),false);
});


test('offline extensionless and trailing-slash routes return the requested page, not Home',async()=>{
 const h=workerHarness();await h.lifecycle('install');h.setOffline(true);
 for(const page of ['but-wait','caroms','cutthroat','press-your-luck','tuna','rules','archive','index']){
  for(const path of ['/'+page,'/'+page+'/' ,'/'+page+'?source=installed']){
   const response=await h.request(path);
   assert.equal(response.body,'preloaded /'+page+'.html',path+' must retain its page offline');
  }
 }
 assert.equal((await h.request('/unknown-route')).body,'preloaded /index.html','unknown routes retain Home fallback');
 assert.equal(await h.request('/api/stats'),undefined);
});


test('online page aliases repair the same canonical HTML cache entry',async()=>{
 const h=workerHarness();
 const online=await h.request('/caroms/');assert.equal(online.body,'from network');
 assert.equal(h.stored.size,1);assert.ok(h.stored.has('/caroms.html'));
 h.setOffline(true);
 assert.equal((await h.request('/caroms')).body,'from network');
 assert.equal((await h.request('/caroms.html')).body,'from network');
});
