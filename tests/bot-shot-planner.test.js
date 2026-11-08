import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets as regulationPockets,ball,step,shotSpeed,stationary} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';
import {planBotShot} from '../src/bot-shot-planner.js';

const pockets=[{id:'TR',x:400,y:0},{id:'BR',x:400,y:200}];
const table={width:400,height:200};
test('bot breaks with a physical stroke toward a live object ball',()=>{
 const p=planBotShot({balls:[{id:0,x:60,y:100},{id:1,x:300,y:100}],targets:[1],pockets,radius:5,breakShot:true,table});
 assert.equal(p.ballId,1);assert.equal(p.power,85);assert.equal(p.angle,0);
});
test('bot calls a pocket and computes a finite physical aim',()=>{
 const p=planBotShot({balls:[{id:0,x:50,y:100},{id:2,x:200,y:100}],targets:[2],pockets,radius:5,table});
 assert.equal(p.ballId,2);assert.ok(pockets.some(k=>k.id===p.pocketId));
 assert.ok(Number.isFinite(p.angle));assert.ok(p.power>=48&&p.power<=90);
});
test('bot never targets pocketed or excluded balls and returns null with none',()=>{
 const balls=[{id:0,x:50,y:100},{id:2,x:200,y:100,pocketed:true},{id:9,x:300,y:100}];
 assert.equal(planBotShot({balls,targets:[2],pockets,radius:5,table}),null);
 assert.equal(planBotShot({balls,targets:[9],pockets,radius:5,table}).ballId,9);
});
test('blocked paths still yield a real non-teleporting stroke',()=>{
 const p=planBotShot({balls:[{id:0,x:40,y:100},{id:2,x:180,y:100},{id:3,x:90,y:100}],
 targets:[2],pockets,radius:5,table});
 assert.equal(p.ballId,2);assert.ok(Number.isFinite(p.angle));
});


test('bot rejects backwards cuts and physically pots the called 10 on 7/8/9ft',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const balls=[ball(0,TABLE.width*.1,TABLE.height*.15),ball(10,TABLE.width*.6,TABLE.height*.2)];
   const before=structuredClone(balls);
   const plan=planBotShot({balls,targets:[10],pockets:regulationPockets,radius:TABLE.radius,table:TABLE});
   assert.deepEqual(balls,before,'planning must not change the physical layout');
   assert.equal(plan.pocketId,'TR','shorter TM path would require pushing the object backwards');
   const cue=balls[0],speed=shotSpeed(plan.power),events=[];
   cue.vx=Math.cos(plan.angle)*speed;cue.vy=Math.sin(plan.angle)*speed;
   for(let i=0;i<2400;i++){
    events.push(...step(balls,1/120).shotEvents);
    if(i>100&&stationary(balls))break;
   }
   assert.deepEqual(events.find(e=>e.type==='contact')?.balls,[0,10],'legal first contact');
   assert.ok(events.some(e=>e.type==='pocket'&&e.ballId===10&&e.pocketId===plan.pocketId),
    'real Tailuge physics makes the called target on '+size+'ft');
   assert.equal(cue.pocketed,false,'finishing stroke must not scratch');
  }
 }finally{setTableSize(9);}
});


test('last-ball bot finish avoids the repeated Tuna spot-and-scratch layout',()=>{
 try{
  for(const size of [7,8,9])for(const target of [8,10]){
   setTableSize(size);
   const balls=[ball(0,TABLE.width/4,TABLE.height/2),ball(target,TABLE.width*.7,TABLE.height/2)];
   const snapshot=structuredClone(balls);
   const plan=planBotShot({balls,targets:[target],pockets:regulationPockets,radius:TABLE.radius,table:TABLE});
   assert.deepEqual(balls,snapshot,'trial strokes must never mutate the live layout');
   const cue=balls[0],speed=shotSpeed(plan.power),events=[];
   cue.vx=Math.cos(plan.angle)*speed;cue.vy=Math.sin(plan.angle)*speed;
   for(let i=0;i<2400;i++){
    events.push(...step(balls,1/120).shotEvents);
    if(i>100&&stationary(balls))break;
   }
   assert.ok(events.some(e=>e.type==='pocket'&&e.ballId===target&&e.pocketId===plan.pocketId),
    'finishing power must still reach the called pocket on '+size+'ft');
   assert.equal(cue.pocketed,false,'avoid scratching and recreating the same respotted layout on '+size+'ft');
  }
 }finally{setTableSize(9);}
});
