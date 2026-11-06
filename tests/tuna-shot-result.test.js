import test from 'node:test';
import assert from 'node:assert/strict';
import {createShotResultSession} from '../src/shot-result.js';
import {adjudicateTunaShot} from '../src/tuna-shot-adapter.js';

const balls=(gone=[])=>Array.from({length:15},(_,i)=>({id:i+1,pocketed:gone.includes(i+1)}));
const pocket=(id,pocketId='TL')=>({type:'pocket',ballId:id,pocketId});
const session=()=>createShotResultSession({game:'tuna',adjudicate:adjudicateTunaShot});

test('Tuna shot emits one ruling and physical-pocket count despite repeated settlement',()=>{
 const shots=session(),events=[];
 shots.subscribe(result=>events.push(result));
 const context={player:0,balls:balls([11,12,13,14]),firstContact:15,
  shotEvents:[pocket(15),pocket(15)],calledBall:15,calledPocket:'TL'};
 const result=shots.resolve({shotId:'shot-a',context});
 assert.equal(result.game,'tuna');
 assert.equal(result.legal,true);
 assert.equal(result.foul,false);
 assert.deepEqual(result.pocketed,[15],'count a physical ball only once');
 assert.equal(result.points,1);
 assert.equal(result.nextPlayer,0);
 assert.equal(result.rackEnd,false);
 assert.equal(result.ballInHand,false);
 assert.match(result.announcement,/Made 15.*\$1/);
 assert.equal(shots.resolve({shotId:'shot-a',context}),result);
 assert.equal(events.length,1,'history and telemetry consumers receive one event');
 shots.reset();
 shots.resolve({shotId:'shot-a',context});
 assert.equal(events.length,2,'next rack may reuse a shot id after reset');
});

test('Tuna scratch preserves physical pockets but awards no money and switches turn',()=>{
 const result=session().resolve({shotId:'scratch',context:{
  player:0,balls:balls([11,12,13,14]),firstContact:15,
  shotEvents:[pocket(0,'BR'),pocket(15)],calledBall:15,calledPocket:'TL',
 }});
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,true);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.points,0);
 assert.deepEqual(result.pocketed,[15]);
 assert.deepEqual(result.actions.spotted,[15]);
});

test('Tuna called 10 wins with lower solids still live, preserving money-ball payout',()=>{
 const result=session().resolve({shotId:'winner',context:{
  player:1,balls:balls([9,11,12,13,14,15]),firstContact:1,
  shotEvents:[pocket(10)],calledBall:10,calledPocket:'TL',
 }});
 assert.equal(result.rackEnd,true);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.points,3);
 assert.deepEqual(result.actions.spotted,[]);
 assert.match(result.announcement,/Wins the rack/);
});

test('Tuna session requires shot identity before publishing a ruling',()=>{
 const shots=session(),events=[];shots.subscribe(result=>events.push(result));
 assert.throws(()=>shots.resolve({context:{}}),/shotId/);
 assert.equal(events.length,0);
});
