import test from 'node:test';
import assert from 'node:assert/strict';
import {ball,rack,step,canPlace,findPlacement} from '../src/physics.js';
import {adjudicate,readyForStash,readyForEight,stashBall} from '../src/rules.js';
test('rack has cue plus 13 balls with one solid and one stripe reserved',()=>{
 const balls=rack();assert.equal(balls.length,14);assert.equal(balls.some(b=>b.id===7||b.id===15),false);
 assert.equal(new Set(balls.map(b=>b.id)).size,14);
});
test('collision transfers momentum without invalid values',()=>{
 const a=ball(0,100,200),b=ball(1,124,200);a.vx=650;
 for(let i=0;i<60;i++)step([a,b]);
 assert.ok(b.x>124);assert.ok([a.x,a.y,b.x,b.y,a.vx,b.vx].every(Number.isFinite));
});
test('ball falls into corner pocket',()=>{
 const a=ball(1,55,55);a.vx=-200;a.vy=-200;
 for(let i=0;i<80&&!a.pocketed;i++)step([a]);
 assert.equal(a.pocketed,true);
});
test('placement avoids balls and pockets',()=>{
 assert.equal(canPlace([ball(1,200,200)],200,200),false);
 assert.equal(canPlace([],0,0),false);
 const p=findPlacement([ball(1,260,250)]);
 assert.ok(p&&canPlace([ball(1,260,250)],p.x,p.y));
});
test('hidden ball must be revealed before the eight',()=>{
 const balls=[ball(0,100,100),ball(8,300,100)];
 assert.equal(readyForStash(balls,'solids',false),true);
 assert.equal(readyForEight(balls,'solids',false),false);
 assert.equal(readyForEight(balls,'solids',true),true);
 assert.equal(stashBall('stripes'),15);
});
test('premature eight loses',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(1,400,200)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},pocketed:[8],firstContact:8,breakShot:false});
 assert.equal(result.winner,1);
});
test('legal final eight wins',()=>{
 const balls=[ball(0,100,100),ball(8,300,100)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},pocketed:[8],firstContact:8,breakShot:false,preShotReadyForEight:true});
 assert.equal(result.winner,0);
});
test('scratch passes turn and allows ball in hand',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(1,400,200)];balls[0].pocketed=true;
 const r=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},pocketed:[0],firstContact:1,breakShot:false});
 assert.equal(r.foul,true);assert.equal(r.keepTurn,false);
});
test('cannot win by pocketing last group ball and eight together',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(7,250,150)];balls[1].pocketed=true;balls[2].pocketed=true;
 const r=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},pocketed:[7,8],firstContact:7,breakShot:false,preShotReadyForEight:false});
 assert.equal(r.winner,1);
});
