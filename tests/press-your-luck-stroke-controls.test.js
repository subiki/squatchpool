import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,fullRack,canPlaceBreakCue,kitchenPoint,headStringX} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';

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

test('Press Your Luck requires an actual kitchen placement before BREAK on every rack',()=>{
 const html=readFileSync(new URL('../press-your-luck.html',import.meta.url),'utf8');
 assert.match(html,/id="table-stage"/);
 assert.match(html,/id="break-reposition"/);
 assert.match(rack,/phase='placeBreak';breakShot=true;breakPlacementValid=false/);
 assert.match(update,/phase==='placeBreak'&&!breakPlacementValid/);
 assert.match(update,/\$\('shoot'\)\.disabled=phase!=='aim'/);
 assert.match(source,/if\(phase==='placeBreak'&&breakPlacementValid\)\{phase='aim'/);
 assert.match(source,/if\(phase==='aim'&&breakShot\).*phase='placeBreak'/s);
});

test('Press Your Luck break placement accepts legal kitchen taps and rejects out-of-kitchen taps on 7, 8 and 9 ft',()=>{
 const start=source.indexOf('function aimPointer(e,allowCall=false){');
 const end=source.indexOf("canvas.addEventListener('pointerdown'",start);
 assert.ok(start>=0&&end>start,'real pointer handler is present');
 const handler=source.slice(start,end);
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=fullRack(),cue=()=>balls[0],notice={textContent:''};
  let updates=0;
  const canvas={width:TABLE.width,height:TABLE.height,clientWidth:TABLE.width,clientHeight:TABLE.height,
   clientLeft:0,clientTop:0,getBoundingClientRect:()=>({left:0,top:0})};
  const control=new Function('canvas','TABLE','canPlaceBreakCue','kitchenPoint','headStringX','balls','cue','$','update',
   'let phase="placeBreak",breakPlacementValid=false,angle=0;'+handler+
   'return {aimPointer,valid:()=>breakPlacementValid};')(
   canvas,TABLE,canPlaceBreakCue,kitchenPoint,headStringX,balls,cue,()=>notice,()=>updates++);
  const original={x:cue().x,y:cue().y};
  control.aimPointer({clientX:headStringX()+15,clientY:TABLE.height/2});
  assert.equal(control.valid(),false,'out-of-kitchen tap must not enable BREAK on '+size+' ft');
  assert.deepEqual({x:cue().x,y:cue().y},original,'invalid tap must not move cue');
  const x=2*TABLE.radius+15,y=TABLE.height/2+18;
  control.aimPointer({clientX:x,clientY:y});
  assert.equal(control.valid(),true,'legal kitchen tap must allow confirmation on '+size+' ft');
  assert.ok(canPlaceBreakCue(balls,cue().x,cue().y));
  assert.equal(cue().x,x);
  assert.equal(cue().y,y);
  assert.equal(updates,2);
 }
 setTableSize(9);
});
