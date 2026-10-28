import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAME_CATALOG} from '../src/stats-games.js';
import {initCaromsStats} from '../src/caroms-stats.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms playtest reports a rack only when the 1-ball break is struck',()=>{
 const game=read('src/caroms-game.js');
 assert.match(game,/statsRackId:newCaromsStatsId\(\)/);
 assert.match(game,/if\(state\.breakShot\)reportCaromsRack\(state\.statsRackId\)/);
 assert.match(game,/if\(made\)reportCaromsBalls\(state\.statsRackId,shot\.statsShotId,made\)/);
 assert.match(game,/decision\.pocketed\.filter\(id=>id!==0\)/);
 assert.match(game,/initCaromsStats\(\);newGame\(\)/);
});

test('Caroms stats panel is visible above the game table and honest about outages',()=>{
 const html=read('caroms.html');
 assert.ok(html.indexOf('id="caroms-stats-game"')<html.indexOf('id="caroms-table"'));
 assert.match(html,/id="caroms-stats-site"/);
 assert.match(html,/id="caroms-stats-status"/);
 assert.match(html,/Statistics unavailable until connected/);
 const adapter=read('src/caroms-stats.js');
 assert.match(adapter,/gameId:GAME_ID/);
 assert.match(adapter,/Statistics unavailable; you can still play/);
});

test('Caroms has a distinct 16-event cap for the provisional break 8 re-spot',()=>{
 const caroms=GAME_CATALOG.find(g=>g.id==='caroms');
 assert.equal(caroms.maxBallsPerRack,16);
 assert.equal(GAME_CATALOG.find(g=>g.id==='but-wait-theres-more').maxBallsPerRack,14);
});


test('Caroms still initializes when reading localStorage throws SecurityError',()=>{
 const keys=['localStorage','document','window','fetch'];
 const original=Object.fromEntries(keys.map(key=>[key,
  Object.getOwnPropertyDescriptor(globalThis,key)]));
 try{
  Object.defineProperty(globalThis,'localStorage',{
   configurable:true,get(){throw new Error('SecurityError: storage denied');}
  });
  globalThis.document={getElementById:()=>null};
  globalThis.window={addEventListener:()=>{}};
  globalThis.fetch=undefined;
  assert.doesNotThrow(()=>initCaromsStats(),
   'optional telemetry must not block a playable Caroms rack');
 }finally{
  for(const key of keys){
   if(original[key])Object.defineProperty(globalThis,key,original[key]);
   else delete globalThis[key];
  }
 }
});
