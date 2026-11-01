import test from 'node:test';
import assert from 'node:assert/strict';
import {createShotResultSession} from '../src/shot-result.js';
import {adjudicateCutthroatShot} from '../src/cutthroat-shot-adapter.js';
import {startCutthroat,assignCutthroatGroup,resolveCutthroatClaim,remainingCutthroatBalls} from '../src/cutthroat-rules.js';

const pocket=(ballId)=>({type:'pocket',ballId,pocketId:'TL'});
const contact=(ballId)=>({type:'contact',balls:[0,ballId]});
const session=()=>createShotResultSession({game:'cutthroat',adjudicate:adjudicateCutthroatShot});

test('Cutthroat emits one ruling and physical pocket event even on repeated settlement',()=>{
 const shots=session(),received=[];
 shots.subscribe(result=>received.push(result));
 const context={match:startCutthroat(),shotEvents:[contact(1),pocket(1),pocket(1)]};
 const result=shots.resolve({shotId:'cut-a',context});
 assert.equal(result.game,'cutthroat');
 assert.equal(result.legal,true);
 assert.equal(result.foul,false);
 assert.deepEqual(result.pocketed,[1]);
 assert.equal(result.points,0);
 assert.equal(result.nextPlayer,0);
 assert.equal(result.actions.match.groupChoicePlayer,0);
 assert.equal(result.rackEnd,false);
 assert.match(result.announcement,/Player 1: pocketed 1/);
 assert.equal(shots.resolve({shotId:'cut-a',context}),result);
 assert.equal(received.length,1,'history and telemetry subscribers fire once');
 shots.reset();
 shots.resolve({shotId:'cut-a',context});
 assert.equal(received.length,2,'new rack permits fresh shot identities');
});

test('Cutthroat deferred group choice stays legal after a missed shot',()=>{
 let match=startCutthroat();
 match=adjudicateCutthroatShot({match,shotEvents:[contact(6),pocket(6)]}).actions.match;
 const result=adjudicateCutthroatShot({match,shotEvents:[contact(1)]});
 assert.equal(result.legal,true);
 assert.equal(result.actions.match.turn,0);
 assert.equal(result.actions.match.pendingTurn,1);
 match=assignCutthroatGroup(result.actions.match,0,1);
 assert.equal(match.turn,1);
 assert.equal(match.owners[0],1);
});

test('Cutthroat scratch counts physical balls and retains third-seat claim and reentry',()=>{
 const match={...startCutthroat(),owners:[0,1,2],turn:0};
 const result=adjudicateCutthroatShot({match,shotEvents:[contact(2),pocket(2),pocket(2),pocket(0)]});
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,true);
 assert.deepEqual(result.pocketed,[2]);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.actions.match.pendingClaim.claimant,2);
 assert.deepEqual(result.actions.match.pendingClaim.returnable,[1,3,4,5]);
 const claimed=resolveCutthroatClaim(result.actions.match,4);
 assert.equal(claimed.claimedBalls[4],2);
 assert.ok(remainingCutthroatBalls(claimed,2).includes(4));
 assert.match(result.announcement,/Third player decides a claim/);
});

test('Cutthroat miss without object contact passes turn without inventing ball in hand',()=>{
 const result=adjudicateCutthroatShot({match:startCutthroat(),shotEvents:[]});
 assert.equal(result.legal,false);
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,false);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.rackEnd,false);
 const breakResult=adjudicateCutthroatShot({match:startCutthroat(),breakShot:true,shotEvents:[]});
 assert.equal(breakResult.foul,false,'break contact is exempt');
 assert.equal(breakResult.nextPlayer,1);
});

test('Cutthroat last surviving group wins without bypassing rules engine',()=>{
 const match={...startCutthroat(),owners:[0,1,2],turn:0,pocketed:[1,2,3,4,5,6,7,8,9]};
 const result=adjudicateCutthroatShot({match,shotEvents:[contact(10),pocket(10)]});
 assert.equal(result.rackEnd,true);
 assert.equal(result.actions.match.winner,2);
 assert.equal(result.nextPlayer,2);
 assert.equal(result.ballInHand,false);
});

test('Cutthroat session rejects missing shot id before publishing',()=>{
 const shots=session(),received=[];
 shots.subscribe(r=>received.push(r));
 assert.throws(()=>shots.resolve({context:{match:startCutthroat()}}),/shotId/);
 assert.equal(received.length,0);
});
