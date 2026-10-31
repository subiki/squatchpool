import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {tunaTargets,tunaRackOrder,tunaJudgeShot} from './tuna-rules.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let balls=[],turn=0,money=[0,0],phase='ready',angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0,breakShot=true,breakPlacementValid=false,shotCall=0,shotPocket='';
let nextBreaker=0;
const cue=()=>balls.find(b=>b.id===0);
const telemetry=createGameTelemetry('tuna');
let statsRackId=null,statsShotId=null;
function message(s){$('status').textContent=s;}
function rack(){setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;balls=fullRack();Object.assign(cue(),kitchenPoint(TABLE.width*.18,TABLE.height/2));const order=tunaRackOrder();balls.filter(b=>b.id>0).forEach((b,i)=>b.id=order[i]);turn=nextBreaker;phase='placeBreak';breakShot=true;breakPlacementValid=false;angle=0;events=[];previous=0;acc=0;statsRackId=newGameStatsId();statsShotId=null;$('history').replaceChildren();$('power').value='85';$('spin-top').value='0';$('spin-side').value='0';$('call-ball').value='';$('call-pocket').value='';message('Player '+(turn+1)+' breaks. Place the cue ball in the kitchen and confirm, then call a ball and pocket before BREAK.');update();}
function resetMatch(){money=[0,0];nextBreaker=0;rack();}
function update(){
 $('turn').textContent='Player '+(turn+1)+' to '+(phase==='placeBreak'?'place break cue ball':phase==='place'?'place cue ball':phase==='done'?'celebrate':'shoot');
 $('money').textContent='Player 1: $'+money[0]+' · Player 2: $'+money[1];
 $('targets').textContent='Legal first contact: '+tunaTargets(balls).join(' or ');
 const selectedCall=$('call-ball').value;
 const callOptions=balls.filter(b=>b.id>0&&!b.pocketed);
 $('call-ball').replaceChildren(new Option('Choose ball',''),...callOptions.map(b=>new Option(String(b.id),String(b.id))));
 if(callOptions.some(b=>String(b.id)===selectedCall))$('call-ball').value=selectedCall;
 $('shoot').disabled=phase!=='aim';$('shoot').textContent=breakShot?'BREAK':'SHOOT';
 const placing=phase==='place'||phase==='placeBreak';
 $('place').hidden=!placing;$('place').disabled=!placing||(phase==='placeBreak'&&!breakPlacementValid);
 $('place').textContent=phase==='placeBreak'?'Confirm break position':'Confirm cue placement';
 $('break-reposition').hidden=!(breakShot&&phase==='aim');
 // Keep the shot call on the table; the drawer is an accessible fallback.
 updateCallHint();
}
function draw(){const {width:w,height:h,radius:r}=TABLE;ctx.fillStyle='#155f49';ctx.fillRect(0,0,w,h);ctx.fillStyle='#76563a';ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);for(const p of pockets)renderPocket(ctx,p);ctx.strokeStyle='#c59a61';ctx.lineWidth=2;ctx.beginPath();for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}ctx.stroke();for(const b of balls){if(b.pocketed)continue;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fillStyle=b.id===0?'#fff':b.id===8?'#111':b.id<=7?'#ddac4b':'#477fc0';ctx.fill();ctx.strokeStyle='#ffffff99';ctx.stroke();if(b.id){ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(b.id,b.x,b.y);}}drawCallTargets();if(phase==='aim'&&callReady()){const b=cue(),dx=Math.cos(angle),dy=Math.sin(angle);ctx.strokeStyle='#f4e1a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+dx*r,b.y+dy*r);ctx.lineTo(b.x+dx*240,b.y+dy*240);ctx.stroke();ctx.strokeStyle='#d6aa70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-dx*(r+15),b.y-dy*(r+15));ctx.lineTo(b.x-dx*(r+140),b.y-dy*(r+140));ctx.stroke();}}
const callReady=()=>Boolean($('call-ball').value&&$('call-pocket').value);
function updateCallHint(){
 const hint=$('table-call-hint');if(!hint)return;
 const called=$('call-ball').value,pocket=pockets.find(p=>p.id===$('call-pocket').value);
 hint.textContent=phase==='placeBreak'?'Place and confirm the break cue ball first.':
  phase==='place'?'Place and confirm the cue ball first.':
  phase!=='aim'?'Shot in progress or rack complete.':
  !called?'1. Tap a ball on the table to call it.':
  !pocket?'2. Tap a glowing pocket on the table.':
  'Called '+called+' to '+pocket.label+'. Aim and tap '+(breakShot?'BREAK.':'SHOOT.');
}
function drawCallTargets(){
 if(phase!=='aim')return;
 const called=Number($('call-ball').value);
 if(!called)return;
 const b=balls.find(ball=>ball.id===called&&!ball.pocketed);
 ctx.save();ctx.strokeStyle='#ffe19b';ctx.lineWidth=3;
 if(b){ctx.beginPath();ctx.arc(b.x,b.y,TABLE.radius*1.55,0,Math.PI*2);ctx.stroke();}
 if(!$('call-pocket').value){
  pockets.forEach((p,i)=>{
   const x=p.kind==='side'?p.x:p.x+p.sx*TABLE.radius*1.65;
   const y=p.y+p.sy*TABLE.radius*1.65;
   ctx.beginPath();ctx.arc(x,y,TABLE.radius*1.6,0,Math.PI*2);
   ctx.fillStyle='#f4cc78';ctx.fill();ctx.strokeStyle='#16382a';ctx.stroke();
   ctx.fillStyle='#173225';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y);
  });
 }
 ctx.restore();
}
function pickTableCall(x,y){
 if(phase!=='aim')return false;
 // Translate a finger-sized hit target into table coordinates at any zoom/size.
 const scale=Math.max(canvas.width/(canvas.clientWidth||canvas.width),canvas.height/(canvas.clientHeight||canvas.height));
 const hit=Math.max(TABLE.radius*1.8,22*scale);
 const b=balls.filter(b=>b.id>0&&!b.pocketed).map(b=>({ball:b,d:Math.hypot(b.x-x,b.y-y)})).sort((a,b)=>a.d-b.d)[0];
 if(b&&b.d<=hit){
  $('call-ball').value=String(b.ball.id);$('call-pocket').value='';
  message('Called ball '+b.ball.id+'. Tap a glowing pocket on the table.');
  updateCallHint();return true;
 }
 if($('call-ball').value){
  const p=pockets.map(p=>({p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];
  if(p&&p.d<=Math.max(TABLE.radius*2.5,26*scale)){
   $('call-pocket').value=p.p.id;
   message('Called '+$('call-ball').value+' to '+p.p.label+'. Aim and '+(breakShot?'BREAK.':'SHOOT.'));
   updateCallHint();return true;
  }
 }
 return false;
}
function spot(id){const b=balls.find(b=>b.id===id);if(!b)return;const p=findPlacement(balls.filter(other=>other.id!==id),{x:TABLE.width*.7,y:TABLE.height/2});if(p)Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});else throw new Error('Cannot spot ball '+id+' on this layout.');}
function endShot(){
 const madeCount=new Set(events.filter(e=>e.type==='pocket'&&e.ballId>0).map(e=>e.ballId)).size;
 if(madeCount)telemetry.balls(statsRackId,statsShotId,madeCount);
 const pocketEvents=events.filter(e=>e.type==='pocket'),pocketed=pocketEvents.map(e=>e.ballId),scratch=pocketed.includes(0);
 const result=tunaJudgeShot({balls:preBalls,firstContact,pocketed,calledBall:shotCall,calledPocket:shotPocket,pocketEvents,scratch});
 try{for(const id of result.spotted)spot(id);}catch(error){phase='done';message(error.message+' Start a new rack.');update();return;}
 money[turn]+=result.payout;
 const li=document.createElement('li');li.textContent='Player '+(turn+1)+': '+(result.foul?'Foul':result.winning?'Wins the rack':result.credited.length?'Made '+result.credited.join(', '):'Miss')+(result.payout?' · $'+result.payout:'');$('history').prepend(li);
 breakShot=false;
 if(result.winning){nextBreaker=turn;phase='done';message('Player '+(turn+1)+' wins Big Tuna Casserole! Start a new rack to play again.');update();return;}
 if(!result.keepTurn)turn=1-turn;
 if(result.ballInHand){const b=cue();Object.assign(b,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});const p=findPlacement(balls.filter(other=>other.id!==0));if(!p){phase='done';message('No legal cue-ball placement available. Start a new rack.');update();return;}Object.assign(b,p);phase='place';message('Foul. Player '+(turn+1)+' has ball in hand. Tap a clear position, then confirm.');}
 else{phase='aim';message(result.keepTurn?'Good shot. Keep shooting.':'Player '+(turn+1)+' to shoot.');}
 $('call-ball').value='';$('call-pocket').value='';update();
}
function frame(t){const elapsed=previous?Math.min(.08,(t-previous)/1000):0;previous=t;if(phase==='moving'){acc+=elapsed;let n=0;while(acc>=1/120&&n++<12){const outcome=step(balls,1/120);events.push(...outcome.shotEvents);if(firstContact===null){const hit=outcome.shotEvents.find(e=>e.type==='contact'&&e.balls.includes(0));if(hit)firstContact=hit.balls.find(id=>id!==0);}acc-=1/120;shotElapsed+=1/120;still=stationary(balls)?still+1:0;if(still>20||shotElapsed>20){endShot();break;}}}draw();requestAnimationFrame(frame);}
function pointer(e){if(!['aim','place','placeBreak'].includes(phase))return;const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth,y=(e.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight;
 if(phase==='placeBreak'){
  const p=x>=headStringX()?{x,y}:kitchenPoint(x,y);
  breakPlacementValid=canPlaceBreakCue(balls,p.x,p.y);
  if(breakPlacementValid)Object.assign(cue(),p);
  message(breakPlacementValid?'Break position valid. Confirm placement.':'The entire cue ball must stay behind the head string.');
  update();return;
 }
 if(phase==='place'){if(canPlace(balls,x,y,0)){cue().x=x;cue().y=y;message('Valid cue position. Confirm placement.');}else message('Choose a clear cue position.');return;}if(pickTableCall(x,y))return;if(!callReady())return;const a=angleFromPointer(cue(),{x,y},$('invert-aim').checked,TABLE.radius);if(a!==null)angle=a;}
canvas.addEventListener('pointerdown',e=>{
 canvas.setPointerCapture(e.pointerId);
 // The breaker can drag the cue again until the break is struck.
 if(phase==='aim'&&breakShot){
  const box=canvas.getBoundingClientRect();
  const x=(e.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth;
  const y=(e.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight;
  if(Math.hypot(x-cue().x,y-cue().y)<=TABLE.radius*2.5){phase='placeBreak';breakPlacementValid=false;}
 }
 pointer(e);
});canvas.addEventListener('pointermove',e=>{if(e.buttons)pointer(e);});
$('shoot').onclick=()=>{if(phase!=='aim')return;if(!callReady()){document.querySelector('.kit-more')?.setAttribute('open','');message('Tap a ball and pocket on the table, or use the call drawer before shooting.');(!$('call-ball').value?$('call-ball'):$('call-pocket')).focus();return;}shotCall=Number($('call-ball').value);shotPocket=$('call-pocket').value;preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;statsShotId=newGameStatsId();if(breakShot)telemetry.rack(statsRackId);const b=cue(),v=shotSpeed(Number($('power').value),breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;applyCueSpin(b,Number($('spin-top').value)/100,Number($('spin-side').value)/100);$('power').value='68';$('spin-top').value='0';$('spin-side').value='0';phase='moving';$('shoot').disabled=true;};
$('place').onclick=()=>{
 if(phase==='placeBreak'&&breakPlacementValid){phase='aim';message('Break position confirmed. Call a ball and pocket, aim, then tap BREAK.');update();}
 else if(phase==='place'){phase='aim';message('Player '+(turn+1)+' to shoot.');update();}
};
$('break-reposition').onclick=()=>{if(phase==='aim'&&breakShot){phase='placeBreak';breakPlacementValid=false;message('Tap or drag the cue ball within the kitchen, then confirm.');update();}};
$('call-ball').addEventListener('change',()=>{$('call-pocket').value='';updateCallHint();});
$('call-pocket').addEventListener('change',updateCallHint);
$('start').onclick=rack;
$('reset-match').onclick=resetMatch;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
resetMatch();requestAnimationFrame(frame);
