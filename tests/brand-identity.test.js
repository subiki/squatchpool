import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const palette=JSON.parse(read('assets/brand/palette.json'));
const checks=JSON.parse(read('assets/brand/contrast-matrix.json'));
function luma(c){
 const values=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255)
  .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
function ratio(a,b){return (Math.max(luma(a),luma(b))+.05)/(Math.min(luma(a),luma(b))+.05)}
test('light and dark semantic colors pass WCAG AA text and nontext thresholds',()=>{
 assert.equal(checks.length,17);
 for(const pair of checks){
  const actual=ratio(pair.background,pair.foreground);
  assert.ok(actual>=pair.minimum,pair.pair+' ratio '+actual.toFixed(2)+' below '+pair.minimum);
  assert.ok(Math.abs(actual-pair.ratio)<.01,pair.pair+' documented contrast drift');
  assert.equal(pair.pass,true);
 }
});
test('single shared header uses footprint identity and accessible light/dark tokens',()=>{
 const header=read('src/site-header.js').toString();
 const style=read('src/shared-header.css').toString();
 assert.doesNotMatch(header,/♠/);
 assert.match(header,/assets\/brand\/favicon\.svg/);
 assert.match(header,/apple-touch-icon\.png/);
 assert.match(style,/@media \(prefers-color-scheme:light\)/);
 assert.match(style,/--brand-bg:#0C2119/);
 assert.match(style,/--brand-bg:#F7F5EC/);
});
test('tracked SVGs and PNGs have complete standalone formats and correct icon dimensions',()=>{
 for(const n of ['mark-dark','mark-light','mark-mono','favicon','badge','badge-light','textured-badge','wordmark-dark','wordmark-light','social-square','forest-banner','pattern-fern','brand-artboard']){
  const content=read('assets/brand/'+n+'.svg').toString();
  assert.match(content,/<svg /,n);assert.match(content,/<\/svg>/,n);
 }
 for(const [n,size] of [['favicon-32',32],['apple-touch-icon',180],['app-icon-192',192],['app-icon-512',512]]){
  const bytes=read('assets/brand/'+n+'.png');
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',n+' signature');
  assert.equal(bytes.readUInt32BE(16),size,n+' width');
  assert.equal(bytes.readUInt32BE(20),size,n+' height');
 }
 const build=read('scripts/build-pwa.mjs').toString();
 assert.match(build,/copyFileSync\(source,fromRoot\('app-icon-'/);
 assert.match(build,/scan\('assets\/brand'\)/);
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.background_color,palette.night);
 assert.equal(manifest.theme_color,palette.forest);
});
