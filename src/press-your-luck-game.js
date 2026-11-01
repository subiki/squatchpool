import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {createShotLifecycle,createCuePlacement} from './shot-lifecycle.js';
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {createTableRenderer} from './table-renderer.js';
import {groupOf} from './rules.js';
import {newMatch,validateTargetScore} from './press-your-luck-score.js';
import {pressTurn,pressEligible,qualifiesEightBankKick} from './press-your-luck-turn.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let shotCall=0,shotPocket='',shotBank=false,match,balls=[],turn=0,groups=[null,null],angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0;
const callBall=$('call-ball'),callPocket=$('call-pocket');
const telemetry=createGameTelemetry('press-your-luck');
const shot=createShotLifecycle();
const cuePlacement=createCuePlacement({getBalls:()=>balls,getCue:cue});
let statsRackId=null,statsShotId=null;
function message(s){$('status').textContent=s;}
function rack(){
 setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;
 balls=fullRack();Object.assign(balls[0],kitchenPoint(TABLE.width*.18,TABLE.height/2));turn=match.breaker;groups=[null,null];shot.startRack();angle=0;events=[];acc=0;previous=0;statsRackId=newGameStatsId();statsShotId=null;
 $('power').value='85';$('spin-top').value='0';$('spin-side').value='0';$('bank').checked=false;callBall.value='';callPocket.value='';
 $('place').hidden=true;document.querySelector('.kit-more')?.removeAttribute('open');$('next').hidden=true;message('Rack '+match.rack+' · Player '+(turn+1)+' breaks. Drag the cue ball in the kitchen, aim and press BREAK.');update();
}
function update(){
 $('score').textContent='Player 1: '+match.scores[0]+' · Player 2: '+match.scores[1]+' · Target '+match.targetScore;
 $('bonus').textContent='Provisional: '+match.bonus[0]+' · '+match.bonus[1]+' · Groups: '+(groups[0]||'open')+' / '+(groups[1]||'open');
 const selectedCall=callBall.value;
 const options=balls.filter(b=>!b.pocketed&&b.id);
 callBall.replaceChildren(new Option('Choose ball',''),...options.map(b=>new Option(String(b.id),String(b.id))));
 if(options.some(b=>String(b.id)===selectedCall))callBall.value=selectedCall;
 $('shoot').disabled=shot.phase!=='aim'||(!shot.breakShot&&!callReady());$('shoot').textContent=shot.breakShot?'BREAK':'SHOOT';
 const placing=shot.phase==='place';$('place').hidden=!placing;$('place').disabled=!placing;$('place').textContent='Confirm cue placement';
 $('break-reposition').hidden=true;
 // Keep call selection on the felt; dropdowns remain an accessible fallback.
 updateCallHint();
}
function begin(){
 try{match=newMatch({targetScore:validateTargetScore($('target').value)});}catch(e){message(e.message);return;}
 $('history').replaceChildren();rack();
}
function cue(){return balls.find(b=>b.id===0);}
const renderer=createTableRenderer({table:TABLE,pockets,cushions,renderPocket});
function draw(){
 renderer.drawTable(ctx,balls);
 drawCallTargets();
 if(shot.phase==='aim'&&(shot.breakShot||callReady()))renderer.drawAim(ctx,cue(),angle);
}

