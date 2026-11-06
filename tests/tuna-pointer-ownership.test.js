import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,fullRack,kitchenPoint,canPlaceBreakCue} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';
import {createCuePlacement} from '../src/shot-lifecycle.js';

const source=readFileSync(new URL('../src/tuna-game.js',import.meta.url),'utf8');
const rack=source.split('function rack(){')[1]?.split('function resetMatch()')[0]||'';
const down=source.split("canvas.addEventListener('pointerdown',e=>{")[1]?.split("canvas.addEventListener('pointermove'")[0]||'';
const move=source.split("canvas.addEventListener('pointermove',e=>{")[1]?.split("canvas.addEventListener('pointerup'")[0]||'';
const up=source.split("canvas.addEventListener('pointerup',e=>{")[1]?.split("function fire(")[0]||'';
const fire=source.split('function fire(bot=false){')[1]?.split("$('shoot').onclick=")[0]||'';

test('Tuna owns break drag by pointer and cancels on restart, shot start and opponent switch',()=>{
 assert.match(rack,/cuePlacement\.cancel\(\)/);
 assert.match(down,/cuePlacement\.pointerDown\(tablePoint\(e\),e\.pointerId\)/);
 assert.match(down,/cuePlacement\.dragging\)return/);
 assert.match(move,/shot\.phase==='aim'&&shot\.breakShot/);
 assert.match(move,/cuePlacement\.pointerMove\(tablePoint\(e\),e\.pointerId\)/);
 assert.match(move,/if\(cuePlacement\.dragging\)return/);
 assert.match(up,/cuePlacement\.pointerUp\(e\.pointerId\)/);
 assert.match(up,/pointercancel',e=>\{cuePlacement\.pointerUp\(e\.pointerId\)/);
 assert.match(source,/\$\('opponent'\)\.onchange=resetMatch/);
 const start=fire.indexOf('if(!shot.startShot(statsShotId))return');
 const cancel=fire.indexOf('cuePlacement.cancel()',start);
 const physics=fire.indexOf('shotSpeed(',cancel);
 assert.ok(start>=0&&cancel>start&&physics>cancel,
  'reserve shot and release drag before applying physics');
 assert.doesNotMatch(fire.slice(physics),/shot\.startShot\(/,
  'do not start the shot a second time after applying velocity');
});

test('Tuna shared break placement ignores a second finger on 7/8/9-foot tables',()=>{
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=fullRack(),cue=balls[0];
  Object.assign(cue,kitchenPoint(TABLE.width*.18,TABLE.height/2));
  const placement=createCuePlacement({getBalls:()=>balls,getCue:()=>cue});
  assert.equal(placement.pointerDown({x:TABLE.width*.12,y:TABLE.height*.5},11),true);
  const initial={x:cue.x,y:cue.y};
  assert.equal(placement.pointerDown({x:TABLE.width*.14,y:TABLE.height*.6},22),false);
  assert.equal(placement.pointerMove({x:TABLE.width*.14,y:TABLE.height*.6},22),false);
  assert.equal(placement.pointerUp(22),false);
  assert.deepEqual({x:cue.x,y:cue.y},initial);
  assert.equal(placement.pointerMove({x:TABLE.width*.14,y:TABLE.height*.6},11),true);
  assert.ok(canPlaceBreakCue(balls,cue.x,cue.y));
  assert.equal(placement.pointerUp(11),true);
  assert.equal(placement.pointerDown({x:TABLE.width*.12,y:TABLE.height*.5},33),true);
  placement.cancel();
  assert.equal(placement.pointerMove({x:TABLE.width*.15,y:TABLE.height*.6},33),false);
  assert.equal(placement.pointerUp(33),false);
 }
 setTableSize(9);
});
