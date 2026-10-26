import test from 'node:test';
import assert from 'node:assert/strict';
import {ball,rack,step,canPlace,findPlacement,applyCueSpin} from '../src/physics.js';
import {adjudicate,readyForStash,readyForEight,stashBall} from '../src/rules.js';
test('rack has cue plus 13 balls with one solid and one stripe reserved',()=>{
 const balls=rack();assert.equal(balls.length,14);assert.equal(balls.some(b=>b.id===7||b.id===15),false);
 assert.equal(new Set(balls.map(b=>b.id)).size,14);
});
test('collision transfers momentum without invalid values',()=>{
 const a=ball(0,100,200),b=ball(1,124,200);a.vx=650;
 for(let i=0;i<60;i++)step([a,b]);
 assert.ok(b.x>124);assert.ok([a.x,a.y,b.x,b.y,a.vx,b.vx].every(Number.isFinite));
});
test('ball falls into corner pocket',()=>{
 const a=ball(1,55,55);a.vx=-200;a.vy=-200;
 for(let i=0;i<80&&!a.pocketed;i++)step([a]);
 assert.equal(a.pocketed,true);
});
test('placement avoids balls and pockets',()=>{
 assert.equal(canPlace([ball(1,200,200)],200,200),false);
 assert.equal(canPlace([],0,0),false);
 const p=findPlacement([ball(1,260,250)]);
 assert.ok(p&&canPlace([ball(1,260,250)],p.x,p.y));
});
test('hidden ball must be revealed before the eight',()=>{
 const balls=[ball(0,100,100),ball(8,300,100)];
 assert.equal(readyForStash(balls,'solids',false),true);
 assert.equal(readyForEight(balls,'solids',false),false);
 assert.equal(readyForEight(balls,'solids',true),true);
 assert.equal(stashBall('stripes'),15);
});
test('premature eight loses',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(1,400,200)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},pocketed:[8],firstContact:8,breakShot:false});
 assert.equal(result.winner,1);
});
test('legal final eight wins',()=>{
 const balls=[ball(0,100,100),ball(8,300,100)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},pocketed:[8],firstContact:8,breakShot:false,preShotReadyForEight:true});
 assert.equal(result.winner,0);
});
test('scratch passes turn and allows ball in hand',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(1,400,200)];balls[0].pocketed=true;
 const r=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},pocketed:[0],firstContact:1,breakShot:false});
 assert.equal(r.foul,true);assert.equal(r.keepTurn,false);
});
test('cannot win by pocketing last group ball and eight together',()=>{
 const balls=[ball(0,100,100),ball(8,300,100),ball(7,250,150)];balls[1].pocketed=true;balls[2].pocketed=true;
 const r=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},pocketed:[7,8],firstContact:7,breakShot:false,preShotReadyForEight:false});
 assert.equal(r.winner,1);
});

test('fast cue ball cannot tunnel through an object ball', () => {
 const cue = ball(0,100,200), object = ball(1,170,200);
 cue.vx = 1300;
 const balls = [cue,object];
 let firstContacts = 0;
 for(let i = 0;i < 80;i++) firstContacts += step(balls).contacts.length;
 assert.ok(firstContacts >= 1,'cue should contact object ball at break-shot speed');
 assert.ok(object.x > 170,'object ball should move after contact');
});
test('top-cushion bank touches the visible cushion face, without an invisible gap', () => {
 const b = ball(1,400,65);b.vy = -500;
 const balls = [b];
 let near = Infinity, bounced = false;
 for(let i = 0;i < 100;i++) {
  step(balls);near = Math.min(near,b.y);bounced ||= b.vy > 0;
 }
 assert.equal(bounced,true);
 assert.ok(near >= 20 && near <= 25,'ball center banks at the 11px nose plus 11px ball radius');
 assert.equal(b.pocketed,false);
});
test('side-pocket approach sinks, but a nearby shot hits the top cushion', () => {
 const sink = ball(1,500,85),miss = ball(2,440,85);
 sink.vy = -500;miss.vy = -500;
 const balls = [sink,miss];
 for(let i = 0;i < 180;i++) step(balls);
 assert.equal(sink.pocketed,true);
 assert.equal(miss.pocketed,false);
 assert.ok(miss.y > 20);
});
test('full-rack break has finite positions and contact events', () => {
 const balls = rack();balls[0].vx = 1000;
 let contacts = 0;
 for(let i = 0;i < 1000;i++) contacts += step(balls).contacts.length;
 assert.ok(contacts > 0,'break shot must reach and contact the rack');
 assert.ok(balls.every(b => b.pocketed || [b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
});

test('Tailuge cue spin exposes draw, follow, and side english without changing aim', () => {
 const b=ball(0,250,250);b.vx=700;b.vy=0;
 applyCueSpin(b,1,0.5);
 assert.equal(b.vx,700);
 assert.ok(b.wy>0,'follow must spin cue in direction of travel');
 assert.ok(b.wz>0,'right english must produce side angular velocity');
 applyCueSpin(b,-1,-0.5);
 assert.ok(b.wy<0,'draw must reverse rolling spin');
 assert.ok(b.wz<0,'left english must reverse side spin');
});
test('Tailuge collision transfers momentum and generates side-spin throw', () => {
 const a=ball(0,100,250),b=ball(1,140,250),balls=[a,b];
 a.vx=800;applyCueSpin(a,0,0.9);
 let touches=0;
 for(let i=0;i<80;i++)touches+=step(balls).contacts.length;
 assert.ok(touches>0);
 assert.ok(b.x>140);
 assert.ok([a.wx,a.wy,a.wz,b.wx,b.wy,b.wz].every(Number.isFinite));
});
test('pocket jaw near-miss is not falsely pocketed', () => {
 const b=ball(1,440,85),balls=[b];b.vy=-500;
 for(let i=0;i<200;i++)step(balls);
 assert.equal(b.pocketed,false);
 assert.ok(b.x>=-11&&b.x<=1011);
 assert.ok(b.y>=-11&&b.y<=511);
});
test('Tailuge rack fully settles without NaNs at normal break speed', () => {
 const balls=rack();balls[0].vx=1100;
 let contacts=0,ended=false;
 for(let i=0;i<2400;i++){
  contacts+=step(balls).contacts.length;
  if(balls.every(b=>b.pocketed||Math.hypot(b.vx,b.vy)<5)){ended=true;break;}
 }
 assert.ok(contacts>=8,'break must hit and spread rack');
 assert.equal(ended,true,'rack should settle before 20 seconds');
 assert.ok(balls.every(b=>b.pocketed||[b.x,b.y,b.vx,b.vy,b.wx,b.wy,b.wz].every(Number.isFinite)));
});
