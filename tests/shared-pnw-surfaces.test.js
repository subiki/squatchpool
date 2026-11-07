import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const routes=['index','but-wait','caroms','cutthroat','press-your-luck',
              'tuna','arcade','rules','archive'];

test('every route uses the same persistent shared header and PNW surface sheet',()=>{
 for(const route of routes){
  const html=read(route+'.html');
  assert.equal((html.match(/<squatch-header\b/g)||[]).length,1,route+' header');
  assert.equal(html.split('href="/src/pnw-theme.css"').length-1,1,
    route+' must use the shared surface rules exactly once');
  assert.match(html,/shared-header\.css/,route+' must include shared header base');
 }
 // SPA switches [data-page-style] sheets; the brand layer persists between pages.
 const navigation=read('src/static-navigation.js');
 assert.match(navigation,/querySelectorAll\('\[data-page-style\]'\)/);
 assert.match(read('src/pnw-theme.css'),/page-specific style tags load AFTER this persistent stylesheet/);
});

test('header nav uses fixed-size grid tracks independent of route or selected state',()=>{
 const css=read('src/pnw-theme.css');
 const shared=read('src/site-header.js');
 assert.equal((shared.match(/\['\/[^']*',\s*'/g)||[]).length,9,
  'nine fixed shared nav entries including homepage');
 for(const fragment of [
  'squatch-header .squatch-header-nav{',
  'display:grid!important;',
  'grid-template-columns:repeat(6,minmax(0,1fr))!important;',
  'grid-template-columns:repeat(5,minmax(0,1fr))!important;',
  'grid-template-columns:repeat(4,minmax(0,1fr))!important;',
  'grid-template-columns:repeat(3,minmax(0,1fr))!important;',
  'height:56px!important;min-height:56px!important;',
  'grid-auto-columns:156px!important;',
  'width:156px!important;height:54px!important;',
  'squatch-header .squatch-header-nav a[aria-current="page"]',
  'transform:none!important;'
 ])assert.ok(css.includes(fragment),'Missing nav invariant: '+fragment);
 // Never scale a button when selecting another page.
 assert.doesNotMatch(css,/squatch-header\s+\.squatch-header-nav\s+a\[aria-current="page"\][^{]*\{[^}]*\b(?:scale|width|height|padding|font-size)\s*:/,
  'Active route must change its paint only, not sizing');
});

test('topographic line art is the visible first layer on every shared surface',()=>{
 const css=read('src/pnw-theme.css');
 const v3=css.slice(css.indexOf('PNW surface system v3.3'));
 assert.ok(v3,'The unified surface section must be present');
 for(const selector of ['body{','body > main{','squatch-header .squatch-unified-header{',
                      'squatch-header .squatch-header-stats{']){
  const start=v3.indexOf(selector);
  assert.ok(start>=0,selector);
  const block=v3.slice(start,v3.indexOf('}',start)+1);
  assert.match(block,/background-image:\s*var\(--squatch-topo\)/,
    selector+' should place topo above its gradients instead of underneath them');
 }
 for(const token of ['--squatch-panel-surface','--squatch-panel-shadow',
                     '--squatch-topo','--squatch-cedar','--squatch-felt'])
  assert.ok(css.includes(token),token);
 for(const surface of ['.hub-game','.hub-notes','.world-card','.rules-card',
                       '.arcade-stat','.arcade-entry','.game-history',
                       '.game-hud','.game-live-stats','.table-kit',
                       '.press-score-player','.press-score-metrics>div'])
  assert.ok(v3.includes(surface),surface+' must use textured/shaded treatment');
 assert.match(v3,/box-shadow:var\(--squatch-panel-shadow\)!important/);
 assert.match(v3,/\.squatch-header-stats\[open\] summary::before\{content:"▼"\}/);
 assert.doesNotMatch(v3,/canvas\s*\{\s*(?:background|transform|width|height)/,
  'The surface treatment must not redraw or resize the billiards canvas');
});

function luminance(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/
                       (Math.min(luminance(a),luminance(b))+.05);
test('opaque dark panels and light moss/brass controls meet WCAG AA text thresholds',()=>{
 const pairs=[
  ['#F4EEDA','#274B3B'], // brightest opaque card region
  ['#E1EDDF','#274B3B'], // normal text in same card
  ['#F0C478','#244B3A'], // inactive nav text
  ['#102923','#91B98C'], // darkest active nav gradient stop
  ['#102923','#92B787'], // darkest main button gradient stop
  ['#102923','#D8AA58'], // darkest selected button gradient stop
  ['#F4EEDA','#214333'], // game HUD
 ];
 for(const [text,bg] of pairs)
  assert.ok(contrast(text,bg)>=4.5,text+' on '+bg+' contrast '+contrast(text,bg).toFixed(2));
});
