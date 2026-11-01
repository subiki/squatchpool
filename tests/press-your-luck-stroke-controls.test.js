import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,fullRack,canPlaceBreakCue,kitchenPoint,headStringX} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';
import {createCuePlacement} from '../src/shot-lifecycle.js';

const source=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');
const rack=source.split('function rack(){')[1]?.split('function update(){')[0]||'';
const update=source.split('function update(){')[1]?.split('function begin(){')[0]||'';
const shoot=source.split("$('shoot').onclick=()=>{")[1]?.split("$('place').onclick=")[0]||'';

test('Press Your Luck starts ready to BREAK with a strong neutral stroke',()=>{
 assert.match(rack,/shot\.startRack\(\)/);
 assert.match(rack,/\$\('power'\)\.value='85'/);
 assert.match(rack,/\$\('spin-top'\)\.value='0'/);
 assert.match(rack,/\$\('spin-side'\)\.value='0'/);
 assert.match(rack,/\$\('bank'\)\.checked=false/);
 assert.match(update,/\$\('shoot'\)\.textContent=shot\.breakShot\?'BREAK':'SHOOT'/);
 assert.match(update,/\$\('break-reposition'\)\.hidden=true/);
 assert.doesNotMatch(rack,/placeBreak|confirm its position/);
});

test('Press Your Luck consumes selected power and spin before resetting controls',()=>{
 const speed=shoot.indexOf('shotSpeed(');
 const spin=shoot.indexOf('applyCueSpin(',speed);
 const powerReset=shoot.indexOf("$('power').value='68'",spin);
 const topReset=shoot.indexOf("$('spin-top').value='0'",spin);
 const sideReset=shoot.indexOf("$('spin-side').value='0'",spin);
 const moving=shoot.indexOf('shot.startShot()',spin);
 assert.ok(speed>=0&&spin>speed&&powerReset>spin&&topReset>spin&&sideReset>spin&&
  moving>powerReset&&moving>topReset&&moving>sideReset,
  'shot must consume chosen settings before resetting and starting movement');
});

test('Press Your Luck uses shared break placement without a confirmation gate',()=>{
 const html=readFileSync(new URL('../press-your-luck.html',import.meta.url),'utf8');
 assert.match(html,/id="table-stage"/);
 assert.match(source,/createCuePlacement\(\{getBalls:/);
 assert.match(source,/cuePlacement\.pointerDown\(tablePoint\(e\)\)/);
 assert.match(source,/cuePlacement\.pointerMove\(tablePoint\(e\)\)/);
 assert.match(source,/cuePlacement\.pointerUp\(\)/);
 assert.match(update,/const placing=shot\.phase==='place'/);
 assert.doesNotMatch(source,/Confirm break position/);
});

test('Press Your Luck shared kitchen placement respects 7, 8 and 9 ft boundaries',()=>{
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=fullRack(),cue=balls.find(b=>b.id===0);
  Object.assign(cue,kitchenPoint(TABLE.width*.18,TABLE.height/2));
  const control=createCuePlacement({getBalls:()=>balls,getCue:()=>cue});
  const original={x:cue.x,y:cue.y};
  assert.equal(control.pointerDown({x:headStringX()+15,y:TABLE.height/2}),false,
   'tapping beyond kitchen must aim instead of teleporting cue');
  assert.deepEqual({x:cue.x,y:cue.y},original);
  const x=2*TABLE.radius+15,y=TABLE.height/2+18;
  assert.equal(control.pointerDown({x,y}),true);
  assert.ok(canPlaceBreakCue(balls,cue.x,cue.y));
  assert.equal(cue.x,x);
  assert.equal(cue.y,y);
  assert.equal(control.pointerMove({x:TABLE.width*.9,y}),true);
  assert.ok(cue.x<headStringX(),'drag must remain in the kitchen');
  assert.equal(control.pointerUp(),true);
 }
 setTableSize(9);
});
