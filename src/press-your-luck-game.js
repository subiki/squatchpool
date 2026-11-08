import {prepareGamePage} from './game-page-shell.js';
import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {tablePoint as pointerToTable} from './table-pointer.js';
import {createCuePlacement} from './shot-lifecycle.js';
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {createTableRenderer} from './table-renderer.js';
import {newMatch,validateTargetScore,rackScorePreview} from './press-your-luck-score.js';
import {createGameSession} from './game-session.js';
import {attachMatchExitGuard} from './match-navigation.js';
import {attachShotAnnouncer} from './shot-announcer.js';
import {adjudicatePressShot} from './press-shot-adapter.js';
import {planBotShot} from './bot-shot-planner.js';
import {createBotTurnScheduler} from './bot-turn-scheduler.js';
import {groupOf} from './rules.js';
import {mountTableKit} from './table-kit-controls.js';
import {attachShotKeyboard} from './shot-keyboard.js';
const mountedGames=new WeakMap();
export function mountPressGame(root=globalThis.document){
 prepareGamePage(root,'press-your-luck');
 mountedGames.get(root)?.dispose();
 const document=root.ownerDocument||root,cleanups=[];
 let disposed=false,frameId=null;
 const requestAnimationFrame=callback=>{
  if(!disposed)frameId=globalThis.requestAnimationFrame(time=>{if(!disposed)callback(time);});
 };
 function listen(node,event,callback){
  const handler=(...args)=>{if(!disposed)callback(...args);};
  node.addEventListener(event,handler);
  cleanups.push(()=>node.removeEventListener?.(event,handler));
 }
 function bind(node,property,callback){
  const previous=node[property],handler=(...args)=>{if(!disposed)return callback(...args);};
  node[property]=handler;
  cleanups.push(()=>{if(node[property]===handler)node[property]=previous;});
 }
 const $=id=>root.getElementById?.(id)||root.querySelector('#'+id),canvas=$('table'),ctx=canvas.getContext('2d');
 cleanups.push(mountTableKit(root));
let shotCall=0,shotPocket='',shotBank=false,match,balls=[],turn=0,groups=[null,null],angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0;
const callBall=$('call-ball'),callPocket=$('call-pocket');
const telemetry=createGameTelemetry('press-your-luck',{root});
cleanups.push(()=>telemetry.dispose());
const shot=createGameSession({game:'press-your-luck',adjudicate:adjudicatePressShot});
cleanups.push(attachMatchExitGuard(shot));
// Minimal controller test doubles omit DOM ownership; real stages have it.
const announcerStage=$('table-stage');
if(announcerStage?.ownerDocument)cleanups.push(attachShotAnnouncer(shot,announcerStage));
const cuePlacement=createCuePlacement({getBalls:()=>balls,getCue:cue});
let statsRackId=null,statsShotId=null;
const botScheduler=createBotTurnScheduler();
const solo=()=>$('opponent').value==='bot';
const isBotTurn=()=>solo()&&turn===1;
const playerName=i=>i===1&&solo()?'Squatch Bot':'Player '+(i+1);
function cancelBot(){botScheduler.cancel();}
function scheduleBot(){
 if(botScheduler.pending||!isBotTurn()||!['aim','place'].includes(shot.phase))return;
 botScheduler.schedule(()=>{
  if(!isBotTurn())return;
  if(shot.phase==='place'){
   if(shot.confirmPlacement()){message('Squatch Bot placed the cue ball.');update();}
   return;
  }
  if(shot.phase!=='aim')return;
  const group=groups[turn];
  const own=balls.filter(b=>!b.pocketed&&groupOf(b.id)===group);
  const other=balls.filter(b=>!b.pocketed&&groupOf(b.id)&&groupOf(b.id)!==group);
  const targets=shot.breakShot?balls.filter(b=>b.id>0&&!b.pocketed).map(b=>b.id):
   !group?balls.filter(b=>!b.pocketed&&groupOf(b.id)).map(b=>b.id):
   own.length?own.map(b=>b.id):
   match.bonus[turn]>=2||!other.length?[8]:other.map(b=>b.id);
  const plan=planBotShot({balls,targets,pockets,radius:TABLE.radius,table:TABLE,breakShot:shot.breakShot});
  if(!plan)return;
  if(!shot.breakShot){callBall.value=String(plan.ballId);callPocket.value=plan.pocketId||'';}
  angle=plan.angle;$('power').value=String(plan.power);$('bank').checked=false;
  updateCallHint();fire(true);
 },650);
}

cleanups.push(shot.subscribe(result=>{
 if(result.pocketed.length)telemetry.balls(statsRackId,result.shotId,result.pocketed.length);
 const li=document.createElement('li');li.textContent=result.announcement;$('history').prepend(li);
}));
function message(s){$('status').textContent=s;}
function rack(){
 cancelBot();cuePlacement.cancel();
 match={...match,bonus:[0,0],rackPoints:[0,0],rackPocketed:[[],[]],lastRack:null}; // An abandoned rack banks nothing.
 setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;
 balls=fullRack();Object.assign(balls[0],kitchenPoint(TABLE.width*.18,TABLE.height/2));turn=match.breaker;groups=[null,null];shot.startRack();angle=0;events=[];acc=0;previous=0;statsRackId=newGameStatsId();statsShotId=null;
 $('power').value='85';$('spin-top').value='0';$('spin-side').value='0';$('bank').checked=false;callBall.value='';callPocket.value='';
 $('place').hidden=true;root.querySelector('.kit-more')?.removeAttribute('open');$('next').hidden=true;message('Rack '+match.rack+' · '+playerName(turn)+' breaks. Drag the cue ball in the kitchen, aim and press BREAK.');update();
}
function update(){
 const rackComplete=shot.phase==='done'&&Boolean(match.lastRack);
 const displayedRack=rackComplete&&!match.finished?match.rack-1:match.rack;
 $('score').textContent='Rack '+displayedRack+(rackComplete?' complete':'')+' · Race to '+match.targetScore;
 for(let i=0;i<2;i++){
  const preview=rackScorePreview(match,i);
  $('press-player-'+i).textContent=(i===0?'You':playerName(1))+' · '+(groups[i]||'open table');
  $('press-banked-'+i).textContent=String(preview.banked);
  $('press-own-'+i).textContent=String(preview.own);
  $('press-press-'+i).textContent=String(preview.press);
  $('press-projected-'+i).textContent=rackComplete?'—':String(preview.ifLegalEight);
  $('press-score-player-'+i).setAttribute('data-active',String(!rackComplete&&i===turn));
 }
 if(rackComplete){
  const {winner,ownPoints,pressBonus,eightPoints,multiplier,awarded}=match.lastRack;
  $('bonus').textContent=(winner===0?'You':playerName(1))+' banked '+awarded+
   ' this rack ('+ownPoints+' own balls + '+pressBonus+' press bonus + '+eightPoints+
   ' for the 8)'+(multiplier===2?' × 2 bank/kick':'')+'.';
 }else{
  $('bonus').textContent='Banked = locked match score. Own balls = 1 each if you win this rack. '+
   'Press = bonus at risk. If legal 8 = projected match total, including 2 for the 8. '+
   'A successful declared bank/kick doubles this rack only.';
 }
 const selectedCall=callBall.value;
 const options=balls.filter(b=>!b.pocketed&&b.id);
 callBall.replaceChildren(new Option('Choose ball',''),...options.map(b=>new Option(String(b.id),String(b.id))));
 if(options.some(b=>String(b.id)===selectedCall))callBall.value=selectedCall;
 $('shoot').disabled=isBotTurn()||shot.phase!=='aim'||(!shot.breakShot&&!callReady());$('shoot').textContent=shot.breakShot?'BREAK':'SHOOT';
 const placing=shot.phase==='place';$('place').hidden=!placing;$('place').disabled=!placing||isBotTurn();$('place').textContent='Confirm cue placement';
 $('break-reposition').hidden=true;
 // Keep call selection on the felt; dropdowns remain an accessible fallback.
 updateCallHint();
 for(const id of ['call-ball','call-pocket','bank','power','spin-top','spin-side'])$(id).disabled=isBotTurn();
 scheduleBot();
}
function begin(){
 cancelBot();
 try{match=newMatch({targetScore:validateTargetScore($('target').value)});}catch(e){message(e.message);return;}
 $('history').replaceChildren();rack();
}
function cue(){return balls.find(b=>b.id===0);}
const renderer=createTableRenderer({table:TABLE,pockets,cushions,renderPocket});
function draw(){
 renderer.drawTable(ctx,balls,{breakSetup:shot.breakShot&&shot.phase==='aim'});
 drawCallTargets();
 if(shot.phase==='aim'&&(shot.breakShot||callReady()))renderer.drawAim(ctx,cue(),angle);
}

const callReady=()=>Boolean($('call-ball').value&&$('call-pocket').value);
function updateCallHint(){
 const hint=$('table-call-hint');if(!hint)return;
 $('shoot').disabled=isBotTurn()||shot.phase!=='aim'||(!shot.breakShot&&!callReady());
 $('undo-call').disabled=isBotTurn()||shot.phase!=='aim'||shot.breakShot||!($('call-ball').value||$('call-pocket').value);
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
 cancelBot();
 const result=shot.resolveShot({shotId:statsShotId,context:{
  match,balls:preBalls,groups,shooter:turn,shotEvents:events,firstContact,
  breakShot:shot.breakShot,calledBall:shotCall,calledPocket:shotPocket,
  declaredBank:shotBank,
 }});
 match=result.actions.match;
 groups=result.actions.groups;
 if(result.actions.respotEight){
  const b=balls.find(b=>b.id===8);
  const p=findPlacement(balls.filter(other=>other.id!==8),{x:TABLE.width/2,y:TABLE.height/2});
  if(p){Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});}
  else{message('No room to respot the 8.');shot.settle({done:true});update();return;}
 }
 if(result.rackEnd){
  shot.settle({done:true});$('next').hidden=match.finished;
  message(match.finished?playerName(match.winner)+' wins the match!':'Rack over. '+playerName(result.actions.winner)+' breaks next.');update();return;
 }
 turn=result.nextPlayer;
 if(result.ballInHand){
  cue().pocketed=false;cue().vx=cue().vy=cue().wx=cue().wy=cue().wz=0;cue().motion='stationary';
  const p=findPlacement(balls.filter(b=>b.id!==0));if(p)Object.assign(cue(),p);
  shot.settle({ballInHand:true});message(playerName(turn)+' has ball in hand. Tap a clear position and confirm.');
 }
 else{shot.settle();message(playerName(turn)+' to shoot. '+(match.bonus[turn]?'Pressing bonus at risk.':''));}
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
function tablePoint(e){return pointerToTable(canvas,e);}

