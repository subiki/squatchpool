import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupOf} from './rules.js';
import {newMatch,validateTargetScore} from './press-your-luck-score.js';
import {pressTurn,pressEligible} from './press-your-luck-turn.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let shotCall=0,shotPocket='',shotBank=false,match,balls=[],turn=0,groups=[null,null],phase='ready',angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0,breakShot=true,breakPlacementValid=false;
const callBall=$('call-ball'),callPocket=$('call-pocket');
const telemetry=createGameTelemetry('press-your-luck');
let statsRackId=null,statsShotId=null;
function message(s){$('status').textContent=s;}
function rack(){
 setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;
 balls=fullRack();Object.assign(balls[0],kitchenPoint(TABLE.width*.18,TABLE.height/2));turn=match.breaker;groups=[null,null];phase='placeBreak';breakShot=true;breakPlacementValid=false;angle=0;events=[];acc=0;previous=0;statsRackId=newGameStatsId();statsShotId=null;
 $('power').value='85';$('spin-top').value='0';$('spin-side').value='0';$('bank').checked=false;callPocket.value='';
 $('place').hidden=false;document.querySelector('.kit-more')?.removeAttribute('open');$('next').hidden=true;message('Rack '+match.rack+' · Player '+(turn+1)+' breaks. Tap or drag the cue ball within the kitchen, then confirm its position.');update();
}
function update(){
 $('score').textContent='Player 1: '+match.scores[0]+' · Player 2: '+match.scores[1]+' · Target '+match.targetScore;
 $('bonus').textContent='Provisional: '+match.bonus[0]+' · '+match.bonus[1]+' · Groups: '+(groups[0]||'open')+' / '+(groups[1]||'open');
 callBall.replaceChildren(new Option('Choose ball',''),...balls.filter(b=>!b.pocketed&&b.id).map(b=>new Option(String(b.id),String(b.id))));
 $('shoot').disabled=phase!=='aim';$('shoot').textContent=breakShot?'BREAK':'SHOOT';
 const placing=phase==='place'||phase==='placeBreak';$('place').hidden=!placing;$('place').disabled=!placing||(phase==='placeBreak'&&!breakPlacementValid);$('place').textContent=phase==='placeBreak'?'Confirm break position':'Confirm cue placement';
 $('break-reposition').hidden=!(breakShot&&phase==='aim');
 // After the break, a call is mandatory: expose the selectors instead of making Shoot appear dead.
 const callPanel=document.querySelector('.kit-more');if(callPanel&&phase==='aim'&&!breakShot)callPanel.open=true;
}
function begin(){
 try{match=newMatch({targetScore:validateTargetScore($('target').value)});}catch(e){message(e.message);return;}
 $('history').replaceChildren();rack();
}
function cue(){return balls.find(b=>b.id===0);}
function draw(){
 const {width:w,height:h,radius:r}=TABLE;
 ctx.fillStyle='#155f49';ctx.fillRect(0,0,w,h);ctx.fillStyle='#76563a';
 ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
 for(const p of pockets)renderPocket(ctx,p);
 ctx.strokeStyle='#c59a61';ctx.lineWidth=2;ctx.beginPath();for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}ctx.stroke();
 for(const b of balls){if(b.pocketed)continue;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fillStyle=b.id===0?'#fff':b.id===8?'#111':b.id<=7?'#ddac4b':'#477fc0';ctx.fill();ctx.strokeStyle='#ffffff99';ctx.stroke();if(b.id){ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(b.id,b.x,b.y);}}
 if(phase==='aim'){const b=cue(),dx=Math.cos(angle),dy=Math.sin(angle);ctx.strokeStyle='#f4e1a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+dx*r,b.y+dy*r);ctx.lineTo(b.x+dx*240,b.y+dy*240);ctx.stroke();ctx.strokeStyle='#d6aa70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-dx*(r+15),b.y-dy*(r+15));ctx.lineTo(b.x-dx*(r+140),b.y-dy*(r+140));ctx.stroke();}
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
 const legalCall=breakShot||made||!ids.some(id=>id!==0);
 const assignment=!groups[turn]&&!breakShot&&made&&groupOf(called)&&!scratch&&firstContact!==null&&groupOf(firstContact)===groupOf(called);
 if(assignment){groups[turn]=groupOf(called);groups[1-turn]=groups[turn]==='solids'?'stripes':'solids';}
 const eligible=pressEligible(preBalls,groups[turn]);
 const legalFirst=breakShot?firstContact!==null:!groups[turn]?Boolean(groupOf(firstContact)):eligible?firstContact===8||Boolean(groupOf(firstContact)):groupOf(firstContact)===groups[turn];
 const result=pressTurn({match,balls:preBalls,groups,shooter:turn,shotEvents:events,breakShot,legalShot:Boolean(legalFirst)&&!illegalEight&&legalCall,eightAttempt:called===8&&!ids.includes(8),bankOrKick:shotBank&&events.some(e=>e.type==='rail'&&e.ballId===8)||shotBank&&events.some(e=>e.type==='rail'&&e.ballId===0&&events.indexOf(e)<events.findIndex(h=>h.type==='contact'&&h.balls.includes(0))),calledShotMade:made});
 match=result.match;
 if(result.respotEight){const b=balls.find(b=>b.id===8);const p=findPlacement(balls.filter(other=>other.id!==8),{x:TABLE.width/2,y:TABLE.height/2});if(p){Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});}else{message('No room to respot the 8.');phase='done';update();return;}}
 if(result.finish){
  const li=document.createElement('li');li.textContent='Rack '+(match.finished?match.rack:match.rack-1)+': Player '+(result.winner+1)+' wins '+match.lastRack.awarded+' points';$('history').prepend(li);
  phase='done';$('next').hidden=match.finished;
  message(match.finished?'Player '+(match.winner+1)+' wins the match!':'Rack over. Player '+(result.winner+1)+' breaks next.');update();return;
 }
 turn=result.nextPlayer;breakShot=false;
 if(scratch||result.ballInHand){cue().pocketed=false;cue().vx=cue().vy=cue().wx=cue().wy=cue().wz=0;cue().motion='stationary';const p=findPlacement(balls.filter(b=>b.id!==0));if(p)Object.assign(cue(),p);phase='place';message('Player '+(turn+1)+' has ball in hand. Tap a clear position and confirm.');}
 else{phase='aim';message('Player '+(turn+1)+' to shoot. '+(result.match.bonus[turn]?'Pressing bonus at risk.':''));}
 $('bank').checked=false;callPocket.value='';update();
}
function frame(t){
 const elapsed=previous?Math.min(.08,(t-previous)/1000):0;previous=t;
 if(phase==='moving'){acc+=elapsed;let n=0;while(acc>=1/120&&n++<12){const outcome=step(balls,1/120);events.push(...outcome.shotEvents);if(firstContact===null){const hit=outcome.shotEvents.find(e=>e.type==='contact'&& e.balls.includes(0));if(hit)firstContact=hit.balls.find(id=>id!==0);}acc-=1/120;shotElapsed+=1/120;still=stationary(balls)?still+1:0;if(still>20||shotElapsed>20){endShot();break;}}}
 draw();requestAnimationFrame(frame);
}
function aimPointer(e){if(!['aim','place','placeBreak'].includes(phase))return;const box=canvas.getBoundingClientRect(),border=canvas.clientLeft,insideWidth=canvas.clientWidth,insideHeight=canvas.clientHeight,x=(e.clientX-box.left-border)*canvas.width/insideWidth,y=(e.clientY-box.top-border)*canvas.height/insideHeight;if(phase==='placeBreak'){
  // A tap beyond the head string cannot teleport the cue back into the kitchen.
  const p=x>=headStringX()?{x,y}:kitchenPoint(x,y);
  breakPlacementValid=canPlaceBreakCue(balls,p.x,p.y);
  if(breakPlacementValid)Object.assign(cue(),p);
  $('notice').textContent=breakPlacementValid?'Break position valid. Confirm placement.':'Place the entire cue ball behind the head string.';
  update();return;
 }
 if(phase==='place'){if(canPlace(balls,x,y,0)){cue().x=x;cue().y=y;draw();$('notice').textContent='Cue position valid. Confirm placement.';}else $('notice').textContent='Cue overlaps a ball or rail. Choose an open spot.';return;}const b=cue();const next=angleFromPointer(b,{x,y},$('invert-aim').checked,TABLE.radius);if(next!==null)angle=next;}
