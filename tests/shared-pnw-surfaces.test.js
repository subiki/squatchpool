import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const routes=['index','but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];
const css=read('src/pnw-theme.css');
const v4=css.slice(css.indexOf('PNW surface system v4'));
const assets=['pnw-forest.jpg','pnw-cedar.jpg','pnw-moss.jpg','pnw-water.jpg'];

test('all routes retain one canonical header and persistent textured theme',()=>{
 for(const page of routes){
  const html=read(page+'.html');
  assert.equal((html.match(/<squatch-header\b/g)||[]).length,1,page);
  assert.equal(html.split('href="/src/site-styles.css"').length-1,1,page);
  assert.match(html,/data-squatch-shared-styles/,page);
  const shared=read('src/site-styles.css');
  assert.match(shared,/pnw-theme\.css/,page);
  assert.match(shared,/shared-header\.css/,page);
 }
 const nav=read('src/static-navigation.js');
 assert.match(nav,/querySelectorAll\('\[data-page-style\]'\)/);
 assert.ok(v4.startsWith('PNW surface system v4'));
});
test('real material images are locally committed JPEGs, not remote texture URLs',()=>{
 for(const file of assets){
  const bytes=readFileSync(new URL('../assets/brand/'+file,import.meta.url));
  assert.ok(bytes.length>500,file+' must contain actual picture data');
  assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff',file+' is a JPEG');
  assert.equal(bytes.subarray(-2).toString('hex'),'ffd9',file+' closes properly');
  assert.match(v4,new RegExp('pnw-'+file.split('-')[1].replace('.jpg','')+'\\.jpg'));
 }
 const build=read('scripts/build-pwa.mjs');
 assert.match(build,/scan\('assets\/brand'\)/,
  'offline PWA should bundle its locally committed branded textures');
});
test('no repeatable topographic wallpaper remains in the final effective theme',()=>{
 // Old source selectors may still exist for backward compatibility; the new
 // later !important rules MUST replace them without references to topo.
 assert.ok(v4.length>1000,'unified final v4 theme must be present');
 assert.doesNotMatch(v4,/texture-topography|--squatch-topo|repeat\([^)]*topo/,
  'Do not reintroduce giant repeated contour paths');
 for(const selector of ['body{','body > main{','squatch-header .squatch-unified-header{']){
  const i=v4.indexOf(selector);assert.ok(i>=0,selector);
  const block=v4.slice(i,v4.indexOf('}',i)+1);
  assert.match(block,/background-image:/,selector+' defines atmospheric imagery');
  assert.match(block,/background-repeat:/,selector+' has explicit no-repeat layers');
 }
 assert.match(v4,/background-repeat:no-repeat,no-repeat,repeat!important/);
 assert.match(v4,/--pnw-photo-forest/);
 assert.match(v4,/--pnw-photo-wood/);
 assert.match(v4,/--pnw-photo-moss/);
 assert.match(v4,/--pnw-photo-water/);
});
test('shared header nav has stable dimensions and equal tracks on all pages',()=>{
 const header=read('src/site-header.js');
 assert.equal((header.match(/\['\/[^']*',\s*'/g)||[]).length,7);
 for(const invariant of [
  'grid-template-columns:repeat(6,minmax(0,1fr))!important',
  'grid-template-columns:repeat(5,minmax(0,1fr))!important',
  'grid-template-columns:repeat(4,minmax(0,1fr))!important',
  'grid-template-columns:repeat(3,minmax(0,1fr))!important',
  'height:56px!important;min-height:56px!important',
  'grid-auto-columns:156px!important',
  'width:156px!important;height:54px!important',
  'squatch-header .squatch-header-nav a[aria-current="page"]'
 ])assert.ok(v4.includes(invariant),invariant);
 assert.doesNotMatch(v4,/squatch-header \.squatch-header-nav a\[aria-current="page"\][^{]*\{[^}]*\b(?:width|height|font-size|padding|transform):/,
   'Selecting a route changes colors, not geometry');
});
function luminance(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
 .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/
 (Math.min(luminance(a),luminance(b))+.05);
test('representative opaque endpoints keep accessible text while using imagery',()=>{
 const pairs=[
  ['#F4EEDA','#244A39'],['#E1EDDF','#244A39'],
  ['#F0C478','#315D46'],['#102923','#92B787'],
  ['#102923','#8CB786'],['#102923','#D8AA58'],
  ['#F4EEDA','#214333'],['#F4EEDA','#0C2119']
 ];
 for(const [text,bg] of pairs)
  assert.ok(contrast(text,bg)>=4.5,text+' on '+bg+' ratio '+contrast(text,bg).toFixed(2));
});
test('table canvases, native install, and reduced-motion behavior are preserved',()=>{
 assert.doesNotMatch(v4,/canvas\s*\{[^}]*\b(?:background|transform|width|height)\s*:/,
   'No gameplay canvas geometry changes');
 assert.match(v4,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(read('src/pwa.js'),/beforeinstallprompt|Install game/);
});
