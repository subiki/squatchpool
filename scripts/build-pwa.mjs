/**
 * Cloudflare Pages output is the repository root. Generate portable, dependency-free
 * PWA assets during the existing npm postinstall/build, with no second deployment.
 */
import {readdirSync,readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const fromRoot=(p)=>join(root,p);
// Copy the tracked PWA footprint icon exports; never regenerate the previous icon.
for (const size of [192,512]) {
 const source=fromRoot('assets/brand/app-icon-'+size+'.png');
 if (!existsSync(source)) throw new Error('Missing committed brand icon: '+source);
 copyFileSync(source,fromRoot('app-icon-'+size+'.png'));
}

const assets=new Set(['/','/index.html','/manifest.webmanifest','/app-icon-192.png','/app-icon-512.png']);
function scan(dir){
 if(!existsSync(fromRoot(dir)))return;
 for(const entry of readdirSync(fromRoot(dir),{withFileTypes:true})){
  const p=join(dir,entry.name);
  if(entry.isDirectory())scan(p);
  else if(/\.(?:js|css|html|svg|png|jpg|jpeg|webp|woff2?|txt)$/i.test(entry.name))
   assets.add('/'+p.split('\\').join('/'));
 }
}
for(const file of readdirSync(root)){
 if(file.endsWith('.html'))assets.add('/'+file);
}
for(const file of ['LICENSE','THIRD_PARTY.md','deployment.json']){
 if(existsSync(fromRoot(file)))assets.add('/'+file);
}
scan('src');scan('assets/brand');scan('archive/source');
const all=[...assets].filter(item=>item!=='/').sort();
const hash=createHash('sha256');
for(const p of all){hash.update(p);hash.update(readFileSync(fromRoot(p.slice(1))));}
const version=hash.digest('hex').slice(0,16);
const source=readFileSync(fromRoot('scripts/sw-template.js'),'utf8');
writeFileSync(fromRoot('service-worker.js'),source
 .replace('__CACHE_VERSION__',version)
 .replace('__PRECACHE_LIST__',JSON.stringify(all)),'utf8');
console.log('Squatch offline bundle:',all.length,'assets, version',version);
