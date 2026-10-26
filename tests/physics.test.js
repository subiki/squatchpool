import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets,cushions,facings,jaws,setTableSize,PLAYING_SURFACES,BALL_DIAMETER_IN,mouthWidth,PX_PER_IN,CORNER_MOUTH_IN,SIDE_MOUTH_IN} from '../src/table-geometry.js';
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
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},pocketed:[8],firstContact:8,breakShot:false,preShotReadyForEight:true,calledBall:8,calledPocket:'TL',pocketEvents:[{id:8,pocketId:'TL'}]});
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

test('WPA corner and side mouth measurements match 4.56 and 5.06 inches',()=>{
 const corner=pockets.find(p=>p.id==='TL'),side=pockets.find(p=>p.id==='TM');
 assert.ok(Math.abs(mouthWidth(corner)/PX_PER_IN-CORNER_MOUTH_IN)<1e-8);
 assert.ok(Math.abs(mouthWidth(side)/PX_PER_IN-SIDE_MOUTH_IN)<1e-8);
 assert.ok(mouthWidth(side)>mouthWidth(corner));
 assert.ok(mouthWidth(side)<52,'side mouth is not a huge capture circle');
});
test('each of six pocket throats records its stable called-pocket ID',()=>{
 for(const p of pockets){
  const b=ball(1,p.kind==='side'?p.x:p.x+p.sx*65,p.kind==='side'?p.y+p.sy*80:p.y+p.sy*65);
  if(p.kind==='side'){b.vy=-p.sy*450;}else{b.vx=-p.sx*320;b.vy=-p.sy*320;}
  const balls=[b],events=[];
  for(let i=0;i<120&&!b.pocketed;i++)events.push(...step(balls).pocketEvents);
  assert.equal(b.pocketed,true,'should pocket at '+p.id);
  assert.deepEqual(events,[{id:1,pocketId:p.id}]);
 }
});
test('side pocket rejects an outside-mouth shot instead of swallowing slop',()=>{
 for(const x of [456,466,534,544]){
  const b=ball(1,x,80),balls=[b];b.vy=-480;
  for(let i=0;i<110;i++)step(balls);
  assert.equal(b.pocketed,false,'outside mouth: '+x);
 }
});
test('called object ball must enter precisely its declared pocket to earn turn',()=>{
 const balls=[ball(0,100,200),ball(1,250,200),ball(8,300,250)];
 balls[1].pocketed=true;
 const base={balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},
  pocketed:[1],firstContact:1,breakShot:false,calledBall:1,calledPocket:'TR'};
 const wrong=adjudicate({...base,pocketEvents:[{id:1,pocketId:'TL'}]});
 assert.equal(wrong.keepTurn,false);
 assert.equal(wrong.newGroup,null);
 assert.equal(wrong.foul,false);
 const right=adjudicate({...base,pocketEvents:[{id:1,pocketId:'TR'}]});
 assert.equal(right.keepTurn,true);
});
test('slopped group balls stay pocketed but do not earn a repeat shot',()=>{
 const balls=[ball(0,100,200),ball(2,250,200),ball(8,300,250)];
 balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:false,stripes:false},
  pocketed:[2],firstContact:2,breakShot:false,calledBall:1,calledPocket:'TM',pocketEvents:[{id:2,pocketId:'TM'}]});
 assert.equal(result.keepTurn,false);
 assert.equal(result.foul,false);
 assert.match(result.reason,/Slop/);
});
test('8 in wrong called pocket loses despite otherwise legal first hit',()=>{
 const balls=[ball(0,100,200),ball(8,250,200)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:['solids','stripes'],deployed:{solids:true,stripes:true},
  pocketed:[8],firstContact:8,breakShot:false,preShotReadyForEight:true,
  calledBall:8,calledPocket:'TR',pocketEvents:[{id:8,pocketId:'TL'}]});
 assert.equal(result.winner,1);
});
test('break is exempt from called pockets, with open groups after pocket',()=>{
 const balls=[ball(0,100,200),ball(2,250,200)];balls[1].pocketed=true;
 const result=adjudicate({balls,shooter:0,groups:[null,null],deployed:{solids:false,stripes:false},
  pocketed:[2],firstContact:2,breakShot:true,pocketEvents:[{id:2,pocketId:'TL'}]});
 assert.equal(result.keepTurn,true);
 assert.equal(result.newGroup,null);
});

