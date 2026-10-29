import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms playable beta is discoverable with source and local play controls',()=>{
 const catalog=read('index.html');
 const caroms=read('caroms.html');
 assert.match(catalog,/href="\.\/caroms\.html"/);
 assert.match(catalog,/PLAYABLE BETA · TWO LOCAL PLAYERS/);
 assert.match(catalog,/Caroms uses provisional rule interpretations/);
 assert.match(caroms,/id="caroms-table"/);
 assert.match(caroms,/src="\.\/src\/caroms-game\.js"/);
 assert.match(caroms,/Playable local beta/);
 const rules=read('rules.html');
 assert.match(rules,/href="\.\/caroms\.html">Play Caroms/);
});

test('But Wait remains the primary table and Caroms is a playable beta',()=>{
 const catalog=read('index.html');
 assert.equal((catalog.match(/PLAYABLE NOW/g)||[]).length,1);
 assert.match(catalog,/🎱 But Wait, There's More/);
 assert.match(catalog,/IN DEVELOPMENT/);
});
