import {TABLE,pockets,cushions,step,stationary,shotSpeed} from './physics.js';
import {renderPocket} from './table-geometry.js';
import {angleFromPointer,readInvertAim,INVERT_AIM_KEY} from './aim-preference.js';
import {ARCADE_CHALLENGE,setupArcadeChallenge,judgeArcadeShot,arcadeAimAngle} from './arcade-challenge.js';
import {ARCADE_COST,ARCADE_STORAGE_KEY,loadArcadeState,saveArcadeState,enterArcade,conquerArcade,awardPractice,PRACTICE_DAILY_CAP} from './arcade-points.js';
const $=id=>document.getElementById(id);
const canvas=$('table'),ctx=canvas.getContext('2d');
let storage=null;
try{storage=globalThis.localStorage??null;}catch{}
let state=loadArcadeState(storage);
let balls=[],mode='practice',phase='idle',shots=0,paid=false,angle=0;
let shotEvents=[],previous=0,acc=0,elapsed=0,still=0;
const cue=()=>balls.find(b=>b.id===0);
const target=()=>balls.find(b=>b.id===1);
function persist(){saveArcadeState(storage,state);}
function announce(message){$('status').textContent=message;}
function log(message){
 const li=document.createElement('li');li.textContent=message;$('history').prepend(li);
}
function renderStats(){
 $('points').textContent=state.balance.toLocaleString();
 $('pot').textContent=state.jackpot.toLocaleString();
 $('creator-points').textContent=state.creator.toLocaleString();
 $('attempt-count').textContent=state.entries.toLocaleString();
 $('shots-left').textContent=String(Math.max(0,ARCADE_CHALLENGE.shots-shots));
 $('mode-label').textContent=mode==='points'?'Points attempt':'Free practice';
 $('edition-label').textContent=state.edition==='won'?'Conquered on this device':'Open on this device';
 const locked=phase==='moving'||(phase==='aim'&&shots>0);
 $('practice').disabled=locked;
 $('entry').disabled=locked||state.edition!=='open'||state.balance<ARCADE_COST;
 $('shoot').disabled=phase!=='aim';
 $('entry').textContent=state.edition==='won'?'Edition conquered':state.balance<ARCADE_COST?'Earn points in practice':'Play for 10 points';
}
function begin(next){
 if(phase==='moving'||(phase==='aim'&&shots>0))return;
 if(next==='points'&&state.edition!=='open'){announce('This local edition was conquered. Free practice is always available.');return;}
 if(next==='points'&&state.balance<ARCADE_COST){announce('Not enough points. Win a free practice run to earn more.');return;}
 mode=next;phase='aim';shots=0;paid=false;shotEvents=[];acc=elapsed=still=previous=0;
 balls=setupArcadeChallenge();angle=arcadeAimAngle(balls);
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 $('power').value='68';$('history').replaceChildren();
 announce(next==='points'
  ?'Points mode ready. 10 points will be charged when you take the first shot.'
  :'Free practice. Aim through the 1-ball toward the glowing top-left corner.');
 log('New '+(next==='points'?'points attempt':'practice')+' · Three shots available.');
 renderStats();
}
function finish(){
 const outcome=judgeArcadeShot(shotEvents,shots);
 if(outcome.status==='continue'){
  phase='aim';announce(outcome.reason);log('Shot '+shots+': keep trying.');renderStats();return;
 }
 phase=outcome.status;
 if(outcome.status==='won'){
  if(mode==='points'&&paid){
   const prize=state.jackpot;
   state=conquerArcade(state);persist();
   announce('Corner conquered! +'+prize+' LOCAL demo points. This edition is closed.');
   log('Local points win: '+prize+' awarded once. No shared prize.');
  }else{
   const before=state.balance;
   state=awardPractice(state,new Date().toISOString().slice(0,10));persist();
   const earned=state.balance-before;
   announce(outcome.reason+' '+(earned?('+'+earned+' practice points!'):'Daily practice rewards used; keep playing free.'));
   log('Practice cleared'+(earned?' · +'+earned+' points.':' · daily cap reached.'));
  }
 }else{
  announce(outcome.reason+' Choose Practice or a new Points attempt to retry.');
  log('Challenge missed after '+shots+' shot(s).');
 }
 renderStats();
}
function stroke(){
 if(phase!=='aim')return;
 if(mode==='points'&&!paid){
  try{state=enterArcade(state);}catch(e){announce(e.message);renderStats();return;}
  paid=true;persist();
 }
 shots++;shotEvents=[];acc=elapsed=still=0;previous=0;
 const b=cue(),v=shotSpeed(Number($('power').value));
 b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;
 b.motion='sliding';phase='moving';
 $('power').value='68';
 announce('Shot '+shots+' moving…');
 renderStats();
}
function draw(){
 const {width:w,height:h,radius:r}=TABLE;
 ctx.fillStyle='#126447';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#785338';ctx.fillRect(0,0,w,r);
 ctx.fillRect(0,h-r,w,r);ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
 for(const p of pockets)renderPocket(ctx,p);
 ctx.strokeStyle='#bf9a5b';ctx.lineWidth=2;ctx.beginPath();
 for(const rail of cushions){ctx.moveTo(rail.x1,rail.y1);ctx.lineTo(rail.x2,rail.y2);}
 ctx.stroke();
 // The goal ring identifies the corner without making the playable pocket bigger.
 ctx.strokeStyle='#f6d78b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(26,26,20,0,Math.PI*2);ctx.stroke();
 for(const b of balls){
  if(b.pocketed)continue;
  ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);
  ctx.fillStyle=b.id===0?'#fffdf2':'#e4ae43';ctx.fill();ctx.strokeStyle='#13271e';ctx.stroke();
  if(b.id){ctx.fillStyle='#1c2b22';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1',b.x,b.y);}
 }
 if(phase==='aim'){
  const b=cue(),dx=Math.cos(angle),dy=Math.sin(angle);
  ctx.strokeStyle='#ffe09a';ctx.lineWidth=2;ctx.setLineDash([9,7]);ctx.beginPath();
  ctx.moveTo(b.x+dx*r,b.y+dy*r);ctx.lineTo(b.x+dx*270,b.y+dy*270);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#dab27a';ctx.lineWidth=5;ctx.beginPath();
  ctx.moveTo(b.x-dx*(r+15),b.y-dy*(r+15));ctx.lineTo(b.x-dx*(r+145),b.y-dy*(r+145));ctx.stroke();
 }
}
function frame(now){
 const delta=previous?Math.min(0.08,(now-previous)/1000):0;previous=now;
 if(phase==='moving'){
  acc+=delta;let loops=0;
  while(acc>=1/120&&loops++<12){
   const result=step(balls,1/120);shotEvents.push(...result.shotEvents);
   acc-=1/120;elapsed+=1/120;
   still=stationary(balls)?still+1:0;
   if(still>20||elapsed>20){finish();break;}
  }
 }
 draw();requestAnimationFrame(frame);
}
function pointerAim(event){
 if(phase!=='aim')return;
 const box=canvas.getBoundingClientRect();
 if(!box.width||!box.height)return;
 const p={x:(event.clientX-box.left)*TABLE.width/box.width,
  y:(event.clientY-box.top)*TABLE.height/box.height};
 const next=angleFromPointer(cue(),p,$('invert-aim').checked,TABLE.radius);
 if(next!==null)angle=next;
}
canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);pointerAim(event);});
canvas.addEventListener('pointermove',event=>{if(event.buttons)pointerAim(event);});
window.addEventListener('keydown',event=>{
 if(phase!=='aim'||event.altKey||event.ctrlKey||event.metaKey)return;
 if(event.target instanceof HTMLElement&&event.target.closest('button,input,select,textarea,a,[contenteditable]'))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
  event.preventDefault();
  angle+=(event.key==='ArrowLeft'?-1:1)*(Math.PI/180)*2;
 }else if(event.code==='Space'){
  event.preventDefault();stroke();
 }
});
$('practice').addEventListener('click',()=>begin('practice'));
$('entry').addEventListener('click',()=>begin('points'));
$('shoot').addEventListener('click',stroke);
$('invert-aim').checked=readInvertAim();
$('invert-aim').addEventListener('change',()=>{
 try{localStorage.setItem(INVERT_AIM_KEY,String($('invert-aim').checked));}catch{}
});
$('reset-demo').addEventListener('click',()=>{
 if(!window.confirm('Reset this device’s Squatch Points, creator earnings, jackpot and local win?'))return;
 try{storage?.removeItem(ARCADE_STORAGE_KEY);}catch{}
 state=loadArcadeState(storage);phase='idle';begin('practice');
});
$('storage-note').textContent=storage
 ?'Prototype balances are stored in this browser only. They are not shared, verified, transferable or redeemable.'
 :'Browser storage is unavailable. Points will reset after you close this page.';
$('rules-summary').textContent=ARCADE_CHALLENGE.description;
begin('practice');requestAnimationFrame(frame);
