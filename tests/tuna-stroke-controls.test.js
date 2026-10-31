import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/tuna-game.js',import.meta.url),'utf8');
const rack=source.split('function rack(){')[1]?.split('function resetMatch(){')[0]||'';
const shoot=source.split("$('shoot').onclick=()=>{")[1]?.split("$('place').onclick=")[0]||'';
const endShot=source.split('function endShot(){')[1]?.split('function frame(')[0]||'';

test('Tuna starts each rack with a calibrated 85% break and neutral spin',()=>{
 assert.match(rack,/\$\('power'\)\.value='85'/);
 assert.match(rack,/\$\('spin-top'\)\.value='0'/);
 assert.match(rack,/\$\('spin-side'\)\.value='0'/);
 assert.match(rack,/\$\('call-pocket'\)\.value=''/);
});

test('Tuna consumes stroke settings at strike and leaves 68% neutral next shot',()=>{
 const stroke=shoot.indexOf('applyCueSpin(');
 const power=shoot.indexOf("$('power').value='68'",stroke);
 const draw=shoot.indexOf("$('spin-top').value='0'",stroke);
 const english=shoot.indexOf("$('spin-side').value='0'",stroke);
 const moving=shoot.indexOf("phase='moving'",stroke);
 assert.ok(stroke>=0&&power>stroke&&draw>stroke&&english>stroke&&moving>power&&moving>draw&&moving>english,
  'reset power and both spins immediately after applying them, before movement');
 assert.doesNotMatch(endShot,/\$\('power'\)\.value='65'/,
  'settling a shot must not overwrite the neutral power');
});