const callReady=()=>Boolean($('call-ball').value&&$('call-pocket').value);
function updateCallHint(){
 const hint=$('table-call-hint');if(!hint)return;
 $('shoot').disabled=shot.phase!=='aim'||(!shot.breakShot&&!callReady());
 $('undo-call').disabled=shot.phase!=='aim'||shot.breakShot||!($('call-ball').value||$('call-pocket').value);
 const called=$('call-ball').value,pocket=pockets.find(p=>p.id===$('call-pocket').value);
 hint.textContent=shot.phase==='place'?'Place and confirm the cue ball first.':
  shot.phase!=='aim'?'Shot in progress or rack complete.':
  shot.breakShot?'Break: aim and shoot. No call needed.':
  !called?'1. Tap a ball on the table to call it.':
  !pocket?'2. Tap a glowing pocket on the table.':
  'Called '+called+' to '+pocket.label+'. Aim and tap SHOOT.';
}
function drawCallTargets(){
 if(shot.phase!=='aim'||shot.breakShot)return;
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
 if(shot.phase!=='aim'||shot.breakShot)return false;
 const scale=Math.max(canvas.width/(canvas.clientWidth||canvas.width),canvas.height/(canvas.clientHeight||canvas.height));
 // The six glowing pocket buttons are the touch targets, not just the
 // pocket mouths. Once a ball is called, prioritize them over nearby balls.
 if($('call-ball').value){
  const hit=Math.max(TABLE.radius*1.6,Math.min(22*scale,TABLE.radius*2.8));
  const target=pockets.map(p=>{
   const px=p.kind==='side'?p.x:p.x+p.sx*TABLE.radius*1.65;
   const py=p.y+p.sy*TABLE.radius*1.65;
   return {p,d:Math.min(Math.hypot(px-x,py-y),Math.hypot(p.x-x,p.y-y))};
  }).sort((a,b)=>a.d-b.d)[0];
  if(target&&target.d<=hit){
   $('call-pocket').value=target.p.id;
   message('Called '+$('call-ball').value+' to '+target.p.label+'. Aim and SHOOT.');
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
function endShot(){
 const madeCount=new Set(events.filter(e=>e.type==='pocket'&&e.ballId>0).map(e=>e.ballId)).size;
 if(madeCount)telemetry.balls(statsRackId,statsShotId,madeCount);
 const ids=events.filter(e=>e.type==='pocket').map(e=>e.ballId);
 const scratch=ids.includes(0);
 const called=shotCall,pocket=shotPocket;
 const made=events.some(e=>e.type==='pocket'&&e.ballId===called&&e.pocketId===pocket);
 const eightMade=events.some(e=>e.type==='pocket'&&e.ballId===8&&e.pocketId===pocket);
 const illegalEight=ids.includes(8)&&(!eightMade||called!==8);
 const legalCall=shot.breakShot||made||!ids.some(id=>id!==0);
 const assignment=!groups[turn]&&!shot.breakShot&&made&&groupOf(called)&&!scratch&&firstContact!==null&&groupOf(firstContact)===groupOf(called);
 if(assignment){groups[turn]=groupOf(called);groups[1-turn]=groups[turn]==='solids'?'stripes':'solids';}
 const eligible=pressEligible(preBalls,groups[turn]);
 const legalFirst=shot.breakShot?firstContact!==null:!groups[turn]?Boolean(groupOf(firstContact)):eligible?firstContact===8||Boolean(groupOf(firstContact)):groupOf(firstContact)===groups[turn];
 const result=pressTurn({match,balls:preBalls,groups,shooter:turn,shotEvents:events,breakShot:shot.breakShot,legalShot:Boolean(legalFirst)&&!illegalEight&&legalCall,eightAttempt:called===8&&!ids.includes(8),bankOrKick:qualifiesEightBankKick(events,{declared:shotBank,calledBall:called,calledPocket:pocket}),calledShotMade:made});
 match=result.match;
 if(result.respotEight){const b=balls.find(b=>b.id===8);const p=findPlacement(balls.filter(other=>other.id!==8),{x:TABLE.width/2,y:TABLE.height/2});if(p){Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});}else{message('No room to respot the 8.');shot.settle({done:true});update();return;}}
 if(result.finish){
  const li=document.createElement('li');li.textContent='Rack '+(match.finished?match.rack:match.rack-1)+': Player '+(result.winner+1)+' wins '+match.lastRack.awarded+' points';$('history').prepend(li);
  shot.settle({done:true});$('next').hidden=match.finished;
  message(match.finished?'Player '+(match.winner+1)+' wins the match!':'Rack over. Player '+(result.winner+1)+' breaks next.');update();return;
 }
 turn=result.nextPlayer;
 if(scratch||result.ballInHand){cue().pocketed=false;cue().vx=cue().vy=cue().wx=cue().wy=cue().wz=0;cue().motion='stationary';const p=findPlacement(balls.filter(b=>b.id!==0));if(p)Object.assign(cue(),p);shot.settle({ballInHand:true});message('Player '+(turn+1)+' has ball in hand. Tap a clear position and confirm.');}
 else{shot.settle();message('Player '+(turn+1)+' to shoot. '+(result.match.bonus[turn]?'Pressing bonus at risk.':''));}
 $('bank').checked=false;callBall.value='';callPocket.value='';update();
}
function frame(t){
 // Preserve shot simulation time on low-FPS phones; catch up over later frames
 // without advancing an unbounded number of 120 Hz steps in one paint.
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
    // A time-limited shot must not hand off the turn with moving balls.
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
function tablePoint(e){
 const box=canvas.getBoundingClientRect();
 return {x:(e.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth,
         y:(e.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight};
}
function aimPointer(e,allowCall=false){
 if(!['aim','place'].includes(shot.phase))return;
 const {x,y}=tablePoint(e);
 if(shot.phase==='place'){
  $('notice').textContent=cuePlacement.placeBallInHand({x,y})?'Cue position valid. Confirm placement.':'Cue overlaps a ball or rail. Choose an open spot.';
  draw();return;
 }
 if(allowCall&&pickTableCall(x,y))return;
 if(!shot.breakShot&&!callReady())return;
 const next=angleFromPointer(cue(),{x,y},$('invert-aim').checked,TABLE.radius);
 if(next!==null)angle=next;
}
canvas.addEventListener('pointerdown',e=>{
 canvas.setPointerCapture(e.pointerId);
 if(shot.phase==='aim'&&shot.breakShot&&cuePlacement.pointerDown(tablePoint(e))){update();return;}
 aimPointer(e,true);
});
canvas.addEventListener('pointermove',e=>{
 if(!e.buttons)return;
 if(shot.breakShot&&cuePlacement.pointerMove(tablePoint(e))){update();return;}
 aimPointer(e,false);
});
canvas.addEventListener('pointerup',()=>{
 if(cuePlacement.pointerUp()){message('Cue positioned. Aim and press BREAK.');update();}
});
canvas.addEventListener('pointercancel',()=>{cuePlacement.pointerUp();});
$('shoot').onclick=()=>{if(shot.phase!=='aim')return;if(!shot.breakShot&&!callReady()){message('Tap a ball and glowing pocket on the table, or use the call drawer.');return;}shotCall=Number(callBall.value);shotPocket=callPocket.value;shotBank=$('bank').checked;preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;statsShotId=newGameStatsId();if(shot.breakShot)telemetry.rack(statsRackId);const b=cue(),v=shotSpeed(Number($('power').value),shot.breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;applyCueSpin(b,Number($('spin-top').value)/100,Number($('spin-side').value)/100);$('power').value='68';$('spin-top').value='0';$('spin-side').value='0';shot.startShot();$('shoot').disabled=true;};
$('place').onclick=()=>{if(shot.confirmPlacement()){message('Player '+(turn+1)+' to shoot.');update();}};
$('call-ball').addEventListener('change',()=>{callPocket.value='';updateCallHint();});
$('call-pocket').addEventListener('change',updateCallHint);
$('undo-call').onclick=()=>{if(shot.phase!=='aim'||shot.breakShot)return;callBall.value='';callPocket.value='';message('Call cleared. Tap a ball to call a new shot.');updateCallHint();};
$('next').onclick=rack;$('start').onclick=begin;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
begin();requestAnimationFrame(frame);
