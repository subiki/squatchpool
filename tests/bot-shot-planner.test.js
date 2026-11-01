import test from 'node:test';
import assert from 'node:assert/strict';
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
