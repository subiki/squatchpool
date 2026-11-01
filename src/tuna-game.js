import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {tablePoint as pointerToTable} from './table-pointer.js';
import {createShotLifecycle,createCuePlacement} from './shot-lifecycle.js';
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {tunaTargets,tunaRackOrder,tunaJudgeShot} from './tuna-rules.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let balls=[],turn=0,money=[0,0],angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0,shotCall=0,shotPocket='';
let nextBreaker=0,rackNumber=0;
const cue=()=>balls.find(b=>b.id===0);
const shot=createShotLifecycle();
const cuePlacement=createCuePlacement({getBalls:()=>balls,getCue:cue});
const telemetry=createGameTelemetry('tuna');
let statsRackId=null,statsShotId=null;
function message(s){$('status').textContent=s;}
function rack(){rackNumber++;setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;balls=fullRack();Object.assign(cue(),kitchenPoint(TABLE.width*.18,TABLE.height/2));const order=tunaRackOrder();balls.filter(b=>b.id>0).forEach((b,i)=>b.id=order[i]);turn=nextBreaker;shot.startRack();angle=0;events=[];previous=0;acc=0;statsRackId=newGameStatsId();statsShotId=null;$('power').value='85';$('spin-top').value='0';$('spin-side').value='0';$('call-ball').value='';$('call-pocket').value='';message('Rack '+rackNumber+' · Player '+(turn+1)+' breaks. Drag the cue ball in the kitchen, aim and press BREAK. No call needed on the break.');update();}
function resetMatch(){money=[0,0];nextBreaker=0;rackNumber=0;$('history').replaceChildren();rack();}
function update(){
 $('start').disabled=shot.phase!=='done';
 $('turn').textContent='Player '+(turn+1)+' to '+(shot.phase==='place'?'place cue ball':shot.phase==='done'?'celebrate':'shoot');
 $('money').textContent='Player 1: $'+money[0]+' · Player 2: $'+money[1];
 $('targets').textContent='Legal first contact: '+tunaTargets(balls).join(' or ');
 const selectedCall=$('call-ball').value;
 const callOptions=balls.filter(b=>b.id>0&&!b.pocketed);
 $('call-ball').replaceChildren(new Option('Choose ball',''),...callOptions.map(b=>new Option(String(b.id),String(b.id))));
 if(callOptions.some(b=>String(b.id)===selectedCall))$('call-ball').value=selectedCall;
 $('shoot').disabled=shot.phase!=='aim';$('shoot').textContent=shot.breakShot?'BREAK':'SHOOT';
 const placing=shot.phase==='place';
 $('place').hidden=!placing;$('place').disabled=!placing;
 $('place').textContent='Confirm cue placement';
 $('break-reposition').hidden=true;
 // Keep the shot call on the table; the drawer is an accessible fallback.
 updateCallHint();
}
function draw(){const {width:w,height:h,radius:r}=TABLE;ctx.fillStyle='#155f49';ctx.fillRect(0,0,w,h);ctx.fillStyle='#76563a';ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);for(const p of pockets)renderPocket(ctx,p);ctx.strokeStyle='#c59a61';ctx.lineWidth=2;ctx.beginPath();for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}ctx.stroke();for(const b of balls){if(b.pocketed)continue;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fillStyle=b.id===0?'#fff':b.id===8?'#111':b.id<=7?'#ddac4b':'#477fc0';ctx.fill();ctx.strokeStyle='#ffffff99';ctx.stroke();if(b.id){ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(b.id,b.x,b.y);}}drawCallTargets();if(shot.phase==='aim'&&(shot.breakShot||callReady())){const b=cue(),dx=Math.cos(angle),dy=Math.sin(angle);ctx.strokeStyle='#f4e1a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+dx*r,b.y+dy*r);ctx.lineTo(b.x+dx*240,b.y+dy*240);ctx.stroke();ctx.strokeStyle='#d6aa70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-dx*(r+15),b.y-dy*(r+15));ctx.lineTo(b.x-dx*(r+140),b.y-dy*(r+140));ctx.stroke();}}
const callReady=()=>Boolean($('call-ball').value&&$('call-pocket').value);
function updateCallHint(){
 const undo=$('undo-call');
 undo.hidden=shot.phase!=='aim'||!($('call-ball').value||$('call-pocket').value);
 undo.disabled=shot.phase!=='aim';
 const hint=$('table-call-hint');if(!hint)return;
 const called=$('call-ball').value,pocket=pockets.find(p=>p.id===$('call-pocket').value);
 hint.textContent=shot.phase==='place'?'Place and confirm the cue ball first.':
  shot.phase!=='aim'?'Shot in progress or rack complete.':
  shot.breakShot&&!called?'Break: aim and shoot. No call needed.':
  !called?'1. Tap a ball on the table to call it.':
  !pocket?'2. Tap a glowing pocket on the table.':
  'Called '+called+' to '+pocket.label+'. Aim and tap '+(shot.breakShot?'BREAK.':'SHOOT.');
}
function drawCallTargets(){
 if(shot.phase!=='aim')return;
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
 if(shot.phase!=='aim')return false;
 // A pocket is a visible button once a ball is called. Check it before the
 // generous ball touch radius so balls near a pocket cannot steal the tap.
 const scale=Math.max(canvas.width/(canvas.clientWidth||canvas.width),canvas.height/(canvas.clientHeight||canvas.height));
 if($('call-ball').value){
  const hit=Math.max(TABLE.radius*1.6,Math.min(22*scale,TABLE.radius*2.8));
  const target=pockets.map(p=>{
   const px=p.kind==='side'?p.x:p.x+p.sx*TABLE.radius*1.65;
   const py=p.y+p.sy*TABLE.radius*1.65;
   return {p,d:Math.min(Math.hypot(px-x,py-y),Math.hypot(p.x-x,p.y-y))};
  }).sort((a,b)=>a.d-b.d)[0];
  if(target&&target.d<=hit){
   $('call-pocket').value=target.p.id;
   message('Called '+$('call-ball').value+' to '+target.p.label+'. Aim and '+(shot.breakShot?'BREAK.':'SHOOT.'));
   updateCallHint();return true;
  }
 }
 const hit=Math.max(TABLE.radius*1.8,22*scale);
 const b=balls.filter(b=>b.id>0&&!b.pocketed).map(b=>({ball:b,d:Math.hypot(b.x-x,b.y-y)})).sort((a,b)=>a.d-b.d)[0];
 if(b&&b.d<=hit){
  $('call-ball').value=String(b.ball.id);$('call-pocket').value='';
  message('Called ball '+b.ball.id+'. Tap a glowing pocket on the table.');
  updateCallHint();return true;
 }
 return false;
}
function spot(id){const b=balls.find(b=>b.id===id);if(!b)return;const p=findPlacement(balls.filter(other=>other.id!==id),{x:TABLE.width*.7,y:TABLE.height/2});if(p)Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});else throw new Error('Cannot spot ball '+id+' on this layout.');}
function endShot(){
 const madeCount=new Set(events.filter(e=>e.type==='pocket'&&e.ballId>0).map(e=>e.ballId)).size;
 if(madeCount)telemetry.balls(statsRackId,statsShotId,madeCount);
 const pocketEvents=events.filter(e=>e.type==='pocket'),pocketed=pocketEvents.map(e=>e.ballId),scratch=pocketed.includes(0);
 const result=tunaJudgeShot({balls:preBalls,firstContact,pocketed,calledBall:shotCall,calledPocket:shotPocket,pocketEvents,scratch});
 try{for(const id of result.spotted)spot(id);}catch(error){shot.settle({done:true});message(error.message+' Start a new rack.');update();return;}
 money[turn]+=result.payout;
 const li=document.createElement('li');li.textContent='Player '+(turn+1)+': '+(result.foul?'Foul':result.winning?'Wins the rack':result.credited.length?'Made '+result.credited.join(', '):'Miss')+(result.payout?' · $'+result.payout:'');$('history').prepend(li);
 if(result.winning){nextBreaker=turn;shot.settle({done:true});message('Player '+(turn+1)+' wins Big Tuna Casserole! Start a new rack to play again.');update();return;}
 if(!result.keepTurn)turn=1-turn;
 if(result.ballInHand){const b=cue();Object.assign(b,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});const p=findPlacement(balls.filter(other=>other.id!==0));if(!p){shot.settle({done:true});message('No legal cue-ball placement available. Start a new rack.');update();return;}Object.assign(b,p);shot.settle({ballInHand:true});message('Foul. Player '+(turn+1)+' has ball in hand. Tap a clear position, then confirm.');}
 else{shot.settle();message(result.keepTurn?'Good shot. Keep shooting.':'Player '+(turn+1)+' to shoot.');}
 $('call-ball').value='';$('call-pocket').value='';update();
}
function frame(t){
 // Keep simulation time on slower Android frames rather than dropping it.
 // The bounded backlog lets a busy frame catch up over subsequent paints.
 const elapsed=previous?Math.min(.25,Math.max(0,(t-previous)/1000)):0;
 previous=t;
 if(shot.phase==='moving'){
  acc=Math.min(.35,acc+elapsed);
  let n=0;
  while(acc>=1/120&&n++<24){
   const outcome=step(balls,1/120);
   events.push(...outcome.shotEvents);
   if(firstContact===null){
    const hit=outcome.shotEvents.find(e=>e.type==='contact'&&e.balls.includes(0));
    if(hit)firstContact=hit.balls.find(id=>id!==0);
   }
   acc-=1/120;
   shotElapsed+=1/120;
   still=stationary(balls)?still+1:0;
   if(still>20||shotElapsed>20){
    // Never hand control back while the physics objects are still moving.
    if(shotElapsed>20)for(const b of balls)if(!b.pocketed)
     Object.assign(b,{vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});
    acc=0;
    endShot();
    break;
   }
  }
 }
 draw();
 requestAnimationFrame(frame);
}
const tablePoint=e=>pointerToTable(canvas,e);

