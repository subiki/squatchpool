import test from 'node:test';
import assert from 'node:assert/strict';
import {createShotResultSession} from '../src/shot-result.js';
import {adjudicatePressShot} from '../src/press-shot-adapter.js';
import {newMatch,pocketOpponentBalls} from '../src/press-your-luck-score.js';

const balls=(live=[])=>Array.from({length:16},(_,id)=>({
 id,pocketed:id!==0&&id!==8&&!live.includes(id),
}));
const pocket=(ballId,pocketId='TL')=>({type:'pocket',ballId,pocketId});
const session=()=>createShotResultSession({game:'press-your-luck',adjudicate:adjudicatePressShot});
const base={
 match:newMatch(),balls:balls([9,10]),groups:['solids','stripes'],
 shooter:0,firstContact:9,breakShot:false,
 calledBall:9,calledPocket:'TL',declaredBank:false,
};

test('Press Your Luck publishes one ruling, one physical pocket and one provisional bonus',()=>{
 const shots=session(),events=[];shots.subscribe(r=>events.push(r));
 const context={...base,shotEvents:[pocket(9),pocket(9)]};
 const result=shots.resolve({shotId:'press-a',context});
 assert.equal(result.game,'press-your-luck');
 assert.equal(result.legal,true);
 assert.equal(result.foul,false);
 assert.deepEqual(result.pocketed,[9]);
 assert.equal(result.points,0,'provisional bonus is not banked as match points');
 assert.deepEqual(result.actions.match.bonus,[1,0]);
 assert.equal(result.actions.provisionalDelta,1);
 assert.equal(result.nextPlayer,0);
 assert.equal(result.rackEnd,false);
 assert.match(result.announcement,/Called 9 made/);
 assert.equal(shots.resolve({shotId:'press-a',context}),result);
 assert.equal(events.length,1,'history and telemetry subscribers run once');
 shots.reset();shots.resolve({shotId:'press-a',context});
 assert.equal(events.length,2);
});

test('scratch forfeits pressing bonus, gives opponent ball in hand, still counts physical pockets',()=>{
 const result=session().resolve({shotId:'scratch',context:{
  ...base,match:pocketOpponentBalls(newMatch(),0,3),
  shotEvents:[pocket(9),pocket(0,'BR')],
 }});
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,true);
 assert.equal(result.nextPlayer,1);
 assert.deepEqual(result.actions.match.bonus,[0,0]);
 assert.deepEqual(result.pocketed,[9]);
 assert.equal(result.rackEnd,false);
});

test('declared cue-rail kick doubles current rack bonus and eight points',()=>{
 const result=session().resolve({shotId:'eight',context:{
  ...base,match:pocketOpponentBalls(newMatch({targetScore:30}),0,2),
  firstContact:8,calledBall:8,shotEvents:[
   {type:'rail',ballId:0},pocket(8),
  ],declaredBank:true,
 }});
 assert.equal(result.rackEnd,true);
 assert.equal(result.foul,false);
 assert.equal(result.points,8);
 assert.deepEqual(result.actions.match.scores,[8,0]);
 assert.equal(result.actions.match.lastRack.bankOrKick,true);
 assert.equal(result.nextPlayer,null);
 assert.match(result.announcement,/wins the rack/);
});

test('rail by an unrelated ball never doubles a called eight',()=>{
 const result=adjudicatePressShot({
  ...base,firstContact:8,calledBall:8,declaredBank:true,
  shotEvents:[{type:'rail',ballId:12},pocket(8)],
 });
 assert.equal(result.points,2);
 assert.equal(result.actions.match.lastRack.bankOrKick,false);
});

test('early eight awards only the opponent existing provisional points',()=>{
 const match=pocketOpponentBalls(newMatch(),1,3);
 const result=adjudicatePressShot({
  ...base,match,balls:balls([1,9]),firstContact:1,
  calledBall:8,shotEvents:[pocket(8)],
 });
 assert.equal(result.rackEnd,true);
 assert.equal(result.actions.winner,1);
 assert.equal(result.points,3);
 assert.deepEqual(result.actions.match.scores,[0,3]);
 assert.equal(result.foul,true);
});

test('missed eight forfeits bonus without ending the rack',()=>{
 const result=adjudicatePressShot({
  ...base,match:pocketOpponentBalls(newMatch(),0,4),
  firstContact:8,calledBall:8,shotEvents:[],
 });
 assert.equal(result.rackEnd,false);
 assert.equal(result.ballInHand,false);
 assert.equal(result.nextPlayer,1);
 assert.deepEqual(result.actions.match.bonus,[0,0]);
});

test('eight on break is respotted with no points or rack end',()=>{
 const result=adjudicatePressShot({
  ...base,breakShot:true,firstContact:1,calledBall:0,calledPocket:'',
  shotEvents:[pocket(8)],
 });
 assert.equal(result.actions.respotEight,true);
 assert.equal(result.rackEnd,false);
 assert.equal(result.points,0);
 assert.equal(result.nextPlayer,0);
 assert.deepEqual(result.pocketed,[8]);
});

test('press result requires a stable shot id before publishing',()=>{
 const shots=session(),events=[];shots.subscribe(r=>events.push(r));
 assert.throws(()=>shots.resolve({context:base}),/shotId/);
 assert.equal(events.length,0);
});
