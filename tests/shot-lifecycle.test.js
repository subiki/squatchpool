import test from 'node:test';
import assert from 'node:assert/strict';
import {createShotLifecycle,createCuePlacement} from '../src/shot-lifecycle.js';
import {TABLE,fullRack,kitchenPoint,headStringX} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';

test('rack starts ready to break; settled shots transition without duplicate confirmation',()=>{
 const shot=createShotLifecycle();
 shot.startRack();
 assert.equal(shot.phase,'aim');
 assert.equal(shot.breakShot,true);
 assert.equal(shot.startShot(),true);
 assert.equal(shot.startShot(),false);
 assert.equal(shot.phase,'moving');
 assert.equal(shot.settle(),true);
 assert.equal(shot.phase,'aim');
 assert.equal(shot.breakShot,false);
 assert.equal(shot.startShot(),true);
 assert.equal(shot.settle({ballInHand:true}),true);
 assert.equal(shot.phase,'place');
 assert.equal(shot.confirmPlacement(),true);
 assert.equal(shot.phase,'aim');
 assert.equal(shot.startShot(),true);
 assert.equal(shot.settle({done:true}),true);
 assert.equal(shot.phase,'done');
 assert.equal(shot.startShot(),false);
 shot.startRack();
 assert.equal(shot.phase,'aim');
 assert.equal(shot.breakShot,true);
});

for(const size of [7,8,9])test(`break cue drags legally on ${size}ft table without a confirm step`,()=>{
 setTableSize(size);
 const balls=fullRack(),cue=balls.find(b=>b.id===0);
 Object.assign(cue,kitchenPoint(TABLE.width*.18,TABLE.height/2));
 const placement=createCuePlacement({getBalls:()=>balls,getCue:()=>cue});
 const x=TABLE.width*.12,y=TABLE.height*.6;
 assert.equal(placement.pointerDown({x,y}),true);
 assert.ok(cue.x<headStringX());
 assert.equal(placement.pointerMove({x:TABLE.width*.95,y}),true);
 assert.ok(cue.x<headStringX(),'drag beyond head string must clamp cue inside kitchen');
 assert.equal(placement.pointerUp(),true);
 assert.equal(placement.pointerUp(),false);
 assert.equal(placement.pointerDown({x:TABLE.width*.75,y}),false,'tapping near rack should aim, not teleport cue');
});


test('Press shared break placement keeps one touch owner and cancels on rack restart',()=>{
 setTableSize(9);
 const balls=fullRack(),cue=balls[0];
 Object.assign(cue,kitchenPoint(TABLE.width*.18,TABLE.height/2));
 const placement=createCuePlacement({getBalls:()=>balls,getCue:()=>cue});
 assert.equal(placement.pointerDown({x:TABLE.width*.12,y:TABLE.height*.5},11),true);
 const first={x:cue.x,y:cue.y};
 assert.equal(placement.pointerDown({x:TABLE.width*.15,y:TABLE.height*.7},22),false);
 assert.equal(placement.pointerMove({x:TABLE.width*.15,y:TABLE.height*.7},22),false);
 assert.deepEqual({x:cue.x,y:cue.y},first,'second finger cannot move the cue');
 assert.equal(placement.pointerUp(22),false,'second finger cannot release owner');
 assert.equal(placement.dragging,true);
 assert.equal(placement.pointerMove({x:TABLE.width*.14,y:TABLE.height*.6},11),true);
 assert.equal(placement.pointerUp(11),true);
 assert.equal(placement.dragging,false);
 assert.equal(placement.pointerDown({x:TABLE.width*.12,y:TABLE.height*.5},33),true);
 placement.cancel();
 assert.equal(placement.pointerMove({x:TABLE.width*.16,y:TABLE.height*.6},33),false);
 assert.equal(placement.pointerUp(33),false);
});

test('invalid break placement never captures the pointer',()=>{
 setTableSize(9);
 const balls=fullRack(),cue=balls[0];
 Object.assign(cue,kitchenPoint(TABLE.width*.18,TABLE.height/2));
 const placement=createCuePlacement({getBalls:()=>balls,getCue:()=>cue});
 for(const point of [{x:NaN,y:NaN},{x:Infinity,y:0},{x:0,y:-Infinity}]){
  const before={x:cue.x,y:cue.y};
  assert.equal(placement.pointerDown(point,17),false);
  assert.deepEqual({x:cue.x,y:cue.y},before,'invalid coordinates must not move cue');
 }
 assert.equal(placement.dragging,false);
 assert.equal(placement.pointerMove({x:TABLE.width*.14,y:TABLE.height*.5},17),false);
 assert.equal(placement.pointerDown({x:TABLE.width*.14,y:TABLE.height*.5},18),true);
 assert.equal(placement.pointerUp(18),true);
});