canvas.addEventListener('pointerdown',e=>{
 canvas.setPointerCapture(e.pointerId);
 // Drag the cue itself to reposition after confirmation, without stealing ordinary aim taps.
 if(phase==='aim'&&breakShot){const box=canvas.getBoundingClientRect();const x=(e.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth,y=(e.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight;
  if(Math.hypot(x-cue().x,y-cue().y)<=TABLE.radius*2.5){phase='placeBreak';breakPlacementValid=false;}
 }
 aimPointer(e);
});
canvas.addEventListener('pointermove',e=>{if(e.buttons)aimPointer(e);});
$('shoot').onclick=()=>{if(phase!=='aim')return;if(!breakShot&&(!callBall.value||!callPocket.value)){document.querySelector('.kit-more')?.setAttribute('open','');message('Open Call shot · Spin & options and choose a ball and pocket first.');(!callBall.value?callBall:callPocket).focus();return;}shotCall=Number(callBall.value);shotPocket=callPocket.value;shotBank=$('bank').checked;preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;statsShotId=newGameStatsId();if(breakShot)telemetry.rack(statsRackId);const b=cue(),v=shotSpeed(Number($('power').value),breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;applyCueSpin(b,Number($('spin-top').value)/100,Number($('spin-side').value)/100);$('power').value='68';$('spin-top').value='0';$('spin-side').value='0';phase='moving';$('shoot').disabled=true;};
$('place').onclick=()=>{
 if(phase==='placeBreak'&&breakPlacementValid){phase='aim';message('Break position confirmed. Aim, then tap BREAK.');update();}
 else if(phase==='place'){phase='aim';message('Player '+(turn+1)+' to shoot.');update();}
};
$('break-reposition').onclick=()=>{if(phase==='aim'&&breakShot){phase='placeBreak';breakPlacementValid=false;message('Tap or drag the cue ball within the kitchen, then confirm.');update();}};
$('next').onclick=rack;$('start').onclick=begin;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
begin();requestAnimationFrame(frame);
