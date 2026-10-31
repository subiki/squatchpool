import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');

test('Press Your Luck preserves physics time on slow mobile frames and stops timed-out shots',()=>{
 const match=source.match(/function frame\\(t\\)\\{[\\s\\S]*?\\n\\}\\nfunction aimPointer\\(/);
 assert.ok(match,'real Press Your Luck animation loop should be present');
 let steps=0,handedOff=0;
 const makeFrame=new Function('step','stationary','draw','requestAnimationFrame','endShot',
  `let previous=0,phase='moving',acc=0,firstContact=null,shotElapsed=0,still=0;
   const balls=[{id:0,pocketed:false,vx:1,vy:2,wx:3,wy:4,wz:5,motion:'sliding'}],events=[];
   ${match[0].replace(/\\nfunction aimPointer\\($/,'')}
   return {frame,state:()=>({shotElapsed,acc,balls,phase}),setElapsed:n=>shotElapsed=n};`);
 const game=makeFrame(
  ()=>{steps++;return {shotEvents:[]};},
  ()=>false,()=>{},()=>{},()=>{handedOff++;});
 game.frame(1000);
 game.frame(1100);
 assert.ok(steps>=11,'100 ms paint interval must advance at least 11 physics steps');
 game.frame(1300);
 assert.ok(steps>=34,'200 ms interval must advance a bounded 24-step catch-up');
 assert.ok(game.state().acc>0,'unprocessed time remains queued for later frames');
 game.setElapsed(20.001);
 game.frame(1400);
 assert.equal(handedOff,1,'shot exceeding the time limit ends exactly once');
 assert.equal(game.state().acc,0,'shot end clears simulation backlog');
 for(const key of ['vx','vy','wx','wy','wz'])
  assert.equal(game.state().balls[0][key],0,'no moving cue ball at turn handoff');
 assert.equal(game.state().balls[0].motion,'stationary');
});