test('angled rubber pocket facings reflect WPA corner and side cuts',()=>{
 // Facings are paired per pocket in order, with horizontal edges pointing
 // toward the mouth. 142° corner corresponds to a 38° bevel turn;
 // 104° side corresponds to a 76° bevel turn.
 const angle=(f)=>Math.atan2(Math.abs(f.y2-f.y1),Math.abs(f.x2-f.x1))*180/Math.PI;
 assert.ok(Math.abs(180-angle(facings[0])-142)<2);
 assert.ok(Math.abs(180-angle(facings[2])-104)<2);
 assert.equal(facings.length,12);
});

test('7, 8, 9 foot tables change only the bed size; balls and pocket widths stay physical',()=>{
 const expected={7:[78,39],8:[88,44],9:[100,50]};
 const references={pockets,cushions,facings,jaws};
 try{
  for(const [size,[length,width]] of Object.entries(expected)){
   setTableSize(Number(size));
   assert.equal(TABLE.size,Number(size));
   assert.equal(TABLE.playingLengthIn,length);
   assert.equal(TABLE.playingWidthIn,width);
   assert.ok(Math.abs((TABLE.width-2*TABLE.radius)/PX_PER_IN-length)<1e-8);
   assert.ok(Math.abs((TABLE.height-2*TABLE.radius)/PX_PER_IN-width)<1e-8);
   assert.equal(2*TABLE.radius/PX_PER_IN,BALL_DIAMETER_IN);
   assert.equal(TABLE.playingLengthIn/TABLE.playingWidthIn,2);
   assert.ok(Math.abs(mouthWidth(pockets[0])/PX_PER_IN-CORNER_MOUTH_IN)<1e-9);
   assert.ok(Math.abs(mouthWidth(pockets[1])/PX_PER_IN-SIDE_MOUTH_IN)<1e-9);
   assert.equal(pockets.length,6);assert.equal(cushions.length,6);
   assert.equal(jaws.length,12);assert.equal(facings.length,12);
   assert.equal(pockets.find(p=>p.id==='TR').x,TABLE.width);
   assert.equal(pockets.find(p=>p.id==='BR').y,TABLE.height);
   assert.strictEqual(pockets,references.pockets,'shared pockets array stays connected to game');
   assert.strictEqual(cushions,references.cushions,'shared cushions array stays connected to game');
   assert.strictEqual(facings,references.facings,'shared facing array stays connected to game');
   assert.strictEqual(jaws,references.jaws,'shared jaw array stays connected to physics');
   const balls=rack(),cue=balls[0];
   assert.equal(balls.length,14);
   assert.ok(Math.abs(cue.y-TABLE.height/2)<1e-8);
   assert.ok(balls.every(b=>b.x>TABLE.radius&&b.x<TABLE.width-TABLE.radius&&b.y>TABLE.radius&&b.y<TABLE.height-TABLE.radius),size+'ft rack must fit inside the rails');
   assert.ok(balls.every((b,i)=>balls.slice(i+1).every(o=>Math.hypot(b.x-o.x,b.y-o.y)>=2*TABLE.radius-0.01)),size+'ft rack must not overlap');
  }
  assert.throws(()=>setTableSize(6),RangeError);
 }finally{setTableSize(9);}
});
test('each table size has working six pockets, rails and full rack break',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   for(const p of pockets){
    const b=ball(1,p.kind==='side'?p.x:p.x+p.sx*65,p.kind==='side'?p.y+p.sy*80:p.y+p.sy*65);
    if(p.kind==='side')b.vy=-p.sy*450;
    else {b.vx=-p.sx*320;b.vy=-p.sy*320;}
    const balls=[b],events=[];
    for(let i=0;i<120&&!b.pocketed;i++)events.push(...step(balls).pocketEvents);
    assert.equal(b.pocketed,true,size+'ft '+p.id+' must capture ball');
    assert.deepEqual(events,[{id:1,pocketId:p.id}]);
   }
   // At midtable the side pocket is open. Bank elsewhere along the long rail.
   const b=ball(0,TABLE.width*0.4,65),balls=[b];b.vy=-500;
   let bounced=false;
   for(let i=0;i<100;i++){step(balls);bounced ||= b.vy>0;}
   assert.equal(bounced,true,size+'ft long-cushion rebound');
   const rackBalls=rack();rackBalls[0].vx=1100;let contacts=0;
   for(let i=0;i<280;i++)contacts+=step(rackBalls).contacts.length;
   assert.ok(contacts>=5,size+'ft break must hit rack');
   assert.ok(rackBalls.every(b=>b.pocketed||[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  }
 }finally{setTableSize(9);}
});
