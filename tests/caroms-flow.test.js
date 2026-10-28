import test from 'node:test';
import assert from 'node:assert/strict';
import {ball} from '../src/physics.js';
import {caromsTurn,caromsCallRequired,caromsEligible} from '../src/caroms-rules.js';
const balls=()=>Array.from({length:16},(_,id)=>ball(id,100+id*3,200));
const events=(striker=1,pot=2,pocket='TL')=>[
 {type:'contact',balls:[striker,0]},
 {type:'rail',ballId:0},
 ...(striker===pot?[]:[{type:'contact',balls:[striker,pot]}]),
 {type:'pocket',ballId:pot,pocketId:pocket}
];
const turn=(overrides={})=>caromsTurn({balls:balls(),groups:[null,null],
 shooter:0,shooterBall:1,shotEvents:events(),...overrides});

test('break uses 1 ball, does not assign a group, and can continue',()=>{
 const d=turn({breakShot:true,shotEvents:[{type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.deepEqual(d.groups,[null,null]);
 assert.equal(d.keepTurn,true);
 assert.equal(d.winner,null);
});
test('first legal post-break pocket assigns groups',()=>{
 const d=turn();
 assert.deepEqual(d.groups,['solids','stripes']);
 assert.equal(d.newGroup,'solids');
 assert.equal(d.nextPlayer,0);
});
test('cue-first then rail is required; wrong first contact is a foul',()=>{
 const d=turn({shotEvents:[
  {type:'contact',balls:[1,3]},{type:'contact',balls:[1,0]},
  {type:'rail',ballId:0},{type:'contact',balls:[1,2]},
  {type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(d.foul,true);
 assert.equal(d.cueOption,'leave-or-center');
 assert.equal(d.nextPlayer,1);
});
test('rail before cue contact does not legalize a stroke',()=>{
 const d=turn({shotEvents:[{type:'rail',ballId:1},{type:'contact',balls:[1,0]},
  {type:'contact',balls:[1,2]},{type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(d.foul,true);
});
test('cue scratch automatically re-spots white ball and changes turn',()=>{
 const d=turn({shotEvents:[...events(),{type:'pocket',ballId:0,pocketId:'TM'}]});
 assert.equal(d.respotCue,true);
 assert.equal(d.cueOption,null);
 assert.equal(d.nextPlayer,1);
});
test('advanced level requires matching ball and pocket',()=>{
 const d=turn({level:'advanced',calledBall:2,calledPocket:'BR'});
 assert.equal(d.foul,false);
 assert.equal(d.keepTurn,false);
 assert.deepEqual(d.groups,[null,null]);
 const correct=turn({level:'advanced',calledBall:2,calledPocket:'TL'});
 assert.equal(correct.keepTurn,true);
});
test('intermediate only calls 8; beginner never requires a call',()=>{
 assert.equal(caromsCallRequired('intermediate',false),false);
 assert.equal(caromsCallRequired('intermediate',true),true);
 assert.equal(caromsCallRequired('beginner',true),false);
});
test('legal 8 after clearing group wins; early 8 loses',()=>{
 const b=balls();
 for(const ball of b)if(ball.id>=1&&ball.id<=7)ball.pocketed=true;
 assert.equal(caromsEligible(b,'solids'),true);
 const good=turn({balls:b,groups:['solids','stripes'],shooterBall:8,
  eightEligibleBefore:true,shotEvents:events(8,8)});
 assert.equal(good.winner,0);
 const bad=turn({groups:['solids','stripes'],shooterBall:1,
  eightEligibleBefore:false,shotEvents:events(1,8)});
 assert.equal(bad.winner,1);
});
test('cannot strike opponent group after assignment',()=>{
 const d=turn({groups:['stripes','solids'],shooterBall:1,shotEvents:events()});
 assert.equal(d.foul,true);
});
test('8 on break is provisionally re-spotted, not declared a win',()=>{
 const d=turn({breakShot:true,shotEvents:[{type:'pocket',ballId:8,pocketId:'TM'}]});
 assert.equal(d.respotEight,true);
 assert.equal(d.winner,null);
});

test('white-ball-only combo is illegal even after cue-first and a rail',()=>{
 const d=turn({shotEvents:[
  {type:'contact',balls:[1,0]},
  {type:'contact',balls:[0,2]},
  {type:'rail',ballId:0},
  {type:'pocket',ballId:2,pocketId:'TL'}
 ]});
 assert.equal(d.foul,true);
 assert.equal(d.illegalCombo,true);
 assert.deepEqual(d.legalPocketed,[]);
 assert.equal(d.newGroup,null);
 assert.equal(d.nextPlayer,1);
 assert.match(d.reason,/Illegal combo/);
});
test('legal object-ball chain can pocket another object after the white',()=>{
 const d=turn({shotEvents:[
  {type:'contact',balls:[1,0]},
  {type:'contact',balls:[1,3]},
  {type:'contact',balls:[3,2]},
  {type:'rail',ballId:3},
  {type:'pocket',ballId:2,pocketId:'TL'}
 ]});
 assert.equal(d.foul,false);
 assert.deepEqual(d.legalPocketed,[2]);
 assert.equal(d.keepTurn,true);
});
test('an illegal white-ball combo cannot be redeemed by a separate legal pot',()=>{
 const d=turn({shotEvents:[
  {type:'contact',balls:[1,0]},
  {type:'contact',balls:[1,2]},
  {type:'contact',balls:[0,3]},
  {type:'rail',ballId:0},
  {type:'pocket',ballId:2,pocketId:'TL'},
  {type:'pocket',ballId:3,pocketId:'TR'}
 ]});
 assert.equal(d.illegalCombo,true);
 assert.equal(d.foul,true);
 assert.deepEqual(d.legalPocketed,[2]);
 assert.equal(d.keepTurn,false);
});
