import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,pockets,cushions,facings,jaws,setTableSize,PLAYING_SURFACES,BALL_DIAMETER_IN,mouthWidth,PX_PER_IN,CORNER_MOUTH_IN,SIDE_MOUTH_IN} from '../src/table-geometry.js';
import {ball,rack,step,canPlace,findPlacement,applyCueSpin,canPlaceBreakCue,headStringX,shotSpeed,kitchenPoint} from '../src/physics.js';
import {METERS_PER_PIXEL,ballCollision,advanceFriction} from '../src/vendor/tailuge-physics.js';
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

test('break cue placement must be behind head string, not on it',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const balls=rack(),head=headStringX(),H=TABLE.height;
   assert.ok(head>TABLE.width*.23&&head<TABLE.width*.27);
   assert.equal(canPlaceBreakCue(balls,head,H/2),false,'on head string not legal');
   assert.equal(canPlaceBreakCue(balls,head+3,H/2),false,'wrong side not legal');
   assert.equal(canPlaceBreakCue(balls,head-10,H/2),true,'just behind string is legal');
   assert.equal(canPlaceBreakCue(balls,Math.round(TABLE.width*.16),H*.45),true);
   assert.equal(canPlaceBreakCue(balls,2,H/2),false,'no cue ball through rail');
   assert.equal(canPlaceBreakCue(balls,head-5,1),false,'rail/pocket placement blocked');
   // Table size changes never displace the regulation head-quarter.
   assert.ok(balls[0].x<head);
  }
 }finally{setTableSize(9);}
});
test('break power targets real speeds, normal shots remain unchanged',()=>{
 assert.ok(shotSpeed(100,true)*METERS_PER_PIXEL>11.4&&shotSpeed(100,true)*METERS_PER_PIXEL<11.6,'powerful 25mph break');
 assert.ok(shotSpeed(68,true)*METERS_PER_PIXEL>8,'normal break spreads the rack');
 assert.ok(shotSpeed(100,true)>shotSpeed(68,true));
 assert.ok(shotSpeed(40,true)<shotSpeed(68,true));
 assert.equal(shotSpeed(68,false),240+11*68,'routine shots remain tuned as before');
});
test('tight regulation rack transmits break energy to the full rack on all sizes',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const balls=rack(),initial=balls.slice(1).map(o=>({x:o.x,y:o.y}));
   const delta=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
   // Triangle rows are nearly touching (rather than current 0.9px gaps).
   assert.ok(delta(balls[1],balls[2])<2*TABLE.radius+0.12);
   assert.ok(delta(balls[2],balls[3])<2*TABLE.radius+0.12);
   assert.ok(delta(balls[1],balls[2])>=2*TABLE.radius);
   balls[0].vx=shotSpeed(100,true);
   let contacts=0;
   for(let i=0;i<240;i++)contacts+=step(balls).contacts.length;
   const moved=balls.slice(1).filter((b,i)=>b.pocketed||
    delta(b,initial[i])>TABLE.radius*2).length;
   assert.ok(contacts>=20,size+'ft high-power rack should transfer momentum');
   assert.ok(moved>=12,size+'ft break should spread nearly all 13 object balls, not just a few');
   assert.ok(balls.every(b=>b.pocketed||[b.x,b.y,b.vx,b.vy,b.wx,b.wy,b.wz].every(Number.isFinite)));
  }
 }finally{setTableSize(9);}
});

test('full kitchen usable up to the rails and head string at 7, 8, and 9 feet',()=>{
 try{
  for(const size of [7,8,9]){
   setTableSize(size);
   const balls=rack(),r=TABLE.radius,head=headStringX();
   const pts=[
    [2*r+0.02,2*r+0.02],[2*r+0.02,TABLE.height-2*r-0.02],
    [head-0.04,2*r+0.02],[head-0.04,TABLE.height-2*r-0.02],
    [head-0.04,TABLE.height/2],[2*r+0.02,TABLE.height/2]
   ];
   for(const [x,y] of pts)assert.equal(canPlaceBreakCue(balls,x,y),true,
    size+'ft needs legal kitchen point '+x+','+y);
   assert.equal(canPlaceBreakCue(balls,head,TABLE.height/2),false,'head string excluded');
   assert.equal(canPlaceBreakCue(balls,2*r-0.02,TABLE.height/2),false,'outside left cushion');
   assert.equal(canPlaceBreakCue(balls,head+0.01,TABLE.height/2),false,'outside kitchen');
   assert.equal(canPlaceBreakCue(balls,head-2,r),false,'within top cushion');
   assert.deepEqual(kitchenPoint(-400,-400),{x:2*r+.02,y:2*r+.02});
   const other=ball(2,head-8,TABLE.height/2);
   assert.equal(canPlaceBreakCue([other],other.x,other.y),false,'cannot overlap existing ball');
  }
 }finally{setTableSize(9);}
});
test('physical pool-ball dimensions and rolling resistance are stable',()=>{
 // One 2.25-inch diameter matches the metre conversion used by Tailuge.
 assert.ok(Math.abs(METERS_PER_PIXEL*22-0.05715)<1e-9);
 // An already-rolling ball on fast cloth should retain meaningful speed
 // over 2 seconds (but still decelerate; no energy injection).
 const b=ball(0,250,100);b.vx=300;
 b.wy=b.vx*METERS_PER_PIXEL/0.028575;
 for(let i=0;i<240;i++)step([b]);
 assert.ok(b.vx>220&&b.vx<300,'rolling ball should travel rather than die early');
});

