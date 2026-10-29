import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,validateTargetScore,pocketOpponentBalls,forfeitBonus,endRack,newRackAfterBreakEight} from '../src/press-your-luck-score.js';

test('target defaults to 15, accepts custom integer and rejects invalid values',()=>{
 assert.equal(newMatch().targetScore,15);
 assert.equal(newMatch({targetScore:25}).targetScore,25);
 for(const n of [0,-1,1.5,NaN,Infinity,'oops',10001])assert.throws(()=>validateTargetScore(n));
});
test('ordinary eight banks bonus plus two; only winner scores',()=>{
 let m=pocketOpponentBalls(newMatch({targetScore:25}),0,3);
 m=pocketOpponentBalls(m,1,4);
 m=endRack(m,{winner:0});
 assert.deepEqual(m.scores,[5,0]);
 assert.equal(m.breaker,0);
 assert.equal(m.rack,2);
});
test('bank or kick doubles current rack only, not previous match totals',()=>{
 let m=endRack(newMatch({targetScore:30}),{winner:0});
 m=pocketOpponentBalls(m,0,3);
 m=endRack(m,{winner:0,bankOrKick:true});
 assert.deepEqual(m.scores,[12,0]);
});
test('failed eight or scratch loses unbanked bonus, not earlier match points',()=>{
 let m=endRack(newMatch({targetScore:20}),{winner:0});
 m=pocketOpponentBalls(m,0,5);
 m=forfeitBonus(m,0);
 assert.deepEqual(m.bonus,[0,0]);
 assert.deepEqual(m.scores,[2,0]);
});
test('early eight awards opponent only own rack bonus; zero-point win possible',()=>{
 let m=pocketOpponentBalls(newMatch(),0,4);
 m=pocketOpponentBalls(m,1,3);
 m=endRack(m,{winner:1,finish:'early-eight'});
 assert.deepEqual(m.scores,[0,3]);
 assert.equal(m.breaker,1);
 m=endRack(m,{winner:0,finish:'eight-scratch'});
 assert.deepEqual(m.scores,[0,3]);
});
test('multiple balls count individually and target may be exceeded',()=>{
 let m=pocketOpponentBalls(newMatch({targetScore:7}),0,3);
 m=endRack(m,{winner:0,bankOrKick:true});
 assert.deepEqual(m.scores,[10,0]);
 assert.equal(m.finished,true);
 assert.equal(m.winner,0);
 assert.throws(()=>endRack(m,{winner:1}));
});
test('eight on break does not score or end rack',()=>{
 const m=newMatch();
 assert.equal(newRackAfterBreakEight(m),m);
});
