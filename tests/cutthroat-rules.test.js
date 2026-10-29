import test from 'node:test';
import assert from 'node:assert/strict';
import {startCutthroat,availableGroups,assignCutthroatGroup,finishCutthroatShot,resolveCutthroatClaim,remainingCutthroatBalls} from '../src/cutthroat-rules.js';

test('three seats: earn a group, keep shooting on any ball, miss passes turn',()=>{
 let m=startCutthroat();
 assert.throws(()=>assignCutthroatGroup(m,0,0));
 m=finishCutthroatShot(m,{pocketed:[1]});
 assert.equal(m.groupChoicePlayer,0);
 m=assignCutthroatGroup(m,0,0);
 assert.deepEqual(availableGroups(m),[1,2]);
 m=finishCutthroatShot(m,{pocketed:[2]});
 assert.equal(m.turn,0);
 m=finishCutthroatShot(m);
 assert.equal(m.turn,1);
 m=finishCutthroatShot(m,{pocketed:[6]});
 m=assignCutthroatGroup(m,1,1);
 assert.deepEqual(remainingCutthroatBalls(m,0),[3,4,5]);
 assert.throws(()=>assignCutthroatGroup(m,1,0));
});

test('group choice remains available through multiple legal shots and end-of-turn miss',()=>{
 let m=finishCutthroatShot(startCutthroat(),{pocketed:[6]});
 m=finishCutthroatShot(m,{pocketed:[7]});
 assert.equal(m.groupChoicePlayer,0);
 m=finishCutthroatShot(m);
 assert.equal(m.turn,0,'handoff must wait for source-permitted group choice');
 assert.equal(m.pendingTurn,1);
 assert.throws(()=>finishCutthroatShot(m));
 m=assignCutthroatGroup(m,0,1);
 assert.equal(m.turn,1);
 assert.equal(m.pendingTurn,null);
 assert.equal(m.owners[0],1);
});

test('scratch claim transfers an unpocketed ball without resurrecting pocketed balls',()=>{
 let m=finishCutthroatShot(startCutthroat(),{pocketed:[1,2]});
 m=assignCutthroatGroup(m,0,0);
 m=finishCutthroatShot(m,{scratch:true,pocketed:[3]});
 assert.equal(m.turn,1);
 assert.equal(m.pendingClaim.claimant,2);
 assert.deepEqual(m.pendingClaim.returnable,[4,5]);
 assert.throws(()=>finishCutthroatShot(m));
 assert.throws(()=>resolveCutthroatClaim(m,3));
 m=resolveCutthroatClaim(m,4);
 assert.deepEqual(m.pocketed,[1,2,3]);
 assert.equal(m.claimedBalls[4],2);
 assert.equal(m.turn,1);
});

test('scratch after earned but deferred group choice pauses before third-player claim',()=>{
 let m=finishCutthroatShot(startCutthroat(),{pocketed:[6]});
 m=finishCutthroatShot(m,{scratch:true});
 assert.equal(m.turn,0);
 assert.equal(m.pendingTurn,1);
 assert.throws(()=>resolveCutthroatClaim(m,10));
 m=assignCutthroatGroup(m,0,1);
 assert.equal(m.turn,1);
 assert.deepEqual(m.pendingClaim.returnable,[7,8,9,10]);
 m=resolveCutthroatClaim(m,10);
 assert.equal(m.claimedBalls[10],2);
 assert.ok(!m.pocketed.includes(10));
});

test('eliminated players skip their turns but third-seat scratch claims can revive them',()=>{
 let m={...startCutthroat(),owners:[1,0,2],turn:1,pocketed:[11,12,13,14,15]};
 m=finishCutthroatShot(m);
 assert.equal(m.turn,0);
 m={...m,turn:0,pocketed:[6,7,11,12,13,14,15]};
 m=finishCutthroatShot(m,{scratch:true});
 assert.equal(m.pendingClaim.claimant,2);
 m=resolveCutthroatClaim(m,10);
 assert.ok(remainingCutthroatBalls(m,2).includes(10));
});

test('last surviving group wins, including after a scratch claim',()=>{
 let m={...startCutthroat(),owners:[0,1,2],turn:0,pocketed:[1,2,3,4,5,6,7,8,9]};
 m=finishCutthroatShot(m,{pocketed:[10]});
 assert.equal(m.winner,2);
 m={...startCutthroat(),owners:[0,1,2],turn:0,pocketed:[1,2,3,4,6,7,8,9,10]};
 m=finishCutthroatShot(m,{scratch:true});
 assert.deepEqual(m.pendingClaim.returnable,[5]);
 m=resolveCutthroatClaim(m,5);
 assert.equal(remainingCutthroatBalls(m,0).length,0);
 assert.ok(remainingCutthroatBalls(m,2).includes(5));
 assert.equal(m.winner,2);
});

test('balls pocketed on a foul stay down and no illegal group is awarded',()=>{
 let m=finishCutthroatShot(startCutthroat(),{pocketed:[6],foul:true});
 assert.deepEqual(m.pocketed,[6]);
 assert.equal(m.turn,1);
 assert.equal(m.groupChoicePlayer,null);
 assert.throws(()=>assignCutthroatGroup(m,1,0));
});

test('third group is assigned automatically when the first two groups are chosen',()=>{
 let m=finishCutthroatShot(startCutthroat(),{pocketed:[1]});
 m=assignCutthroatGroup(m,0,0);
 m=finishCutthroatShot(m);
 m=finishCutthroatShot(m,{pocketed:[6]});
 m=assignCutthroatGroup(m,1,1);
 assert.deepEqual(m.owners,[0,1,2]);
 assert.equal(remainingCutthroatBalls(m,2).length,5);
});
