import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,pocketOpponentBalls} from '../src/press-your-luck-score.js';
import {pressEligible,pressTurn} from '../src/press-your-luck-turn.js';
const groups=['solids','stripes'];
const balls=(solids=0,stripes=2)=>Array.from({length:16},(_,id)=>({id,pocketed:id>0&&id<8?id>solids:id>8?id>8+stripes:false}));
const pocket=(...ids)=>ids.map(ballId=>({type:'pocket',ballId}));
test('eligibility requires cleared own group',()=>{
 assert.equal(pressEligible(balls(0),groups[0]),true);
 assert.equal(pressEligible(balls(1),groups[0]),false);
});
test('legal multi-opponent shot awards each ball and retains turn',()=>{
 const r=pressTurn({match:newMatch(),balls:balls(),groups,shooter:0,shotEvents:pocket(9,10)});
 assert.deepEqual(r.match.bonus,[2,0]);assert.equal(r.nextPlayer,0);
});
test('missed 8 forfeits unbanked points, no rack end',()=>{
 const r=pressTurn({match:pocketOpponentBalls(newMatch(),0,3),balls:balls(),groups,shooter:0,eightAttempt:true});
 assert.deepEqual(r.match.bonus,[0,0]);assert.equal(r.nextPlayer,1);
});
test('8 and scratch awards opponent own provisional bonus only',()=>{
 let m=pocketOpponentBalls(newMatch(),1,4);
 const r=pressTurn({match:m,balls:balls(),groups,shooter:0,shotEvents:pocket(8,0)});
 assert.deepEqual(r.match.scores,[0,4]);assert.equal(r.finish,'eight-scratch');
});
test('8 on break is respotted without ending rack',()=>{
 const r=pressTurn({match:newMatch(),balls:balls(),groups,shooter:0,breakShot:true,shotEvents:pocket(8)});
 assert.equal(r.respotEight,true);assert.equal(r.match.rack,1);
});
test('early 8 awards opponent provisional points and not 2',()=>{
 const r=pressTurn({match:pocketOpponentBalls(newMatch(),1,2),balls:balls(1),groups,shooter:0,shotEvents:pocket(8)});
 assert.deepEqual(r.match.scores,[0,2]);assert.equal(r.winner,1);
});
