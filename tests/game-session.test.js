import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameSession} from '../src/game-session.js';
import {adjudicateTunaShot} from '../src/tuna-shot-adapter.js';
import {adjudicatePressShot} from '../src/press-shot-adapter.js';
import {adjudicateCutthroatShot} from '../src/cutthroat-shot-adapter.js';
import {adjudicateCaromsShot} from '../src/caroms-shot-adapter.js';
import {ball} from '../src/physics.js';
import {startCutthroat,assignCutthroatGroup,resolveCutthroatClaim} from '../src/cutthroat-rules.js';
import {newMatch} from '../src/press-your-luck-score.js';

const balls=()=>Array.from({length:15},(_,i)=>({
 id:i+1,pocketed:[11,12,13,14].includes(i+1),
}));
const tunaContext={
 player:0,balls:balls(),firstContact:15,
 shotEvents:[{type:'pocket',ballId:15,pocketId:'TL'}],
 calledBall:15,calledPocket:'TL',
};

test('Tuna GameSession owns break, one ruling event, and next-shot phase',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 const published=[];
 game.subscribe(result=>published.push(result));
 game.startRack();
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('rack-1-shot-1'),true);
 assert.equal(game.startShot('rack-1-shot-2'),false);
 const result=game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext});
 assert.equal(result.game,'tuna');
 assert.equal(result.points,1);
 assert.deepEqual(result.pocketed,[15]);
 assert.equal(game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext}),result);
 assert.equal(published.length,1);
 assert.equal(game.settle(),true);
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,false);
 assert.equal(game.settle(),false);
 assert.throws(()=>game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext}),/inactive or stale/);
});

test('new rack invalidates old shot IDs and resets once-per-shot event cache',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 let published=0;
 game.subscribe(()=>published++);
 game.startRack();
 assert.equal(game.startShot('same-id'),true);
 game.resolveShot({shotId:'same-id',context:tunaContext});
 game.startRack();
 assert.equal(game.startShot('new-id'),true);
 assert.throws(()=>game.resolveShot({shotId:'same-id',context:tunaContext}),/inactive or stale/);
 game.resolveShot({shotId:'new-id',context:tunaContext});
 assert.equal(published,2);
 game.settle({done:true});
 assert.equal(game.phase,'done');
 assert.equal(game.startShot('after-win'),false);
 game.startRack();
 assert.equal(game.startShot('same-id'),true);
 game.resolveShot({shotId:'same-id',context:tunaContext});
 assert.equal(published,3);
});

test('GameSession preserves foul placement and confirmation without a break gate',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 game.startRack();
 assert.throws(()=>game.startShot(),/shotId/);
 game.startShot('break');
 game.resolveShot({shotId:'break',context:{
  ...tunaContext,shotEvents:[{type:'pocket',ballId:0,pocketId:'TL'}],
 }});
 assert.equal(game.settle({ballInHand:true}),true);
 assert.equal(game.phase,'place');
 assert.equal(game.startShot('too-soon'),false);
 assert.equal(game.confirmPlacement(),true);
 assert.equal(game.phase,'aim');
 assert.equal(game.startShot('legal-shot'),true);
 assert.equal(game.settle({done:true}),true);
 assert.equal(game.phase,'done');
});

const pressContext={
 match:newMatch(),balls:Array.from({length:16},(_,id)=>({id,pocketed:false})),
 groups:[null,null],shooter:0,firstContact:1,breakShot:true,
 shotEvents:[{type:'contact',balls:[0,1]}],
 calledBall:0,calledPocket:'',declaredBank:false,
};

test('Press GameSession publishes one ruling and invalidates old rack shots',()=>{
 const game=createGameSession({game:'press-your-luck',adjudicate:adjudicatePressShot});
 const published=[];
 game.subscribe(result=>published.push(result));
 game.startRack();
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('press-break'),true);
 assert.equal(game.startShot('duplicate-strike'),false);
 const result=game.resolveShot({shotId:'press-break',context:pressContext});
 assert.equal(result.game,'press-your-luck');
 assert.equal(game.resolveShot({shotId:'press-break',context:pressContext}),result);
 assert.equal(published.length,1);
 assert.equal(game.settle({ballInHand:result.ballInHand,done:result.rackEnd}),true);
 assert.equal(game.breakShot,false);
 game.startRack();
 assert.equal(game.startShot('next-rack-break'),true);
 assert.throws(()=>game.resolveShot({shotId:'press-break',context:pressContext}),/inactive or stale/);
 game.resolveShot({shotId:'next-rack-break',context:pressContext});
 assert.equal(published.length,2);
});

test('Press GameSession retains scratch ball-in-hand placement after a break',()=>{
 const game=createGameSession({game:'press-your-luck',adjudicate:adjudicatePressShot});
 game.startRack();
 assert.equal(game.startShot('scratch-break'),true);
 const result=game.resolveShot({shotId:'scratch-break',context:{
  ...pressContext,shotEvents:[
   {type:'contact',balls:[0,1]},
   {type:'pocket',ballId:0,pocketId:'TL'},
  ],
 }});
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,true);
 assert.equal(result.nextPlayer,1);
 assert.equal(game.settle({ballInHand:result.ballInHand}),true);
 assert.equal(game.phase,'place');
 assert.equal(game.startShot('before-placement'),false);
 assert.equal(game.confirmPlacement(),true);
 assert.equal(game.startShot('after-placement'),true);
});


