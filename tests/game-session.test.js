import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameSession} from '../src/game-session.js';
import {adjudicateTunaShot} from '../src/tuna-shot-adapter.js';

const balls=()=>Array.from({length:15},(_,i)=>({
 id:i+1,pocketed:[11,12,13,14].includes(i+1),
}));
const tunaContext={
 player:0,balls:balls(),firstContact:15,
 shotEvents:[{type:'pocket',ballId:15,pocketId:'TL'}],
 calledBall:15,calledPocket:'TL',
};

test('Tuna GameSession owns break, one ruling event, and next-shot phase',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 const published=[];
 game.subscribe(result=>published.push(result));
 game.startRack();
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,true);
 assert.equal(game.startShot('rack-1-shot-1'),true);
 assert.equal(game.startShot('rack-1-shot-2'),false);
 const result=game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext});
 assert.equal(result.game,'tuna');
 assert.equal(result.points,1);
 assert.deepEqual(result.pocketed,[15]);
 assert.equal(game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext}),result);
 assert.equal(published.length,1);
 assert.equal(game.settle(),true);
 assert.equal(game.phase,'aim');
 assert.equal(game.breakShot,false);
 assert.equal(game.settle(),false);
 assert.throws(()=>game.resolveShot({shotId:'rack-1-shot-1',context:tunaContext}),/inactive or stale/);
});

test('new rack invalidates old shot IDs and resets once-per-shot event cache',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 let published=0;
 game.subscribe(()=>published++);
 game.startRack();
 assert.equal(game.startShot('same-id'),true);
 game.resolveShot({shotId:'same-id',context:tunaContext});
 game.startRack();
 assert.equal(game.startShot('new-id'),true);
 assert.throws(()=>game.resolveShot({shotId:'same-id',context:tunaContext}),/inactive or stale/);
 game.resolveShot({shotId:'new-id',context:tunaContext});
 assert.equal(published,2);
 game.settle({done:true});
 assert.equal(game.phase,'done');
 assert.equal(game.startShot('after-win'),false);
 game.startRack();
 assert.equal(game.startShot('same-id'),true);
 game.resolveShot({shotId:'same-id',context:tunaContext});
 assert.equal(published,3);
});

test('GameSession preserves foul placement and confirmation without a break gate',()=>{
 const game=createGameSession({game:'tuna',adjudicate:adjudicateTunaShot});
 game.startRack();
 assert.throws(()=>game.startShot(),/shotId/);
 game.startShot('break');
 game.resolveShot({shotId:'break',context:{
  ...tunaContext,shotEvents:[{type:'pocket',ballId:0,pocketId:'TL'}],
 }});
 assert.equal(game.settle({ballInHand:true}),true);
 assert.equal(game.phase,'place');
 assert.equal(game.startShot('too-soon'),false);
 assert.equal(game.confirmPlacement(),true);
 assert.equal(game.phase,'aim');
 assert.equal(game.startShot('legal-shot'),true);
 assert.equal(game.settle({done:true}),true);
 assert.equal(game.phase,'done');
});
