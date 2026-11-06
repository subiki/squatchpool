import test from 'node:test';
import assert from 'node:assert/strict';
import {ball} from '../src/physics.js';
import {createShotResultSession} from '../src/shot-result.js';
import {adjudicateCaromsShot} from '../src/caroms-shot-adapter.js';

const balls=()=>Array.from({length:16},(_,id)=>ball(id,100+id*3,200));
const contact=(a,b)=>({type:'contact',balls:[a,b]});
const rail=(ballId=0)=>({type:'rail',ballId});
const pocket=(ballId,pocketId='TL')=>({type:'pocket',ballId,pocketId});
const legal=[contact(1,0),rail(),contact(1,2),pocket(2)];
const shot=(overrides={})=>adjudicateCaromsShot({
 balls:balls(),groups:[null,null],shooter:0,shooterBall:1,
 shotEvents:legal,...overrides,
});

test('Caroms one settled object-ball stroke emits one ruling and one physical pocket',()=>{
 const session=createShotResultSession({game:'caroms',adjudicate:adjudicateCaromsShot});
 const received=[];session.subscribe(result=>received.push(result));
 const context={balls:balls(),groups:[null,null],shooter:0,shooterBall:1,
  shotEvents:[...legal,pocket(2)],playerLabel:'Squatch Bot'};
 const result=session.resolve({shotId:'caroms-a',context});
 assert.equal(result.game,'caroms');
 assert.equal(result.legal,true);
 assert.equal(result.foul,false);
 assert.deepEqual(result.pocketed,[2],'duplicate pocket reports must count once');
 assert.equal(result.nextPlayer,0);
 assert.deepEqual(result.actions.groups,['solids','stripes']);
 assert.match(result.announcement,/Squatch Bot: 2/);
 assert.match(result.announcement,/takes solids/);
 assert.equal(session.resolve({shotId:'caroms-a',context}),result);
 assert.equal(received.length,1,'history/telemetry listeners fire only once');
 session.reset();
 session.resolve({shotId:'caroms-a',context});
 assert.equal(received.length,2,'new rack resets shot identities');
});

test('Caroms break remains an object-ball stroke, without group assignment',()=>{
 const result=shot({breakShot:true});
 assert.equal(result.foul,false);
 assert.equal(result.rackEnd,false);
 assert.equal(result.nextPlayer,0);
 assert.deepEqual(result.actions.groups,[null,null]);
 assert.deepEqual(result.pocketed,[2]);
});

test('Caroms wrong first contact retains incoming player center-or-leave choice',()=>{
 const result=shot({shotEvents:[contact(1,3),contact(1,0),rail()]});
 assert.equal(result.foul,true);
 assert.equal(result.legal,false);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.ballInHand,false,'center-or-leave is not unrestricted BIH');
 assert.equal(result.actions.cueOption,'leave-or-center');
 assert.deepEqual(result.pocketed,[]);
});

test('Caroms scratch re-spots white without counting it as a made ball',()=>{
 const result=shot({shotEvents:[...legal,pocket(0,'TM')]});
 assert.equal(result.foul,true);
 assert.equal(result.nextPlayer,1);
 assert.equal(result.actions.respotCue,true);
 assert.equal(result.actions.cueOption,null);
 assert.deepEqual(result.pocketed,[2]);
});

test('Caroms called eight win and early eight loss keep separate house rules',()=>{
 const b=balls();
 for(const item of b)if(item.id>=1&&item.id<=7)item.pocketed=true;
 const context={balls:b,groups:['solids','stripes'],shooter:0,shooterBall:8,
  eightEligibleBefore:true,level:'advanced',calledBall:8,calledPocket:'BR',
  shotEvents:[contact(8,0),rail(),pocket(8,'BR')]};
 const win=shot(context);
 assert.equal(win.rackEnd,true);
 assert.equal(win.actions.winner,0);
 assert.equal(win.points,1);
 assert.equal(win.nextPlayer,0);
 const wrongCall=shot({...context,calledPocket:'TL'});
 assert.equal(wrongCall.rackEnd,true);
 assert.equal(wrongCall.actions.winner,1);
 assert.equal(wrongCall.points,0);
 const early=shot({groups:['solids','stripes'],shooterBall:1,
  shotEvents:[contact(1,0),rail(),contact(1,8),pocket(8)]});
 assert.equal(early.rackEnd,true);
 assert.equal(early.actions.winner,1);
});

test('Caroms rejects a missing shot identity before emitting telemetry',()=>{
 const session=createShotResultSession({game:'caroms',adjudicate:adjudicateCaromsShot});
 const received=[];session.subscribe(r=>received.push(r));
 assert.throws(()=>session.resolve({context:{}}),/shotId/);
 assert.equal(received.length,0);
});