test('head-on collision transfers momentum and retains regulation collision energy',()=>{
 const cue=ball(0,100,200),object=ball(1,122,200);
 cue.vx=2800;
 const before=cue.vx*cue.vx;
 assert.equal(ballCollision(cue,object),true);
 // Equal-mass collision at coefficient 0.94: an initially still target
 // should receive 97% of incoming velocity; no momentum disappears.
 assert.ok(Math.abs(cue.vx+object.vx-2800)<0.01);
 assert.ok(object.vx>2680&&object.vx<2800);
 const remaining=(cue.vx*cue.vx+object.vx*object.vx)/before;
 assert.ok(remaining>=.93&&remaining<=1.001,
  'contact must not artificially absorb or create cue-ball energy');
});

test('cloth friction: a naturally rolling 0.5 m/s ball stops in ~1.28 m and ~5.1 s',()=>{
 // Dr Dave physical-properties constants: rolling mu=0.01, a=mu*g.
 // 2.25-inch ball and 120 Hz integration, independent of table size/pockets.
 const b=ball(1,0,0),R=.028575,speed=.5,dt=1/120;
 b.vx=speed/METERS_PER_PIXEL;b.wy=speed/R;
 let distanceMeters=0,elapsed=0;
 for(let i=0;i<2000&&b.vx>0;i++){
  advanceFriction(b,dt,5);
  distanceMeters+=b.vx*METERS_PER_PIXEL*dt;elapsed+=dt;
 }
 const predicted=speed*speed/(2*.01*9.8);
 assert.ok(Math.abs(distanceMeters-predicted)<.08,
  `rolling stop distance ${distanceMeters.toFixed(3)}m should approximate ${predicted.toFixed(3)}m`);
 assert.ok(elapsed>4.5&&elapsed<5.5,`rolling time was ${elapsed.toFixed(3)}s`);
 assert.equal(b.motion,'stationary');
});

test('cloth friction: struck stun ball skids briefly before natural roll',()=>{
 // With no initially attached topspin, sliding mu=0.20 should bring a
 // 1 m/s stun ball into roll in ~0.146s after only ~0.125m travel.
 const b=ball(1,0,0),R=.028575,dt=1/120;
 b.vx=1/METERS_PER_PIXEL;b.wx=0;b.wy=0;
 let elapsed=0,slideDistance=0,rolling=false;
 for(let i=0;i<100;i++){
  advanceFriction(b,dt,5);
  slideDistance+=b.vx*METERS_PER_PIXEL*dt;elapsed+=dt;
  if(b.motion==='rolling'){rolling=true;break;}
 }
 assert.ok(rolling,'cloth must turn stun/skid into natural roll');
 assert.ok(elapsed>.11&&elapsed<.20,`skid->roll time was ${elapsed.toFixed(3)}s`);
 assert.ok(slideDistance>.08&&slideDistance<.16,
  `skid->roll distance was ${slideDistance.toFixed(3)}m`);
 const velocity=b.vx*METERS_PER_PIXEL;
 assert.ok(Math.abs(b.wy*R-velocity)<.012,'spin should match forward rolling speed');
});

test('cloth friction: side-spin decays about 5–15 rad/s per second',()=>{
 const b=ball(1,0,0),R=.028575,dt=1/120;
 b.vx=.5/METERS_PER_PIXEL;b.wy=.5/R;b.wz=20;
 for(let i=0;i<120;i++)advanceFriction(b,dt,5);
 const decay=20-b.wz;
 assert.ok(decay>=5&&decay<=15,`vertical spin decay was ${decay.toFixed(2)} rad/s in 1s`);
});
