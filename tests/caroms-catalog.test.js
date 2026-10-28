import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Caroms development playtest is discoverable without being called released',()=>{
 const catalog=read('index.html');
 const caroms=read('caroms.html');
 assert.match(catalog,/href="\.\/caroms\.html"/);
 assert.match(catalog,/DEVELOPMENT PLAYTEST · NOT RELEASED/);
 assert.match(catalog,/Caroms is an unfinished two-player playtest/);
 assert.match(caroms,/id="caroms-table"/);
 assert.match(caroms,/src="\.\/src\/caroms-game\.js"/);
 assert.match(caroms,/Development playtest, not a released mode/);
});

test('But Wait remains the only catalog card labeled PLAYABLE NOW',()=>{
 const catalog=read('index.html');
 assert.equal((catalog.match(/PLAYABLE NOW/g)||[]).length,1);
 assert.match(catalog,/🎱 But Wait, There's More/);
 assert.match(catalog,/IN DEVELOPMENT/);
});
