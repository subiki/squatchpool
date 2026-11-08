import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {GAME_PAGE_CONFIG,prepareGamePage} from '../src/game-page-shell.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pages=[
 ['but-wait','but-wait.html','src/game.js','mountButWaitGame'],
 ['caroms','caroms.html','src/caroms-game.js','mountCaromsGame'],
 ['cutthroat','cutthroat.html','src/cutthroat-game.js','mountCutthroatGame'],
 ['press-your-luck','press-your-luck.html','src/press-your-luck-game.js','mountPressGame'],
 ['tuna','tuna.html','src/tuna-game.js','mountTunaGame'],
 ['arcade','arcade.html','src/arcade-game.js',null],
];
test('one canonical game template config covers every playable route',()=>{
 assert.deepEqual(Object.keys(GAME_PAGE_CONFIG),pages.map(([id])=>id));
 const shell=read('src/game-page-shell.js');
 assert.match(shell,/main\.replaceChildren\(hero,setup,rules,play,extras\)/,
   'Exactly one shared five-slot composition');
 assert.match(shell,/normalizeKit\(main,doc\)/);
 assert.match(shell,/'squatch-shot-row'/);
 assert.match(shell,/'squatch-shot-actions'/);
 assert.match(shell,/main\.dataset\.squatchGameShell=gameId/);
 assert.match(shell,/size\.addEventListener\('change'/,
   'But Wait needs a real visible select driving its existing size behavior');
 assert.match(shell,/squatch-legacy-size/);
 assert.equal(prepareGamePage({},'unknown'),false,'unsupported game is a no-op');
});
test('every game imports the same composer before wiring controls',()=>{
 for(const [id,path,controller,mount] of pages){
  const html=read(path),script=read(controller);
  assert.equal(html.split('href="/src/game-shell.css"').length-1,1,path+' shared CSS');
  assert.match(html,/href="\/src\/pnw-theme\.css"/,path+' local brand');
  assert.match(html,/<squatch-header><\/squatch-header>/,path+' shared header');
  assert.equal((html.match(/id="table-stage"/g)||[]).length,1,path+' unique stage');
  assert.equal((html.match(/class="table-kit"/g)||[]).length,1,path+' kit');
  assert.match(script,/import \{prepareGamePage\} from '.\/game-page-shell\.js'/,controller);
  if(mount){
   const open=script.indexOf('export function '+mount+'(');
   const prepare=script.indexOf("prepareGamePage(root,'"+id+"');",open);
   const listen=script.indexOf('mountTableKit(root)',open);
   assert.ok(open>=0&&prepare>open,controller+' invokes shared composer');
   if(listen>=0)assert.ok(prepare<listen,controller+' must compose before events');
  }else{
   assert.ok(script.indexOf("prepareGamePage(document,'arcade')")<script.indexOf('const canvas='),
    'Arcade must compose before querying elements');
  }
 }
});
test('all routes share the same layout, tables, controls and brand grammar',()=>{
 const css=read('src/game-shell.css');
 for(const fragment of [
  '.squatch-page-title','.squatch-setup-grid','.squatch-setting',
  '.squatch-game-rules','.squatch-game-play','.squatch-game-after',
  '.squatch-shot-row','.squatch-shot-actions','.kit-more',
  '#table-stage:fullscreen','@media(max-width:660px)',
  "url('/assets/brand/pnw-moss.jpg')","url('/assets/brand/pnw-forest.jpg')"
 ])assert.ok(css.includes(fragment),'Missing common surface: '+fragment);
 assert.match(css,/squatch-shot-row:has\(\.kit-striker\)/,
  'Only game-specific striker extends the common row');
 assert.doesNotMatch(css,/texture-topography|docs\.google\.com|beforeinstallprompt/);
});
test('the contract and agent docs explicitly prohibit another divergent page design',()=>{
 const files=['README.md','AGENTS.md','docs/README.md','docs/ARCHITECTURE.md',
              'docs/GAME_PAGE_TEMPLATE.md','docs/ROADMAP.md','docs/BACKLOG.md','docs/DELIVERY.md'];
 for(const file of files)assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
 const agents=read('AGENTS.md'),contract=read('docs/GAME_PAGE_TEMPLATE.md');
 assert.match(agents,/ONE shared game-page template/);
 assert.match(agents,/src\/game-page-shell\.js/);
 assert.match(contract,/Introduction/);
 assert.match(contract,/Set up your game/);
 assert.match(contract,/How to play/);
 assert.match(contract,/At the table/);
 assert.match(contract,/Details and history/);
 assert.match(contract,/Do not/);
});
test('game-specific selectable fields remain configured and are not secretly dropped',()=>{
 for(const [id,path] of pages){
  const html=read(path),config=GAME_PAGE_CONFIG[id];
  for(const field of [config.players,config.size,...config.extras.map(([name])=>name)].filter(Boolean))
   assert.ok(html.includes('id="'+field+'"'),id+' needs original '+field+' control');
 }
 assert.equal(GAME_PAGE_CONFIG.arcade.size,null,'fixed arcade table is read-only');
 assert.equal(GAME_PAGE_CONFIG.cutthroat.players,'cut-players','three player seats remain distinct');
 assert.deepEqual(GAME_PAGE_CONFIG.caroms.extras.map(e=>e[0]),['caroms-level-0','caroms-level-1']);
});
