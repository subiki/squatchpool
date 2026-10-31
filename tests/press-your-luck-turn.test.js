import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,pocketOpponentBalls} from '../src/press-your-luck-score.js';
import * as rules from '../src/press-your-luck-turn.js';
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

test('declared 8 bank/kick doubles only when cue or 8 rail precedes called pocket',()=>{
 const {qualifiesEightBankKick:qualifies}=rules;
 const call={declared:true,calledBall:8,calledPocket:'TR'};
 const eight={type:'pocket',ballId:8,pocketId:'TR'};
 const cueRail={type:'rail',ballId:0},eightRail={type:'rail',ballId:8};
 const otherRail={type:'rail',ballId:12};
 const cueContact={type:'contact',balls:[0,8]};
 assert.equal(qualifies([cueContact,cueRail,eight],call),true,'cue rail after first contact still qualifies before the pocket');
 assert.equal(qualifies([cueContact,eightRail,eight],call),true,'8 bank qualifies');
 assert.equal(qualifies([otherRail,eight],call),false,'another ball touching cushion is not a bank');
 assert.equal(qualifies([eight,cueRail],call),false,'rail after 8 drops is too late');
 assert.equal(qualifies([cueRail,eight],{...call,declared:false}),false,'undeclared bank does not double');
 assert.equal(qualifies([cueRail,eight],{...call,calledBall:9}),false,'another called ball does not double');
 assert.equal(qualifies([cueRail,{...eight,pocketId:'TL'}],call),false,'wrong pocket does not double');
 assert.equal(qualifies([cueRail],call),false,'missed 8 does not double');
 let match=pocketOpponentBalls(newMatch(),0,2);
 const awarded=pressTurn({match,balls:balls(),groups,shooter:0,shotEvents:[cueContact,cueRail,eight],bankOrKick:qualifies([cueContact,cueRail,eight],call)});
 assert.equal(awarded.match.scores[0],8,'2 bonus + 2 eight doubled to 8');
});

test('illegal missed 8 attempt forfeits bonus and awards ball in hand',()=>{
 const r=pressTurn({match:pocketOpponentBalls(newMatch(),0,3),balls:balls(),groups,shooter:0,eightAttempt:true,legalShot:false});
 assert.deepEqual(r.match.bonus,[0,0]);assert.equal(r.nextPlayer,1);
 assert.equal(r.ballInHand,true);assert.equal(r.keepTurn,false);
});
