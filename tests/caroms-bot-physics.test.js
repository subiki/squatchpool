import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets,setTableSize} from '../src/table-geometry.js';
import {planCaromsBotShot} from '../src/caroms-bot-aim.js';
import {chooseCaromsBotShot} from '../src/caroms-bot-physics.js';

function fixture(){
 const cueBall={id:0,x:TABLE.width*.45,y:TABLE.height*.5,
  vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary',pocketed:false};
 const striker={id:1,x:TABLE.width*.76,y:TABLE.height*.62,
  vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary',pocketed:false};
 return {balls:[cueBall,striker],eligible:[striker],cueBall,pockets,
  radius:TABLE.radius,groups:[null,null],turn:1,level:'beginner'};
}

test('real-physics bot search is bounded and does not alter live 7/8/9 ft tables',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const args=fixture(),before=JSON.stringify(args.balls);
   const geometric=planCaromsBotShot(args);
   assert.ok(geometric,'size '+size+': geometry has a candidate');
   const refined=chooseCaromsBotShot(args);
   assert.ok(refined,'size '+size+': physics refinement returns a shot');
   assert.equal(refined.ballId,geometric.ballId);
   assert.ok(pockets.some(p=>p.id===refined.pocketId));
   assert.ok([70,90].includes(refined.power));
   assert.ok(Math.abs(refined.angle-geometric.angle)<=.0200001);
   assert.equal(JSON.stringify(args.balls),before,'simulation must not change live balls');
  }
 }finally{setTableSize(9);}
});

test('real-physics bot search is repeatable and respects empty-shot fallback',()=>{
 try{
  setTableSize(8);
  const args=fixture();
  assert.deepEqual(chooseCaromsBotShot(args),chooseCaromsBotShot(args));
  assert.equal(chooseCaromsBotShot({...args,eligible:[]}),null);
 }finally{setTableSize(9);}
});
