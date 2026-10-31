import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAMES,rankedGames} from '../src/game-catalog.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms remains offered as bot or local two-player beta',()=>{
 const home=read('index.html'),caroms=read('caroms.html');
 assert.match(home,/id="game-list"/,'homepage has the real game catalog mount');
 assert.match(home,/src="\/src\/game-hub\.js"/,'homepage loads dynamic game cards');
 const game=GAMES.find(g=>g.id==='caroms');
 assert.equal(game.url,'/caroms.html');
 assert.match(game.players,/Solo bot or 2 players/);
 assert.match(caroms,/id="caroms-table"/);
 assert.match(caroms,/src="\.\/src\/caroms-game\.js"/);
 assert.match(caroms,/<option value="bot" selected>Squatch Bot · solo<\/option>/);
 assert.match(caroms,/<option value="local">Local player · pass and play<\/option>/);
 assert.match(caroms,/Solo bot or two local players/);
 assert.match(caroms,/First to two racks wins this playtest match/);
 assert.match(caroms,/content="Play original Caroms.*solo against Squatch Bot/);
 assert.match(read('rules.html'),/href="\.\/caroms\.html">Play Caroms/);
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
