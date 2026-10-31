import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');
const rack=source.split('function rack(){')[1]?.split('function update(){')[0]||'';
const update=source.split('function update(){')[1]?.split('function begin(){')[0]||'';
const shoot=source.split("$('shoot').onclick=()=>{")[1]?.split("$('place').onclick=")[0]||'';

test('Press Your Luck starts each rack with a strong neutral break and a visible BREAK action',()=>{
 assert.match(rack,/\$\('power'\)\.value='85'/);
 assert.match(rack,/\$\('spin-top'\)\.value='0'/);
 assert.match(rack,/\$\('spin-side'\)\.value='0'/);
 assert.match(rack,/\$\('bank'\)\.checked=false/);
 assert.match(update,/\$\('shoot'\)\.textContent=breakShot\?'BREAK':'SHOOT'/);
});

test('Press Your Luck consumes selected power and spin before resetting the next shot to neutral',()=>{
 const speed=shoot.indexOf('shotSpeed(');
 const spin=shoot.indexOf('applyCueSpin(',speed);
 const powerReset=shoot.indexOf("$('power').value='68'",spin);
 const topReset=shoot.indexOf("$('spin-top').value='0'",spin);
 const sideReset=shoot.indexOf("$('spin-side').value='0'",spin);
 const moving=shoot.indexOf("phase='moving'",spin);
 assert.ok(speed>=0&&spin>speed&&powerReset>spin&&topReset>spin&&sideReset>spin&&
  moving>powerReset&&moving>topReset&&moving>sideReset,
  'shot must use chosen stroke settings before returning sliders to 68% and zero spin');
});
