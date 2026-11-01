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
