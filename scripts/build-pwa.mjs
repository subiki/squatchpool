/**
 * Cloudflare Pages output is the repository root. Generate portable, dependency-free
 * PWA assets during the existing npm postinstall/build, with no second deployment.
 */
import {readdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';

const root=fileURLToPath(new URL('../',import.meta.url));
const fromRoot=(p)=>join(root,p);
const rgba=(r,g,b)=>[r,g,b,255];
// Minimal generated PNG icons. No network, fonts, libraries or external artwork.
function pixel(x,y) {
 const r=Math.hypot(x-0.5,y-0.55);
 let color=rgba(16,29,25);
 for(const tree of [[0.14,0.07,0.17,0.40],[0.80,0.09,0.14,0.37],
                    [0.07,0.28,0.11,0.34],[0.92,0.32,0.11,0.32]]) {
  const [tx,ty,tw,th]=tree;
  if(y>=ty && y<ty+th && Math.abs(x-tx)<tw*(y-ty)/th)color=rgba(55,111,88);
 }
 if(r<0.335) color=rgba(164,210,184);
 if(r<0.32) color=rgba(8,15,16);
 if(Math.hypot(x-0.5,y-0.535)<0.162) color=rgba(245,231,196);
 // A stylized 8, readable even in the launcher at small sizes.
 const upper=Math.hypot((x-0.5)/0.056,(y-0.493)/0.050);
 const lower=Math.hypot((x-0.5)/0.079,(y-0.574)/0.068);
 if((upper<1 && upper>0.52)||(lower<1 && lower>0.53))color=rgba(16,29,25);
 return color;
}
const crcTable=Array.from({length:256},(_,i)=>{
 let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function chunk(name,data){
 const type=Buffer.from(name);
 const b=Buffer.concat([type,data]); let crc=0xffffffff;
 for(const byte of b)crc=crcTable[(crc^byte)&255]^(crc>>>8);
 const out=Buffer.alloc(12+data.length);
 out.writeUInt32BE(data.length,0);type.copy(out,4);data.copy(out,8);
 out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;
}
function makeIcon(size){
 const bytes=Buffer.alloc(size*(size*4+1));let n=0;
 for(let y=0;y<size;y++){
  bytes[n++]=0; // PNG filter none
  for(let x=0;x<size;x++)for(const value of pixel((x+0.5)/size,(y+0.5)/size))bytes[n++]=value;
 }
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
 ihdr[8]=8;ihdr[9]=6;
 writeFileSync(fromRoot('app-icon-'+size+'.png'),Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),chunk('IDAT',deflateSync(bytes,{level:9})),
  chunk('IEND',Buffer.alloc(0))
 ]));
}
makeIcon(192);makeIcon(512);
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
scan('src');scan('archive/source');
const all=[...assets].filter(item=>item!=='/').sort();
const hash=createHash('sha256');
for(const p of all){hash.update(p);hash.update(readFileSync(fromRoot(p.slice(1))));}
const version=hash.digest('hex').slice(0,16);
const source=readFileSync(fromRoot('scripts/sw-template.js'),'utf8');
writeFileSync(fromRoot('service-worker.js'),source
 .replace('__CACHE_VERSION__',version)
 .replace('__PRECACHE_LIST__',JSON.stringify(all)),'utf8');
console.log('Squatch offline bundle:',all.length,'assets, version',version);
