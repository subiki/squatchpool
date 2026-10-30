import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms beta catalog offers both solo bot and local pass-and-play',()=>{
 const catalog=read('index.html');
 const caroms=read('caroms.html');
 assert.match(catalog,/href="\.\/caroms\.html"/);
 assert.match(catalog,/PLAYABLE BETA · SOLO OR LOCAL/);
 assert.match(catalog,/Caroms uses provisional rule interpretations/);
 assert.match(caroms,/id="caroms-table"/);
 assert.match(caroms,/src="\.\/src\/caroms-game\.js"/);
 assert.match(caroms,/<option value="bot" selected>Squatch Bot · solo<\/option>/);
 assert.match(caroms,/<option value="local">Local player · pass and play<\/option>/);
 assert.match(caroms,/Solo bot or two local players/);
 assert.match(caroms,/First to two racks wins this playtest match/);
 assert.match(caroms,/content="Play original Caroms.*solo against Squatch Bot/);
 const rules=read('rules.html');
 assert.match(rules,/href="\.\/caroms\.html">Play Caroms/);
});

test('But Wait remains the primary table and Caroms is a playable beta',()=>{
 const catalog=read('index.html');
 assert.equal((catalog.match(/PLAYABLE NOW/g)||[]).length,1);
 assert.match(catalog,/🎱 But Wait, There's More/);
 // The original placeholder was retired when Cutthroat and Press Your Luck shipped.
 // Guard the actual playable catalog instead of requiring stale IN DEVELOPMENT copy.
 assert.match(catalog,/href="\.\/cutthroat\.html"/);
 assert.match(catalog,/PLAYABLE BETA · THREE LOCAL PLAYERS/);
 assert.match(catalog,/href="\.\/press-your-luck\.html"/);
 assert.match(catalog,/PLAYABLE BETA · TWO LOCAL PLAYERS/);
});