function aimPointer(e,allowCall=false){
 if(isBotTurn()||!['aim','place'].includes(shot.phase))return;
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
listen(canvas,'pointerdown',e=>{
 if(isBotTurn())return;
 canvas.setPointerCapture(e.pointerId);
 if(shot.phase==='aim'&&shot.breakShot){
  if(cuePlacement.pointerDown(tablePoint(e),e.pointerId)){update();return;}
  if(cuePlacement.dragging)return; // Another finger cannot change aim during cue drag.
 }
 aimPointer(e,true);
});
listen(canvas,'pointermove',e=>{
 if(!e.buttons)return;
 if(shot.phase==='aim'&&shot.breakShot){
  if(cuePlacement.pointerMove(tablePoint(e),e.pointerId)){update();return;}
  if(cuePlacement.dragging)return;
 }
 aimPointer(e,false);
});
listen(canvas,'pointerup',e=>{
 if(cuePlacement.pointerUp(e.pointerId)){message('Cue positioned. Aim and press BREAK.');update();}
});
listen(canvas,'pointercancel',e=>{cuePlacement.pointerUp(e.pointerId);});
listen(canvas,'lostpointercapture',e=>{cuePlacement.pointerUp(e.pointerId);});
function fire(fromBot=false){if(shot.phase!=='aim'||(isBotTurn()&&!fromBot))return;if(!shot.breakShot&&!callReady()){message('Tap a ball and glowing pocket on the table, or use the call drawer.');return;}shotCall=Number(callBall.value);shotPocket=callPocket.value;shotBank=$('bank').checked;preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;statsShotId=newGameStatsId();if(!shot.startShot(statsShotId))return;cuePlacement.cancel();if(shot.breakShot)telemetry.rack(statsRackId);const b=cue(),v=shotSpeed(Number($('power').value),shot.breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;applyCueSpin(b,Number($('spin-top').value)/100,Number($('spin-side').value)/100);$('power').value='68';$('spin-top').value='0';$('spin-side').value='0';$('shoot').disabled=true;}
cleanups.push(attachShotKeyboard(globalThis.window,{
 getPhase:()=>shot.phase,isHumanTurn:()=>!isBotTurn(),
 shoot:()=>fire(),nudgeAim:delta=>{angle+=delta;}
}));
bind($('shoot'),'onclick',()=>fire(false));
bind($('place'),'onclick',()=>{if(!isBotTurn()&&shot.confirmPlacement()){message('Player '+(turn+1)+' to shoot.');update();}});
listen($('call-ball'),'change',()=>{callPocket.value='';updateCallHint();});
listen($('call-pocket'),'change',updateCallHint);
bind($('undo-call'),'onclick',()=>{if(shot.phase!=='aim'||shot.breakShot)return;callBall.value='';callPocket.value='';message('Call cleared. Tap a ball to call a new shot.');updateCallHint();});
bind($('next'),'onclick',rack);bind($('start'),'onclick',begin);
bind($('opponent'),'onchange',()=>{cancelBot();cuePlacement.cancel();update();});
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
bind($('invert-aim'),'onchange',()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}});
bind($('size'),'onchange',()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}if(match.finished)begin();else rack();});
const controller={
 get isRackInProgress(){return shot.isRackInProgress;},
 dispose(){
  if(disposed)return;
  disposed=true;cancelBot();cuePlacement.cancel();
  globalThis.cancelAnimationFrame?.(frameId);
  for(const cleanup of cleanups.splice(0).reverse())cleanup();
  if(mountedGames.get(root)===controller)mountedGames.delete(root);
 },
};
mountedGames.set(root,controller);
begin();requestAnimationFrame(frame);
return controller;
}
