import test from 'node:test';
import assert from 'node:assert/strict';
import {createShotResultSession} from '../src/shot-result.js';
import {adjudicateButWaitShot} from '../src/but-wait-shot-adapter.js';
import {resolveSurpriseChoice,readyForEight} from '../src/rules.js';

const balls=ids=>ids.map(id=>({id,pocketed:false}));
const pocket=(id,pocketId='TL')=>({id,pocketId});
const base={
 balls:balls([0,1,2,3,8,9,10]),shooter:0,
 groups:[null,null],deployed:{solids:false,stripes:false},
 firstContact:2,breakShot:false,calledBall:2,calledPocket:'TL',
};
const session=()=>createShotResultSession({
 game:'but-wait',adjudicate:adjudicateButWaitShot,
});

test('But Wait emits one group claim and physical pocket despite duplicate settlement',()=>{
 const shots=session(),events=[];shots.subscribe(result=>events.push(result));
 const context={...base,pocketed:[2,2],pocketEvents:[pocket(2),pocket(2)]};
 const result=shots.resolve({shotId:'but-wait-a',context});
 assert.equal(result.game,'but-wait');
 assert.equal(result.legal,true);
 assert.equal(result.foul,false);
 assert.deepEqual(result.pocketed,[2]);
 assert.equal(result.actions.newGroup,'solids');
 assert.equal(result.nextPlayer,0);
 assert.equal(result.rackEnd,false);
 assert.match(result.announcement,/claims solids/);
 assert.equal(shots.resolve({shotId:'but-wait-a',context}),result);
 assert.equal(events.length,1,'one history/telemetry event for a settled shot');
 shots.reset();
 shots.resolve({shotId:'but-wait-a',context});
 assert.equal(events.length,2,'new rack may reuse an old shot identity');
});

test('uncalled break pots keep turn but never assign a group',()=>{
 const result=adjudicateButWaitShot({
  ...base,breakShot:true,calledBall:null,calledPocket:null,
  pocketed:[2],pocketEvents:[pocket(2)],
 });
 assert.equal(result.nextPlayer,0);
 assert.equal(result.actions.newGroup,null);
 assert.deepEqual(result.pocketed,[2]);
});

test('slop stays pocketed but passes turn without assigning a group',()=>{
 const result=adjudicateButWaitShot({
  ...base,calledBall:3,pocketed:[2],pocketEvents:[pocket(2)],
 });
 assert.equal(result.foul,false);
 assert.equal(result.actions.madeCall,false);
 assert.equal(result.actions.newGroup,null);
 assert.equal(result.nextPlayer,1);
 assert.deepEqual(result.pocketed,[2]);
 assert.match(result.announcement,/Slop stays down/);
});

test('scratch gives opponent ball in hand without counting the cue ball',()=>{
 const result=adjudicateButWaitShot({
  ...base,pocketed:[0,2,0],pocketEvents:[pocket(0,'TM'),pocket(2)],
 });
 assert.equal(result.foul,true);
 assert.equal(result.ballInHand,true);
 assert.equal(result.nextPlayer,1);
 assert.deepEqual(result.pocketed,[2]);
 assert.match(result.announcement,/scratch/);
});

test('opponent surprise choice preserves eligibility and called-eight outcome',()=>{
 const choice=resolveSurpriseChoice([7,15],{solids:false,stripes:false},'solids',15);
 assert.deepEqual(choice.heldBalls,[7]);
 assert.equal(readyForEight(balls([0,8,9,15]),'solids',choice.deployed.solids),true);
 const context={...base,balls:balls([0,8,9,15]),
  groups:['solids','stripes'],deployed:choice.deployed,
  firstContact:8,preShotReadyForEight:true,
  calledBall:8,calledPocket:'TR',pocketed:[8],pocketEvents:[pocket(8,'TR')]};
 const win=adjudicateButWaitShot(context);
 assert.equal(win.rackEnd,true);
 assert.equal(win.actions.winner,0);
 assert.equal(win.nextPlayer,0);
 assert.equal(win.points,1);
 assert.equal(win.ballInHand,false);
 const wrongPocket=adjudicateButWaitShot({...context,calledPocket:'BR'});
 assert.equal(wrongPocket.rackEnd,true);
 assert.equal(wrongPocket.actions.winner,1);
 assert.equal(wrongPocket.points,0);
 const early=adjudicateButWaitShot({...context,preShotReadyForEight:false});
 assert.equal(early.actions.winner,1);
});

test('wrong first contact remains a foul, and shot ID is mandatory',()=>{
 const foul=adjudicateButWaitShot({...base,groups:['solids','stripes'],
  firstContact:9,pocketed:[],pocketEvents:[]});
 assert.equal(foul.foul,true);
 assert.equal(foul.ballInHand,true);
 assert.equal(foul.nextPlayer,1);
 const shots=session(),received=[];shots.subscribe(r=>received.push(r));
 assert.throws(()=>shots.resolve({context:base}),/shotId/);
 assert.equal(received.length,0);
});