test('Cutthroat GameSession keeps group choice, third-seat scratch claim and placement',()=>{
 const game=createGameSession({game:'cutthroat',adjudicate:adjudicateCutthroatShot});
 const rulings=[];
 game.subscribe(result=>rulings.push(result));
 game.startRack();
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('cut-break'),true);
 assert.equal(game.startShot('duplicate-break'),false);
 const breakResult=game.resolveShot({shotId:'cut-break',context:{
  match:startCutthroat(),breakShot:true,
  shotEvents:[{type:'contact',balls:[0,1]},{type:'pocket',ballId:1,pocketId:'TL'}],
 }});
 assert.equal(breakResult.actions.match.groupChoicePlayer,0);
 assert.deepEqual(breakResult.pocketed,[1]);
 assert.equal(game.resolveShot({shotId:'cut-break',context:{}}),breakResult);
 assert.equal(rulings.length,1);
 assert.equal(game.settle(),true);
 assert.equal(game.breakShot,false);
 let match=assignCutthroatGroup(breakResult.actions.match,0,0);
 assert.equal(match.owners[0],0);
 assert.equal(game.startShot('cut-scratch'),true);
 const scratch=game.resolveShot({shotId:'cut-scratch',context:{
  match,shotEvents:[{type:'contact',balls:[0,2]},{type:'pocket',ballId:0,pocketId:'TL'}],
 }});
 assert.equal(scratch.foul,true);
 assert.equal(scratch.ballInHand,true);
 assert.equal(scratch.nextPlayer,1);
 assert.equal(scratch.actions.match.pendingClaim.claimant,2);
 match=resolveCutthroatClaim(scratch.actions.match,2);
 assert.equal(match.claimedBalls[2],2);
 assert.equal(game.settle({ballInHand:scratch.ballInHand}),true);
 assert.equal(game.phase,'place');
 assert.equal(game.startShot('too-soon'),false);
 assert.equal(game.confirmPlacement(),true);
 assert.equal(game.phase,'aim');
 assert.equal(game.startShot('after-claim'),true);
 assert.equal(rulings.length,2);
 game.startRack();
 assert.throws(()=>game.resolveShot({shotId:'after-claim',context:{match}}),/inactive or stale/);
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('new-cut-break'),true);
 const newBreak=game.resolveShot({shotId:'new-cut-break',context:{match:startCutthroat(),breakShot:true,shotEvents:[]}});
 assert.equal(newBreak.game,'cutthroat');
 assert.equal(rulings.length,3);
});


test('Caroms GameSession retains object-ball break and center-or-leave foul decisions',()=>{
 const game=createGameSession({game:'caroms',adjudicate:adjudicateCaromsShot});
 const rulings=[];game.subscribe(result=>rulings.push(result));
 const caromsBalls=()=>Array.from({length:16},(_,id)=>ball(id,100+id*3,200));
 const contact=(a,b)=>({type:'contact',balls:[a,b]});
 const rail={type:'rail',ballId:0};
 game.startRack();
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('caroms-break'),true);
 assert.equal(game.startShot('duplicate-break'),false);
 const breakResult=game.resolveShot({shotId:'caroms-break',context:{
  balls:caromsBalls(),groups:[null,null],shooter:0,shooterBall:1,
  shotEvents:[contact(1,0),rail],breakShot:true,
 }});
 assert.equal(breakResult.legal,true);
 assert.equal(breakResult.nextPlayer,1);
 assert.equal(breakResult.rackEnd,false);
 assert.deepEqual(breakResult.actions.groups,[null,null]);
 assert.equal(game.resolveShot({shotId:'caroms-break',context:{}}),breakResult);
 assert.equal(rulings.length,1);
 assert.equal(game.settle(),true);
 assert.equal(game.breakShot,false);
 assert.equal(game.phase,'aim');
 assert.equal(game.startShot('caroms-foul'),true);
 const foul=game.resolveShot({shotId:'caroms-foul',context:{
  balls:caromsBalls(),groups:[null,null],shooter:1,shooterBall:1,
  shotEvents:[contact(1,3),contact(1,0),rail],breakShot:false,
 }});
 assert.equal(foul.foul,true);
 assert.equal(foul.ballInHand,false,'Caroms uses a center-or-leave decision, not BIH');
 assert.equal(foul.actions.cueOption,'leave-or-center');
 assert.equal(game.settle(),true);
 game.startRack();
 assert.equal(game.startShot('new-rack'),true);
 assert.throws(()=>game.resolveShot({shotId:'caroms-foul',context:{}}),/inactive or stale/);
 assert.equal(rulings.length,2,'a stale stroke cannot announce or report a pocket');
});
