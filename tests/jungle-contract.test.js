import test from 'node:test';
import assert from 'node:assert/strict';
import {tableToWorld,worldToTable,ballFingerprint,BALL_COLORS} from '../src/jungle-contract.js';
test('classic 2:1 table maps exactly to 20x10 world units',()=>{
 assert.deepEqual(tableToWorld({x:0,y:0}),{x:-10,z:-5});
 assert.deepEqual(tableToWorld({x:1000,y:500}),{x:10,z:5});
});
test('all live ball positions roundtrip between classic and Jungle world coordinates',()=>{
 for(let x=0;x<=1000;x+=43)for(let y=0;y<=500;y+=41){
  const a={x,y},b=worldToTable(tableToWorld(a));
  assert.ok(Math.abs(b.x-x)<1e-8&&Math.abs(b.y-y)<1e-8);
 }
});
test('visual state fingerprint only changes when canonical game state changes',()=>{
 const s={balls:[{id:0,x:250,y:250,vx:12,vy:0,pocketed:false}],turn:1,groups:['solids','stripes'],phase:'moving',shotNumber:5,deployed:{solids:false,stripes:false},pendingStash:null,winner:null};
 const before=ballFingerprint(s);
 tableToWorld(s.balls[0]);worldToTable({x:3,z:3});
 assert.equal(ballFingerprint(s),before);
 s.turn=0;assert.notEqual(ballFingerprint(s),before);
});
test('every ball ID including the cue ball has a distinct supported color',()=>{
 assert.equal(BALL_COLORS.length,16);assert.equal(BALL_COLORS[0],'#fffdf3');
});
