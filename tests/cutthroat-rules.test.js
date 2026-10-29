import test from 'node:test';
import assert from 'node:assert/strict';
import {startCutthroat,assignCutthroatGroup,finishCutthroatShot,resolveCutthroatClaim,remainingCutthroatBalls} from '../src/cutthroat-rules.js';

test('three players take turns and may pocket their own balls to continue',()=>{
 let m=startCutthroat();
 m=finishCutthroatShot(m,{pocketed:[1]});
 assert.equal(m.turn,0);
 m=assignCutthroatGroup(m,0,0);
 m=finishCutthroatShot(m,{pocketed:[2]});
 assert.equal(m.turn,0);
 m=finishCutthroatShot(m);
 assert.equal(m.turn,1);
 m=assignCutthroatGroup(m,1,1);
 assert.deepEqual(remainingCutthroatBalls(m,0),[3,4,5]);
 assert.throws(()=>assignCutthroatGroup(m,1,0));
});

test('scratch pauses turn for third player to choose an actual scratcher ball',()=>{
 let m=startCutthroat();
 m=assignCutthroatGroup(m,0,0);
 m=finishCutthroatShot(m,{pocketed:[1,2]});
 m=finishCutthroatShot(m,{scratch:true,pocketed:[3]});
 assert.equal(m.turn,1);
 assert.equal(m.pendingClaim.claimant,2);
 assert.deepEqual(m.pendingClaim.returnable,[4,5]);
 assert.throws(()=>finishCutthroatShot(m));
 assert.throws(()=>resolveCutthroatClaim(m,9));
 m=resolveCutthroatClaim(m,4);
 assert.deepEqual(m.pocketed,[1,2,3]);
 assert.ok(remainingCutthroatBalls(m,2).includes(4));
 assert.equal(m.pendingClaim,null);
 assert.equal(m.turn,1);
});

test('scratch claim transfers an unpocketed ball to the third player',()=>{
 let m=startCutthroat();
 m={...m,owners:[0,1,2],turn:0,pocketed:[1,2,3,4,6,7,8,9,10]};
 m=finishCutthroatShot(m,{scratch:true});
 assert.equal(m.winner,null);
 m=resolveCutthroatClaim(m,5);
 assert.equal(remainingCutthroatBalls(m,0).length,0);
 assert.ok(remainingCutthroatBalls(m,2).includes(5));
 assert.equal(m.winner,2);
});

test('last remaining group wins after all groups are assigned',()=>{
 let m={...startCutthroat(),owners:[0,1,2],turn:0,pocketed:[1,2,3,4,5,6,7,8,9]};
 m=finishCutthroatShot(m,{pocketed:[10]});
 assert.equal(m.winner,2);
});

test('no claim if the scratcher has no ball remaining on the felt',()=>{
 let m={...startCutthroat(),owners:[0,1,2],turn:0,pocketed:[1,2,3,4,5]};
 m=finishCutthroatShot(m,{scratch:true});
 assert.deepEqual(m.pendingClaim.returnable,[]);
 m=resolveCutthroatClaim(m);
 assert.equal(m.pendingClaim,null);
});
