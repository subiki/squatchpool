import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/tuna-game.js',import.meta.url),'utf8');

test('Tuna keeps shot physics time on low-FPS mobile frames',()=>{
 const match=source.match(/function frame\(t\)\{[\s\S]*?\n\}\nfunction tablePoint\(/);
 assert.ok(match,'real Tuna animation loop should be present');
 let steps=0;
 const makeFrame=new Function('step','stationary','draw','requestAnimationFrame','endShot',
  `let previous=0,shot={phase:'moving'},acc=0,firstContact=null,shotElapsed=0,still=0;
   const balls=[{id:0,pocketed:false,vx:1,vy:0,wx:0,wy:0,wz:0,motion:'sliding'}],events=[];
   ${match[0].replace(/\nfunction tablePoint\($/,'')}
   return {frame,state:()=>({shotElapsed,acc,balls})};`);
 const game=makeFrame(
  ()=>{steps++;return {shotEvents:[]};},
  ()=>false,()=>{},()=>{},()=>{});
 game.frame(1000);
 game.frame(1100); // A 10-FPS phone must not lose 20 ms per paint.
 assert.ok(steps>=11,'100 ms frame should advance at least 11 physics steps');
 game.frame(1300); // Catch up to a 5-FPS frame over a bounded 24-step budget.
 assert.ok(steps>=34,'200 ms frame should advance about 24 additional steps');
 assert.ok(game.state().acc>=0,'leftover simulation time must remain queued');
});
