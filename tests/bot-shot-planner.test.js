import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets as regulationPockets,ball,step,shotSpeed,stationary,canPlace,applyCueSpin} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';
import {planBotShot,planBotCuePlacement} from '../src/bot-shot-planner.js';

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


test('Tuna bot ball in hand escapes the observed multi-ball scratch/respot loop',()=>{
 setTableSize(8);
 try{
  const layout=[[0,220.61111111111114,226.11111111111114],[10,742.8558827228908,165.61973369986293],[6,617.7111111111111,226.11111111111114],[7,651.2922179130468,404.77265746093667],[8,655.008807028571,40.78049275446781],[12,749.8464355297837,260.7429116713123],[13,723.9840731995912,367.54117498916315],[15,588.650399310288,44.61944036273314],[14,49.982568103047164,195.59583626748463],[9,275.11585294299283,120.6703145782159]];
  const balls=layout.map(([id,x,y])=>ball(id,x,y)),snapshot=structuredClone(balls);
  const options={balls,targets:[6,12],pockets:regulationPockets,radius:TABLE.radius,table:TABLE};
  const play=plan=>{
   const trial=structuredClone(balls),cue=trial[0],speed=shotSpeed(plan.power),events=[];
   cue.vx=Math.cos(plan.angle)*speed;cue.vy=Math.sin(plan.angle)*speed;applyCueSpin(cue,0,0);
   for(let i=0;i<2400;i++){events.push(...step(trial,1/120).shotEvents);if(i>100&&stationary(trial))break;}
   return {cue,events};
  };
  assert.equal(play(planBotShot(options)).cue.pocketed,true,'previous default position repeats a scratch');
  const point=planBotCuePlacement(options);
  assert.ok(point);assert.ok(canPlace(balls,point.x,point.y,0));
  assert.deepEqual(balls,snapshot,'placement planning never mutates live balls');
  Object.assign(balls[0],point);
  const plan=planBotShot(options),result=play(plan);
  assert.ok(result.events.some(e=>e.type==='pocket'&&e.ballId===plan.ballId&&e.pocketId===plan.pocketId),'new placement produces a called legal-target pot');
  assert.equal(result.cue.pocketed,false);
  assert.equal(planBotCuePlacement({...options,targets:[]}),null,'no placement is invented without a legal target');
 }finally{setTableSize(9);}
});