function pointer(e,allowCall=false){
 if(!['aim','place'].includes(shot.phase))return;
 const {x,y}=tablePoint(e);
 if(shot.phase==='place'){
  message(cuePlacement.placeBallInHand({x,y})?'Valid cue position. Confirm placement.':'Choose a clear cue position.');
  return;
 }
 if(allowCall&&pickTableCall(x,y))return;
 if(!shot.breakShot&&!callReady())return;
 const a=angleFromPointer(cue(),{x,y},$('invert-aim').checked,TABLE.radius);
 if(a!==null)angle=a;
}
canvas.addEventListener('pointerdown',e=>{
 canvas.setPointerCapture(e.pointerId);
 if(shot.phase==='aim'&&shot.breakShot&&cuePlacement.pointerDown(tablePoint(e))){update();return;}
 pointer(e,true);
});
canvas.addEventListener('pointermove',e=>{
 if(!e.buttons)return;
 if(shot.breakShot&&cuePlacement.pointerMove(tablePoint(e))){update();return;}
 pointer(e,false);
});
canvas.addEventListener('pointerup',()=>{
 if(cuePlacement.pointerUp()){message('Cue positioned. Aim and press BREAK.');update();}
});
canvas.addEventListener('pointercancel',()=>{cuePlacement.pointerUp();});
$('shoot').onclick=()=>{
 if(shot.phase!=='aim')return;
 if(!shot.breakShot&&!callReady()){
  document.querySelector('.kit-more')?.setAttribute('open','');
  message('Tap a ball and pocket on the table, or use the call drawer before shooting.');
  (!$('call-ball').value?$('call-ball'):$('call-pocket')).focus();return;
 }
 shotCall=Number($('call-ball').value);shotPocket=$('call-pocket').value;
 preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;
 statsShotId=newGameStatsId();if(shot.breakShot)telemetry.rack(statsRackId);
 const b=cue(),v=shotSpeed(Number($('power').value),shot.breakShot);
 b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;
 applyCueSpin(b,Number($('spin-top').value)/100,Number($('spin-side').value)/100);
 $('power').value='68';$('spin-top').value='0';$('spin-side').value='0';
 shot.startShot();$('shoot').disabled=true;
};
$('place').onclick=()=>{if(shot.confirmPlacement()){message('Player '+(turn+1)+' to shoot.');update();}};
$('call-ball').addEventListener('change',()=>{$('call-pocket').value='';updateCallHint();});
$('call-pocket').addEventListener('change',updateCallHint);
$('undo-call').onclick=()=>{if(shot.phase!=='aim')return;$('call-ball').value='';$('call-pocket').value='';message('Call cleared. Tap a ball to choose a new shot.');updateCallHint();};
$('start').onclick=()=>{if(shot.phase==='done')rack();};
$('reset-match').onclick=resetMatch;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
resetMatch();requestAnimationFrame(frame);
