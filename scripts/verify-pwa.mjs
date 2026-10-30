/** Fail the Pages build if its installable offline payload is incomplete. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path));
const pages=readdirSync(root).filter(p=>p.endsWith('.html')).sort();
const essentials=[...pages.map(p=>'/'+p),'/manifest.webmanifest',
  '/app-icon-192.png','/app-icon-512.png','/src/pwa.js',
  '/src/game.js','/src/caroms-game.js','/src/cutthroat-game.js','/src/press-your-luck-game.js',
  '/src/aim-preference.js','/src/aim-preference.css'];
const manifest=JSON.parse(read('manifest.webmanifest').toString());
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'/');
assert.equal(manifest.scope,'/');
for(const page of pages){
  const html=read(page).toString();
  assert.match(html,/rel="manifest"\s+href="\/manifest\.webmanifest"/,page);
  assert.match(html,/src="\/src\/pwa\.js"/,page);
}
for(const size of [192,512]){
  const path='app-icon-'+size+'.png';
  assert.ok(existsSync(join(root,path)),path);
  const png=read(path);
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],path);
  assert.equal(png.readUInt32BE(16),size,path+' width');
  assert.equal(png.readUInt32BE(20),size,path+' height');
  assert.ok(manifest.icons.some(icon=>icon.src==='/'+path && icon.sizes===size+'x'+size),path+' manifest');
}
const worker=read('service-worker.js').toString();
assert.ok(!worker.includes('__CACHE_VERSION__')&&!worker.includes('__PRECACHE_LIST__'),'unexpanded worker template');
const match=worker.match(/const PRECACHE = (\[[^\n]+\]);/);
assert.ok(match,'generated worker precache list');
const assets=JSON.parse(match[1]);
assert.ok(Array.isArray(assets),'worker precache must be an array');
assert.equal(new Set(assets).size,assets.length,'duplicate worker precache paths');

// Check the ENTIRE offline edition, not only a few known entry points.
// A missing CSS/JS/lore asset would otherwise pass the build verifier and
// cause Cache.addAll to fail during installation on a real device.
const expected=new Set([...essentials,'/LICENSE','/THIRD_PARTY.md']);
function collect(dir){
  const folder=join(root,dir);
  if(!existsSync(folder))return;
  for(const entry of readdirSync(folder,{withFileTypes:true})){
    const path=dir+'/'+entry.name;
    if(entry.isDirectory())collect(path);
    else if(/\.(?:js|css|html|svg|png|jpg|jpeg|webp|woff2?|txt)$/i.test(entry.name))
      expected.add('/'+path);
  }
}
collect('src');
collect('archive/source');
if(existsSync(join(root,'deployment.json')))expected.add('/deployment.json');
for(const path of assets){
  assert.match(path,/^\/[^/?#]+(?:\/[^/?#]+)*$/,'invalid worker asset path: '+path);
  assert.ok(!path.startsWith('/api/'),'API must not be precached: '+path);
  assert.ok(existsSync(join(root,path.slice(1))),'offline source missing '+path);
}
assert.deepEqual([...assets].sort(),[...expected].sort(),
  'worker precache must include every local playable/source asset, with no stale entries');
assert.ok(worker.includes("url.pathname.startsWith('/api/')"),'API bypass must remain network-only');
console.log('Offline bundle verified: '+assets.length+' assets, '+pages.length+' pages, both launcher icons; API network-only');
