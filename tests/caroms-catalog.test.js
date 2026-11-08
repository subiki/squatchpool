import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAMES,rankedGames} from '../src/game-catalog.js';
import {mountGameHub} from '../src/game-hub.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms remains offered as bot or local two-player beta',()=>{
 const home=read('index.html'),caroms=read('caroms.html');
 assert.match(home,/id="game-list"/,'homepage has the real game catalog mount');
 assert.match(home,/src="\/src\/static-navigation\.js"/,'homepage mounts dynamic cards through the static shell');
 const game=GAMES.find(g=>g.id==='caroms');
 assert.equal(game.url,'/caroms.html');
 assert.match(game.players,/Solo.*Squatch Bot.*2.*players/);
 assert.match(caroms,/id="caroms-table"/);
 assert.match(caroms,/src="\.\/src\/caroms-entry\.js"/);
 assert.match(caroms,/<option value="bot" selected>Squatch Bot · solo<\/option>/);
 assert.match(caroms,/<option value="local">Local player · pass and play<\/option>/);
 assert.ok(read('src/game-page-shell.js').includes("players:'caroms-mode'"),
  'shared page template must own Caroms player selection');
 assert.match(caroms,/First to two racks wins this playtest match/);
 assert.match(caroms,/content="Play original Caroms.*solo against Squatch Bot/);
 assert.ok(game.rules.length>=3,'Caroms rules now appear in the expandable homepage card');
});

test('Home remounts five ranked game cards without stale renders or repeated ranking requests',async()=>{
 const previous={document:globalThis.document,fetch:globalThis.fetch};
 const node=tag=>({tag,children:[],dataset:{},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},querySelectorAll(){return [];}});
 const view=()=>{const list=node('div'),note=node('p');return {list,note,querySelector:selector=>selector==='#game-list'?list:note};};
 let resolve,requests=0;
 try{
  globalThis.document={createElement:node};
  globalThis.fetch=()=>{requests++;return new Promise(done=>{resolve=done;});};
  const first=view(),second=view(),dispose=mountGameHub(first);
  assert.equal(first.list.children.length,5,'all games remain playable while ranking loads');
  dispose();mountGameHub(second);
  resolve({ok:true,json:async()=>({games:GAMES.map(game=>({id:game.id,racks:game.id==='tuna'?25:3}))})});
  await new Promise(done=>setImmediate(done));
  assert.equal(requests,1);
  assert.equal(first.note.textContent,undefined,'disposed Home cannot receive a late update');
  assert.equal(second.list.children.length,5);
  assert.equal(second.list.children[0].children.at(-1).href,'/tuna.html','real server ranking is restored on remount');
  const third=view();mountGameHub(third);await new Promise(done=>setImmediate(done));
  assert.equal(requests,1,'returning Home reuses its ranking snapshot');
  assert.equal(third.list.children[0].children.at(-1).href,'/tuna.html');
 }finally{
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
 }
});

test('static shell page styles remain self-contained for offline swaps',()=>{
 for(const file of ['src/world.css','src/game-hub.css','src/game-page-layout.css','src/shot-announcer.css','src/aim-preference.css'])assert.doesNotMatch(read(file),/url\s*\(|@import/i);
});

test('homepage gives five original games equal cards and shows Arcade separately',()=>{
 const home=read('index.html');
 assert.equal(GAMES.length,5);
 assert.deepEqual(GAMES.map(g=>g.id),
  ['but-wait-theres-more','caroms','cutthroat','press-your-luck','tuna']);
 assert.deepEqual(rankedGames().map(g=>g.id),GAMES.map(g=>g.id),
  'unknown popularity preserves editorial order, not fabricated ranks');
 const stats=GAMES.map(g=>({id:g.id,racks:g.id==='tuna'?25:3}));
 assert.equal(rankedGames(stats)[0].id,'tuna','popularity uses actual comparable rack totals');
 assert.match(home,/id="games"/);
 assert.match(home,/id="arcade-lab"/);
 assert.match(home,/href="\/arcade\.html"/);
 assert.ok(home.indexOf('id="games"')<home.indexOf('id="arcade-lab"'),
  'arcade cannot replace or push ahead of the five original games');
});
