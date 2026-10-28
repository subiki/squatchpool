import test from 'node:test';
import assert from 'node:assert/strict';
import {respotCaromsBall} from '../src/caroms-placement.js';

const cue=()=>({id:0,x:150,y:200,pocketed:false,
 vx:1,vy:-2,wx:3,wy:4,wz:5,motion:'sliding'});
const other=()=>({id:3,x:300,y:200,pocketed:false});

test('blocked option-foul placement never pockets the live white ball',()=>{
 const balls=[cue(),other()],before=structuredClone(balls);
 assert.equal(respotCaromsBall(balls,0,()=>null),false);
 assert.deepEqual(balls,before);
});

test('successful placement ignores the moved ball in collision checks and resets motion',()=>{
 const balls=[cue(),other()];
 let seen=null;
 const moved=respotCaromsBall(balls,0,(all,preferred)=>{
  seen={hidden:all[0].pocketed,preferred};
  return {x:preferred.x+30,y:preferred.y};
 });
 assert.equal(moved,true);
 assert.equal(seen.hidden,true);
 assert.ok(Number.isFinite(seen.preferred.x)&&Number.isFinite(seen.preferred.y));
 assert.equal(balls[0].x,seen.preferred.x+30);
 assert.equal(balls[0].pocketed,false);
 assert.deepEqual([balls[0].vx,balls[0].vy,balls[0].wx,balls[0].wy,balls[0].wz],[0,0,0,0,0]);
 assert.equal(balls[0].motion,'stationary');
 assert.deepEqual(balls[1],other());
});

test('a failed scratch placement preserves the original pocketed state',()=>{
 const balls=[{...cue(),pocketed:true},other()],before=structuredClone(balls);
 assert.equal(respotCaromsBall(balls,0,()=>null),false);
 assert.deepEqual(balls,before);
});

test('placement errors restore the original state instead of losing the cue',()=>{
 const balls=[cue(),other()],before=structuredClone(balls);
 assert.throws(()=>respotCaromsBall(balls,0,()=>{throw Error('placement unavailable');}),
  /placement unavailable/);
 assert.deepEqual(balls,before);
});

test('missing ball cannot change the rack',()=>{
 const balls=[cue(),other()],before=structuredClone(balls);
 assert.equal(respotCaromsBall(balls,8,()=>({x:10,y:20})),false);
 assert.deepEqual(balls,before);
});
