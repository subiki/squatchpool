import test from 'node:test';
import assert from 'node:assert/strict';
import {ball,fullRack,step} from '../src/physics.js';
import {CUTTHROAT_GROUPS,cutthroatGroupCounts,cutthroatShot,caromRailAfterContact,caromShotFromEvents,pressYourLuckScore} from '../src/squatch-modes.js';

test('full rack contains one cue and all fifteen object balls',()=>{
 const ids=fullRack().map(b=>b.id).sort((a,b)=>a-b);
 assert.deepEqual(ids,Array.from({length:16},(_,i)=>i));
});
test('cutthroat counts only surviving balls in each group',()=>{
 const balls=Array.from({length:16},(_,i)=>ball(i,0,0));
 balls.find(b=>b.id===3).pocketed=true;
 assert.deepEqual(cutthroatGroupCounts(balls),[4,5,5]);
 assert.equal(CUTTHROAT_GROUPS.length,3);
});
test('cutthroat own ball may count toward continuing a turn',()=>{
 const balls=Array.from({length:16},(_,i)=>ball(i,0,0));
 assert.equal(cutthroatShot({balls,owners:[0,1,2],shooter:0,pocketed:[1],firstContact:1}).keepTurn,true);
});
test('caroms requires rail AFTER cue contact',()=>{
 assert.equal(caromRailAfterContact([{type:'rail',ballId:1},{type:'contact',balls:[1,0]}],1),false);
 assert.equal(caromRailAfterContact([{type:'contact',balls:[1,0]},{type:'rail',ballId:0}],1),true);
});
test('Press Your Luck banking and forfeiture',()=>{
 assert.deepEqual(pressYourLuckScore({opponentBalls:3,eightMade:true,eightBanked:true}),{pending:3,banked:10,forfeited:0});
 assert.deepEqual(pressYourLuckScore({opponentBalls:3}),{pending:3,banked:0,forfeited:3});
 assert.throws(()=>pressYourLuckScore({eightBanked:true}));
});

test('physics emits ordered collision and rail events without changing legacy arrays',()=>{
 const striker=ball(1,100,200),cue=ball(0,140,200);striker.vx=800;
 const contact=[];
 for(let i=0;i<80;i++){
  const result=step([striker,cue]);
  assert.ok(Array.isArray(result.railEvents)&&Array.isArray(result.shotEvents));
  contact.push(...result.shotEvents);
 }
 assert.ok(contact.some(event=>event.type==='contact'&&event.balls.includes(0)&&event.balls.includes(1)));
 const bank=ball(2,400,65);bank.vy=-500;
 let railSeen=false;
 for(let i=0;i<100;i++){
  const result=step([bank]);
  if(result.shotEvents.some(event=>event.type==='rail'&&event.ballId===2)){
   assert.ok(result.railEvents.some(event=>event.id===2));
   railSeen=true;break;
  }
 }
 assert.equal(railSeen,true);
});
test('Caroms rejects a rail before first cue contact',()=>{
 const result=caromShotFromEvents({shooterBall:1,shotEvents:[
  {type:'rail',ballId:1},{type:'contact',balls:[1,0]},
  {type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(result.firstContact,0);
 assert.equal(result.railAfterContact,false);
 assert.equal(result.foul,true);
});
test('Caroms rejects first hitting another object ball',()=>{
 const result=caromShotFromEvents({shooterBall:1,shotEvents:[
  {type:'contact',balls:[1,3]},{type:'contact',balls:[1,0]},
  {type:'rail',ballId:0},{type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(result.firstContact,3);
 assert.equal(result.foul,true);
});
test('Caroms allows legal cue-first shot and advanced called pocket',()=>{
 const result=caromShotFromEvents({shooterBall:1,level:'advanced',calledBall:2,calledPocket:'TL',shotEvents:[
  {type:'contact',balls:[1,0]},{type:'rail',ballId:0},
  {type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(result.firstContact,0);
 assert.equal(result.foul,false);
 assert.equal(result.keepTurn,true);
 const wrong=caromShotFromEvents({shooterBall:1,level:'advanced',calledBall:2,calledPocket:'BR',shotEvents:[
  {type:'contact',balls:[1,0]},{type:'rail',ballId:0},
  {type:'pocket',ballId:2,pocketId:'TL'}]});
 assert.equal(wrong.keepTurn,false);
});
