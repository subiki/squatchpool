import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets,ball,step,shotSpeed,stationary} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';
import {planCaromsPot} from '../src/caroms-bot-plan.js';
import {caromsTurn} from '../src/caroms-rules.js';

function play(balls,plan){
 const striker=balls.find(b=>b.id===plan.ballId),speed=shotSpeed(plan.power);
 striker.vx=Math.cos(plan.angle)*speed;striker.vy=Math.sin(plan.angle)*speed;
 const events=[];
 for(let i=0;i<2400;i++){
  events.push(...step(balls,1/120).shotEvents);
  if(i>100&&stationary(balls))break;
 }
 return caromsTurn({balls,groups:['solids','stripes'],shooter:1,shooterBall:plan.ballId,
  shotEvents:events,level:'advanced',calledBall:plan.ballId,calledPocket:plan.pocketId,eightEligibleBefore:plan.ballId===8});
}

test('Caroms bot can legally carom the called 8 into a pocket on 7/8/9ft',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const layout=()=>[ball(0,TABLE.width*.5,TABLE.height*.5),ball(8,TABLE.width*.35,TABLE.height*.25)];
   const baseline=layout(),white=baseline[0],eight=baseline[1];
   const nearest=pockets.slice().sort((a,b)=>Math.hypot(a.x-eight.x,a.y-eight.y)-Math.hypot(b.x-eight.x,b.y-eight.y))[0];
   assert.notEqual(play(baseline,{ballId:8,angle:Math.atan2(white.y-eight.y,white.x-eight.x),power:78,pocketId:nearest.id}).winner,1,
    'center-white fallback has no deliberate finishing path in this layout');
   const balls=layout(),before=structuredClone(balls),plan=planCaromsPot(balls,[balls[1]]);
   assert.ok(plan);assert.equal(plan.ballId,8);assert.deepEqual(balls,before,'planning is pure');
   const result=play(balls,plan);
   assert.equal(result.winner,1,'real physics and advanced called-shot rules accept the finish on '+size+'ft');
   assert.equal(result.foul,false);assert.equal(result.scratch,false);
   const scoring=[ball(0,TABLE.width*.5,TABLE.height*.5),ball(9,TABLE.width*.35,TABLE.height*.25)];
   const scoringPlan=planCaromsPot(scoring,[scoring[1]]),score=play(scoring,scoringPlan);
   assert.equal(score.keepTurn,true,'bot can score a legal called group ball on '+size+'ft');
   assert.equal(score.foul,false);
  }
 }finally{setTableSize(9);}
});

test('Caroms scoring planner respects eligible candidates and blocked paths',()=>{
 setTableSize(7);
 try{
  const balls=[ball(0,TABLE.width*.5,TABLE.height*.5),ball(8,TABLE.width*.35,TABLE.height*.25)];
  assert.equal(planCaromsPot(balls,[]),null,'no early 8 target without eligible candidate');
  assert.equal(planCaromsPot(balls,[balls[0]]),null,'white is never the striker');
  balls[0].pocketed=true;assert.equal(planCaromsPot(balls,[balls[1]]),null);
  balls[0].pocketed=false;
  // Block all initial lanes by surrounding the only eligible object ball.
  for(let i=0;i<12;i++)balls.push(ball(i+1,balls[1].x+Math.cos(i*Math.PI/6)*TABLE.radius*2.2,
   balls[1].y+Math.sin(i*Math.PI/6)*TABLE.radius*2.2));
  assert.equal(planCaromsPot(balls,[balls[1]]),null,'blocked layout retains existing fallback');
 }finally{setTableSize(9);}
});
