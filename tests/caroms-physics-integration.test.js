import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,setTableSize} from '../src/table-geometry.js';
import {ball,fullRack,headStringX,shotSpeed,stationary,step} from '../src/physics.js';
import {caromsTurn} from '../src/caroms-rules.js';

// Drive the actual shared Tailuge-derived physics, not fabricated shot events.
// Keep these scenarios valid on every regulation bed without scaling balls.
function settle(balls,limit=2400){
 const events=[];
 for(let frame=0;frame<limit;frame++){
  events.push(...step(balls,1/120).shotEvents);
  if(stationary(balls))return {events,frames:frame+1,settled:true};
 }
 return {events,frames:limit,settled:false};
}
function decide(balls,events,breakShot=false){
 return caromsTurn({balls,groups:[null,null],shooter:0,shooterBall:1,
  shotEvents:events,breakShot,level:'beginner'});
}

test('Caroms 1-ball break physically hits white then opens the rack on 7/8/9 ft',()=>{
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=fullRack(),one=balls.find(b=>b.id===1),white=balls.find(b=>b.id===0);
  one.x=TABLE.radius+TABLE.width*.11;
  one.y=TABLE.height/2;
  white.x=headStringX()+TABLE.radius*3;
  white.y=TABLE.height/2;
  one.vx=shotSpeed(85,true);
  const {events,settled}=settle(balls);
  const contacts=events.filter(e=>e.type==='contact');
  assert.ok(settled,`${size} ft break did not settle within 20 seconds`);
  assert.deepEqual(contacts[0]?.balls?.slice().sort((a,b)=>a-b),[0,1],
   `${size} ft break must first hit the white ball`);
  assert.ok(contacts.some(e=>e.balls.includes(0)&&e.balls.some(id=>id!==0&&id!==1)),
   `${size} ft break should drive the white ball into the full rack`);
  assert.ok(balls.every(b=>b.pocketed||[b.x,b.y,b.vx,b.vy].every(Number.isFinite)),
   `${size} ft break must keep every live ball finite`);
  assert.equal(decide(balls,events,true).winner,null);
 }
});

test('actual Caroms stroke: cue-first then rail is legal on all table sizes',()=>{
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=[ball(1,TABLE.width-260,TABLE.height/2),
   ball(0,TABLE.width-120,TABLE.height/2)];
  balls[0].vx=shotSpeed(68,false);
  const {events,settled}=settle(balls);
  const cueContact=events.findIndex(e=>e.type==='contact'&&
   e.balls.includes(0)&&e.balls.includes(1));
  const rail=events.findIndex((e,i)=>i>cueContact&&e.type==='rail');
  assert.ok(settled,`${size} ft stroke did not settle`);
  assert.ok(cueContact>=0&&rail>cueContact,`${size} ft needs ordered cue contact then rail`);
  const decision=decide(balls,events);
  assert.equal(decision.foul,false,`${size} ft legal Caroms stroke was called foul`);
  assert.equal(decision.firstContact,0);
  assert.equal(decision.railAfterContact,true);
  assert.equal(decision.nextPlayer,1,'legal miss passes the turn');
 }
});

test('actual Caroms stroke: hitting another object before white is a foul',()=>{
 for(const size of [7,8,9]){
  setTableSize(size);
  const balls=[ball(1,TABLE.width-300,TABLE.height/2),
   ball(3,TABLE.width-210,TABLE.height/2),
   ball(0,TABLE.width-120,TABLE.height/2)];
  balls[0].vx=shotSpeed(68,false);
  const {events,settled}=settle(balls);
  assert.ok(settled,`${size} ft stroke did not settle`);
  const decision=decide(balls,events);
  assert.equal(decision.firstContact,3);
  assert.equal(decision.foul,true,`${size} ft wrong first contact must foul`);
  assert.equal(decision.cueOption,'leave-or-center');
  assert.equal(decision.nextPlayer,1);
 }
});
