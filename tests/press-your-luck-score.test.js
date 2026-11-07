import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,validateTargetScore,pocketOpponentBalls,forfeitBonus,endRack,newRackAfterBreakEight,recordRackPockets,rackScorePreview} from '../src/press-your-luck-score.js';

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

test('every own ball pocketed by winner counts once, plus two for legal eight',()=>{
 let m=newMatch({targetScore:25});
 // Two previous 8-ball-only racks were locked at 2 each.
 m=endRack(m,{winner:0});m=endRack(m,{winner:0});
 assert.deepEqual(m.scores,[4,0]);
 m=recordRackPockets(m,0,[1,2,3,4,5,5,9,8,0],['solids','stripes']);
 m=pocketOpponentBalls(m,0,3);
 assert.deepEqual(m.rackPoints,[5,0],'only own solids count; cue, eight, stripe and duplicate do not');
 assert.deepEqual(rackScorePreview(m,0),{
  banked:4,own:5,press:3,winRack:10,ifLegalEight:14,
 });
 m=endRack(m,{winner:0});
 assert.deepEqual(m.scores,[14,0],'5 own + 3 press + 2 eight on top of 4 banked');
 assert.deepEqual(m.lastRack,{winner:0,awarded:10,finish:'eight',bankOrKick:false,
  ownPoints:5,pressBonus:3,eightPoints:2,multiplier:1});
 assert.deepEqual(m.rackPoints,[0,0]);
 assert.deepEqual(m.rackPocketed,[[],[]],'next rack must not count old balls');
 assert.deepEqual(m.bonus,[0,0]);
});
test('break balls retroactively count once the player is assigned their group',()=>{
 let m=newMatch();
 m=recordRackPockets(m,0,[1,9,0,8,1],[null,null]);
 assert.deepEqual(m.rackPoints,[0,0],'group not claimed yet, but remember both physical balls');
 m=recordRackPockets(m,0,[2],['solids','stripes']);
 assert.deepEqual(m.rackPoints,[2,0],'own break ball 1 plus called ball 2; stripe 9 is excluded');
 m=recordRackPockets(m,1,[10,3],['solids','stripes']);
 assert.deepEqual(m.rackPoints,[2,1],'opponent receives no credit for a solid they potted');
 m=recordRackPockets(m,0,[3],['solids','stripes']);
 assert.equal(m.rackPoints[0],2,'a previously pocketed object ball can never score twice');
});
test('banked scores are safe if pressing bonus is lost, and illegal eight retains opponent own points',()=>{
 let m=endRack(newMatch({targetScore:50}),{winner:0});
 m=recordRackPockets(m,0,[1,2,3],['solids','stripes']);
 m=pocketOpponentBalls(m,0,4);
 m=forfeitBonus(m,0);
 assert.deepEqual(rackScorePreview(m,0),{
  banked:2,own:3,press:0,winRack:5,ifLegalEight:7,
 });
 m=recordRackPockets(m,1,[9,10,11],['solids','stripes']);
 m=pocketOpponentBalls(m,1,2);
 m=endRack(m,{winner:1,finish:'eight-scratch'});
 assert.deepEqual(m.scores,[2,5],'opponent banks 3 own + 2 press, no free eight points');
 assert.equal(m.lastRack.eightPoints,0);
});
test('a successful called bank/kick doubles the current rack, never previous racks',()=>{
 let m=endRack(newMatch({targetScore:50}),{winner:0});
 m=recordRackPockets(m,0,[1,2,3,4,5],['solids','stripes']);
 m=pocketOpponentBalls(m,0,3);
 m=endRack(m,{winner:0,bankOrKick:true});
 assert.deepEqual(m.scores,[22,0],'2 previous + (5 own + 3 press + 2 eight) × 2');
 assert.equal(m.lastRack.multiplier,2);
});
