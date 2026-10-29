import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets,setTableSize} from '../src/table-geometry.js';
import {planCaromsBotShot} from '../src/caroms-bot-aim.js';

function fixture(){
 const white={id:0,x:TABLE.width*.45,y:TABLE.height*.5,pocketed:false};
 const striker={id:1,x:TABLE.width*.76,y:TABLE.height*.62,pocketed:false};
 return {white,striker,balls:[white,striker],eligible:[striker],
  cueBall:white,pockets,radius:TABLE.radius};
}

test('bot aims an object-ball carom toward a real pocket on 7/8/9 ft tables',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const args=fixture(),before=JSON.stringify(args.balls);
   const shot=planCaromsBotShot(args);
   assert.ok(shot,'size '+size+': a glancing carom candidate exists');
   assert.equal(shot.ballId,1);
   assert.ok(pockets.some(p=>p.id===shot.pocketId));
   assert.equal(JSON.stringify(args.balls),before,'planner must not mutate physics state');
   assert.deepEqual(planCaromsBotShot(args),shot,'planner must be deterministic');
   const pocket=pockets.find(p=>p.id===shot.pocketId);
   const n={x:(args.white.x-shot.impact.x)/(2*TABLE.radius),
    y:(args.white.y-shot.impact.y)/(2*TABLE.radius)};
   const incoming={x:Math.cos(shot.angle),y:Math.sin(shot.angle)};
   const incidence=incoming.x*n.x+incoming.y*n.y;
   assert.ok(incidence>0.14,'size '+size+': shot must approach the white ball');
   const outgoing={x:incoming.x-incidence*n.x,y:incoming.y-incidence*n.y};
   const toward={x:pocket.x-shot.impact.x,y:pocket.y-shot.impact.y};
   const alignment=(outgoing.x*toward.x+outgoing.y*toward.y)/
    (Math.hypot(outgoing.x,outgoing.y)*Math.hypot(toward.x,toward.y));
   assert.ok(alignment>.999,'size '+size+': deflected striker points toward pocket');
   const direct=Math.atan2(args.white.y-args.striker.y,args.white.x-args.striker.x);
   assert.ok(Math.abs(shot.angle-direct)>.01,
    'size '+size+': must not simply aim through white-ball center');
  }
 }finally{setTableSize(9);}
});

test('bot rejects blocked incoming carom lanes',()=>{
 try{
  setTableSize(8);
  const args=fixture(),shot=planCaromsBotShot(args);
  assert.ok(shot);
  const blocker={id:9,x:(args.striker.x+shot.impact.x)/2,
   y:(args.striker.y+shot.impact.y)/2,pocketed:false};
  const onlyPocket=pockets.filter(p=>p.id===shot.pocketId);
  assert.equal(planCaromsBotShot({...args,balls:[...args.balls,blocker],
   pockets:onlyPocket}),null);
 }finally{setTableSize(9);}
});

test('bot has safe deterministic no-shot fallback conditions',()=>{
 const args=fixture();
 assert.equal(planCaromsBotShot({...args,eligible:[]}),null);
 assert.equal(planCaromsBotShot({...args,cueBall:{...args.white,pocketed:true}}),null);
 assert.equal(planCaromsBotShot({...args,radius:0}),null);
 assert.equal(planCaromsBotShot({...args,pockets:[]}),null);
});
