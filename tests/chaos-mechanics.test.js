import test from 'node:test';
import assert from 'node:assert/strict';
import {NIGHTMARE_MODS,NIGHTMARE_PRESET,MAX_BALLS,onCollision,onPocket,onShot,applyForces} from '../src/chaos-mechanics.js';

const ball=(x=100,y=100,c='#e64e50')=>({x,y,vx:0,vy:0,c});
const world=(mods={})=>({balls:[ball()],bumpers:[],mods:{...mods},events:[],stage:0,shots:2,pockets:[[28,28],[480,22],[932,492]]});
test('nightmare preset contains eight safe declarative modifiers',()=>{
 assert.equal(NIGHTMARE_MODS.length,8);
 assert.deepEqual(Object.keys(NIGHTMARE_PRESET.mods),NIGHTMARE_MODS);
 assert.ok(Object.values(NIGHTMARE_PRESET.mods).every(Boolean));
});
test('black hole applies bounded attraction only to other balls',()=>{
 const w=world({blackHole:true});const eight={...ball(200,100,'#202020'),eight:true};w.balls.push(eight);
 applyForces(w,w.balls[0],1);assert.ok(w.balls[0].vx>0);assert.equal(eight.vx,0);
});
test('infection recolors struck ball; split adds only bounded fragments',()=>{
 const w=world({infection:true,split:true});w.balls.push(ball(150,100,'#76d68d'));
 onCollision(w,w.balls[0],w.balls[1],()=>0);
 assert.equal(w.balls[1].c,w.balls[0].c);assert.equal(w.balls.length,3);
 while(w.balls.length<MAX_BALLS)w.balls.push(ball());
 onCollision(w,w.balls[0],w.balls[1],()=>0);assert.equal(w.balls.length,MAX_BALLS);
});
test('portal reinserts pocketed ball with cooldown',()=>{
 const w=world({portals:true});onPocket(w,ball(),false,()=>0);
 assert.equal(w.balls.length,2);assert.ok(w.balls[1].portalCooldown>0);
});
test('multiball spawns two and gauntlet advances on pocket',()=>{
 const w=world({multiball:true,gauntlet:true});onPocket(w,ball(),false,()=>.99);
 assert.equal(w.balls.length,3);assert.equal(w.stage,1);
});
test('roulette toggles a modifier and sabotage adds a bumper',()=>{
 const w=world({roulette:true,sabotage:true});onShot(w,()=>0);
 assert.equal(w.mods.bounce,true);assert.equal(w.bumpers.length,1);
});
