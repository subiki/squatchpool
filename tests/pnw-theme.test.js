import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pages=['index','but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];
test('all routes load one shared PNW visual system outside SPA-managed page styles',()=>{
 for(const page of pages){
  const html=read(page+'.html');
  const expected='<link rel="stylesheet" href="/src/site-styles.css" data-squatch-shared-styles>';
  assert.equal(html.split(expected).length-1,1,page+' must load the common theme once');
  assert.doesNotMatch(html,/href="\/src\/pnw-theme\.css"/);
  assert.match(read('src/site-styles.css'),/pnw-theme\.css/);
 }
});
test('nature textures and light/dark contrast never sit above the playing canvas',()=>{
 const css=read('src/pnw-theme.css');
 for(const asset of ['texture-topography.svg','texture-cedar.svg','texture-felt.svg','forest-banner.svg'])
  assert.ok(css.includes('/assets/brand/'+asset),asset);
 assert.match(css,/@media\s*\(prefers-color-scheme:light\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.table-stage canvas\{box-shadow:none!important\}/);
 assert.doesNotMatch(css,/canvas\s*\{\s*background-image/);
 const pwa=read('src/pwa.js');
 assert.doesNotMatch(pwa,/beforeinstallprompt|Install game/);
});
