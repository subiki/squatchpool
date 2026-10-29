/** Press Your Luck: playable two-seat local controller.
 * Owner-approved scoring: src/press-your-luck-score.js and -turn.js.
 * Unresolved standard 8-ball edge cases are explicitly labeled provisional in UI.
 */
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,
 canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupOf,otherGroup} from './rules.js';
import {newMatch,validateTargetScore} from './press-your-luck-score.js';
import {pressEligible,pressTurn} from './press-your-luck-turn.js';
import {createStatsClient,newStatsId,initStats} from './stats.js';
import './deployment.js';

const $=id=>document.getElementById(id);
const canvas=$('pyl-table'),ctx=canvas.getContext('2d');
const names=['Player 1','Player 2'];
let game,lastTime=0,accumulator=0,dragging=false,tracker=null;

function say(message){
 const li=document.createElement('li');li.textContent=message;
 $('pyl-log').prepend(li);
 while($('pyl-log').children.length>18)$('pyl-log').lastElementChild.remove();
}
function startRack(match){
 setTableSize(Number($('pyl-size').value));
 try{localStorage.setItem('squatch-table-size',String(TABLE.size));}catch{}
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 canvas.style.aspectRatio=String(TABLE.width/TABLE.height);
 const balls=fullRack(),p=kitchenPoint(TABLE.width*.18,TABLE.height/2);
 Object.assign(balls[0],p);
 game={match,balls,groups:[null,null],turn:match.breaker,phase:'placeBreak',
  breakShot:true,placementValid:false,angle:0,power:85,top:0,side:0,
  shot:null,statsRackId:newStatsId(),calledPocket:null,declaredBank:false};
 accumulator=0;
 $('pyl-power').value='85';$('pyl-top').value='0';$('pyl-side').value='0';
 $('pyl-bank').checked=false;
 say('Rack '+match.rack+': '+names[match.breaker]+' breaks. Place the white ball in the kitchen.');
 update();
}
function startMatch(){
 try{
  const targetScore=validateTargetScore($('pyl-target').value);
  $('pyl-log').replaceChildren();
  startRack(newMatch({targetScore}));
  $('pyl-target').setCustomValidity('');
 }catch(error){
  $('pyl-target').setCustomValidity(error.message);
  $('pyl-target').reportValidity();
 }
}
const cue=()=>game.balls[0];
function update(){
 if(!game)return;
 const m=game.match,eligible=pressEligible(game.balls,game.groups[game.turn]);
 const placing=game.phase==='placeBreak'||game.phase==='placeCue';
 const canShoot=game.phase==='aim';
 $('pyl-turn').textContent=m.finished?names[m.winner]+' wins the match!':
  game.phase==='between'?names[m.lastRack.winner]+' won rack '+(m.rack-1):
  names[game.turn]+' · '+(placing?'place white ball':game.phase==='moving'?'balls rolling':'shooting');
 $('pyl-score').textContent=names.map((name,i)=>name+': '+m.scores[i]+' points · '+
  (game.groups[i]||'open table')+' · '+m.bonus[i]+' unbanked').join('   |   ')+
  '   · Race to '+m.targetScore;
 $('pyl-status').textContent=m.finished?'Match complete. Start a new match to play again.':
  game.phase==='between'?'Rack awarded '+m.lastRack.awarded+' points to '+names[m.lastRack.winner]+'. Next rack: winner breaks.':
  game.phase==='placeBreak'?'Tap or drag in the kitchen, then confirm the break position.':
  game.phase==='placeCue'?'Ball in hand: tap a legal place on the felt, then confirm.':
  game.phase==='moving'?'Balls rolling…':
  game.breakShot?'Break the rack; no called pocket is needed.':
  eligible?(game.calledPocket?'Called 8 to '+pockets.find(p=>p.id===game.calledPocket)?.label+'. Shoot to bank your points.':
   'Your group is clear. Pocket opponent balls for +1 each, or call a pocket for the 8.'):
  game.groups[game.turn]?'Pocket your own group before pressing opponent balls.':
  'Open table: first legally pocketed solid or stripe after the break assigns groups.';
 $('pyl-eight-panel').hidden=!(canShoot&&!game.breakShot&&eligible);
 for(const button of document.querySelectorAll('#pyl-pockets button')){
  button.setAttribute('aria-pressed',String(button.dataset.pocket===game.calledPocket));
 }
 $('pyl-undo').disabled=!game.calledPocket;
 $('pyl-bank').disabled=!game.calledPocket;
 $('pyl-place').hidden=!placing;
 $('pyl-place').disabled=!placing||!game.placementValid;
 $('pyl-place').textContent=game.phase==='placeBreak'?'Confirm break position':'Confirm ball in hand';
 $('pyl-reposition').hidden=!(canShoot&&game.breakShot);
 $('pyl-shoot').disabled=!canShoot;
 $('pyl-shoot').textContent=game.breakShot?'BREAK':'SHOOT';
 $('pyl-next').hidden=game.phase!=='between';
 $('pyl-target').disabled=game.phase!=='between'&&game.phase!=='done'&&m.rack>1;
 for(const [id,key] of [['pyl-power','power'],['pyl-top','top'],['pyl-side','side']]){
  $(id).disabled=!canShoot;
  $(id+'-value').textContent=game[key]+'%';
 }
}
function qualifyingBankOrKick(events){
 const contactIndex=events.findIndex(e=>e.type==='contact'&&e.balls?.includes(0)&&e.balls?.includes(8));
 const pocketIndex=events.findIndex(e=>e.type==='pocket'&&e.ballId===8);
 if(contactIndex<0||pocketIndex<=contactIndex)return false;
 return events.some((e,i)=>e.type==='rail'&&
  ((e.ballId===0&&i<contactIndex)||(e.ballId===8&&i>contactIndex&&i<pocketIndex)));
}
function respotEight(){
 const eight=game.balls.find(b=>b.id===8);
 if(!eight||!eight.pocketed)return;
 const spot=findPlacement(game.balls,{x:TABLE.radius+(TABLE.width-2*TABLE.radius)*.75,y:TABLE.height/2});
 if(!spot){say('No legal 8-ball spot found. Use New match to restart.');return;}
 Object.assign(eight,spot,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});
}
function finishShot(){
 const shot=game.shot;game.shot=null;
 const events=shot.events,pocketed=[...new Set(events.filter(e=>e.type==='pocket').map(e=>e.ballId))];
 const firstContact=events.find(e=>e.type==='contact'&&e.balls?.includes(0));
 const firstObject=firstContact?.balls.find(id=>id!==0)??null;
 const scratch=pocketed.includes(0),eight=pocketed.includes(8);
 const eligible=pressEligible(shot.beforeBalls,shot.groups[shot.shooter]);
 const group=shot.groups[shot.shooter];
 const legalFirst=shot.breakShot?firstObject!==null:
  group===null?Boolean(groupOf(firstObject)):
  eligible?(firstObject===8||groupOf(firstObject)===otherGroup(group)):
  groupOf(firstObject)===group;
 const actualEightPocket=events.find(e=>e.type==='pocket'&&e.ballId===8)?.pocketId;
 const calledEightCorrect=Boolean(shot.calledPocket&&shot.calledPocket===actualEightPocket);
 const legalShot=legalFirst&&!scratch&&(!eight||shot.breakShot||calledEightCorrect);
 const bankOrKick=shot.declaredBank&&calledEightCorrect&&qualifyingBankOrKick(events);
 let result;
 try{
  result=pressTurn({match:game.match,balls:shot.beforeBalls,groups:shot.groups,
   shooter:shot.shooter,shotEvents:events,breakShot:shot.breakShot,
   legalShot,eightAttempt:Boolean(shot.calledPocket),bankOrKick});
 }catch(error){
  console.error('Press Your Luck adjudication failed',error);
  game.phase='done';say('Rules error: '+error.message);update();return;
 }
 // The open-table assignment below is a labeled provisional interpretation,
 // never an assertion about the original missing Episode 2 manuscript.
 if(!shot.breakShot&&!scratch&&legalShot&&!game.groups[0]){
  const firstGroupPot=events.find(e=>e.type==='pocket'&&Boolean(groupOf(e.ballId)));
  if(firstGroupPot){
   const g=groupOf(firstGroupPot.ballId);
   game.groups[shot.shooter]=g;game.groups[1-shot.shooter]=otherGroup(g);
   say(names[shot.shooter]+' takes '+g+'; '+names[1-shot.shooter]+' takes '+otherGroup(g)+'.');
  }
 }
 game.match=result.match;
 if(result.respotEight)respotEight();
 const scoredBalls=pocketed.filter(id=>id!==0&&!(result.respotEight&&id===8));
 if(scoredBalls.length)tracker?.balls(game.statsRackId,shot.statsShotId,scoredBalls.length);
 say(names[shot.shooter]+': '+(pocketed.length?'pocketed '+pocketed.join(', '):'no balls pocketed')+
  (scratch?' · scratch.':result.finish?' · '+result.finish+'.':result.unresolvedFoul?' · foul.':'.'));
 game.breakShot=false;game.calledPocket=null;game.declaredBank=false;$('pyl-bank').checked=false;
 if(result.finish){
  say(names[result.winner]+' wins rack '+(game.match.finished?game.match.rack:game.match.rack-1)+
   ' for '+game.match.lastRack.awarded+' points.');
  game.phase=game.match.finished?'done':'between';
 }else{
  game.turn=result.nextPlayer;
  game.phase=(scratch||result.unresolvedFoul||!legalFirst)?'placeCue':'aim';
  game.placementValid=false;
 }
 update();
}
function shoot(){
 if(!game||game.phase!=='aim')return;
 const b=cue(),speed=shotSpeed(game.power,game.breakShot);
 const beforeBalls=game.balls.map(b=>({...b}));
 b.vx=Math.cos(game.angle)*speed;b.vy=Math.sin(game.angle)*speed;
 applyCueSpin(b,game.top/100,game.side/100);
 game.shot={events:[],time:0,stillFrames:0,breakShot:game.breakShot,
  beforeBalls,groups:[...game.groups],shooter:game.turn,
  calledPocket:game.calledPocket,declaredBank:game.declaredBank,statsShotId:newStatsId()};
 if(game.breakShot)tracker?.rack(game.statsRackId);
 game.phase='moving';game.power=68;game.top=0;game.side=0;
 $('pyl-power').value='68';$('pyl-top').value='0';$('pyl-side').value='0';
 update();
}
function placeCue(p){
 if(game.phase==='placeBreak'){
  const q=p.x>=headStringX()?p:kitchenPoint(p.x,p.y);
  game.placementValid=canPlaceBreakCue(game.balls,q.x,q.y);
  if(game.placementValid)Object.assign(cue(),q);
 }else if(game.phase==='placeCue'){
  game.placementValid=canPlace(game.balls,p.x,p.y,0);
  if(game.placementValid)Object.assign(cue(),p);
 }
 update();
}
function draw(){
 const {width:w,height:h,radius:r}=TABLE;
 ctx.fillStyle='#175f4b';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#61452f';ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);
 ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
 for(const p of pockets)renderPocket(ctx,p);
 ctx.strokeStyle='#b58a53';ctx.lineWidth=3;ctx.beginPath();
 for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}ctx.stroke();
 for(const b of game.balls){
  if(b.pocketed)continue;
  ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);
  ctx.fillStyle=b.id===0?'#f8f6ed':b.id===8?'#17191c':b.id<=7?'#d9aa41':'#4a80b2';
  ctx.fill();ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1.5;ctx.stroke();
  if(b.id){ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';
   ctx.textBaseline='middle';ctx.fillText(String(b.id),b.x,b.y);}
 }
 if(game.phase==='aim'){
  const b=cue(),dx=Math.cos(game.angle),dy=Math.sin(game.angle);
  ctx.strokeStyle='#fce2a8';ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();
  ctx.moveTo(b.x+dx*(r+4),b.y+dy*(r+4));ctx.lineTo(b.x+dx*280,b.y+dy*280);
  ctx.stroke();ctx.setLineDash([]);
  ctx.lineWidth=5;ctx.strokeStyle='#dfb37c';ctx.beginPath();
  ctx.moveTo(b.x-dx*(r+22),b.y-dy*(r+22));
  ctx.lineTo(b.x-dx*(r+170),b.y-dy*(r+170));ctx.stroke();
 }
}
function frame(t){
 const elapsed=lastTime?Math.min(.25,Math.max(0,(t-lastTime)/1000)):0;lastTime=t;
 if(game?.phase==='moving'){
  accumulator=Math.min(.35,accumulator+elapsed);let n=0;
  while(accumulator>=1/120&&n++<24){
   const result=step(game.balls,1/120);
   game.shot.events.push(...result.shotEvents);
   game.shot.time+=1/120;
   game.shot.stillFrames=stationary(game.balls)?game.shot.stillFrames+1:0;
   accumulator-=1/120;
   if(game.shot.stillFrames>24||game.shot.time>20){
    if(game.shot.time>20)for(const b of game.balls)if(!b.pocketed){
     b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;b.motion='stationary';
    }
    accumulator=0;finishShot();break;
   }
  }
 }
 if(game)draw();
 requestAnimationFrame(frame);
}
function point(e){
 const rect=canvas.getBoundingClientRect();
 return{x:(e.clientX-rect.left)*TABLE.width/rect.width,
  y:(e.clientY-rect.top)*TABLE.height/rect.height};
}
function aim(p){
 const b=cue(),dx=p.x-b.x,dy=p.y-b.y;
 if(Math.hypot(dx,dy)>TABLE.radius)game.angle=Math.atan2(dy,dx);
}
canvas.addEventListener('pointerdown',e=>{
 if(!game)return;
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(point(e));
 else if(game.phase==='aim')aim(point(e));else return;
 dragging=true;canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging)return;
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(point(e));
 else if(game.phase==='aim')aim(point(e));
});
canvas.addEventListener('pointerup',e=>{if(dragging&&game.phase==='aim')aim(point(e));dragging=false;});
canvas.addEventListener('pointercancel',()=>dragging=false);
$('pyl-place').addEventListener('click',()=>{
 if(!game.placementValid||!['placeBreak','placeCue'].includes(game.phase))return;
 if(game.phase==='placeCue'){
  const b=cue();b.pocketed=false;b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;b.motion='stationary';
 }
 game.phase='aim';update();
});
$('pyl-shoot').addEventListener('click',shoot);
$('pyl-reposition').addEventListener('click',()=>{
 if(game.phase!=='aim'||!game.breakShot)return;
 game.phase='placeBreak';game.placementValid=false;update();
});
$('pyl-new-match').addEventListener('click',startMatch);
$('pyl-next').addEventListener('click',()=>{
 if(game.phase==='between'&&!game.match.finished)startRack(game.match);
});
$('pyl-size').addEventListener('change',()=>{
 if(game)startRack(game.match);
});
for(const button of document.querySelectorAll('#pyl-pockets button'))
 button.addEventListener('click',()=>{
  if(game.phase!=='aim'||!pressEligible(game.balls,game.groups[game.turn]))return;
  game.calledPocket=button.dataset.pocket;update();
 });
$('pyl-undo').addEventListener('click',()=>{
 game.calledPocket=null;game.declaredBank=false;$('pyl-bank').checked=false;update();
});
$('pyl-bank').addEventListener('change',e=>{game.declaredBank=e.target.checked;update();});
for(const [id,key] of [['pyl-power','power'],['pyl-top','top'],['pyl-side','side']])
 $(id).addEventListener('input',e=>{game[key]=Number(e.target.value);update();});
window.addEventListener('keydown',e=>{
 const tag=e.target?.tagName?.toLowerCase();
 if(!game||game.phase!=='aim'||e.target?.isContentEditable||
  (tag&&!['body','html','canvas'].includes(tag))||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'){game.angle-=.025;e.preventDefault();}
 if(e.key==='ArrowRight'){game.angle+=.025;e.preventDefault();}
 if(e.code==='Space'){shoot();e.preventDefault();}
});
try{
 const saved=localStorage.getItem('squatch-table-size');
 if(['7','8','9'].includes(saved))$('pyl-size').value=saved;
}catch{}
try{
 initStats();
 let storage=null;try{storage=localStorage;}catch{}
 tracker=createStatsClient({gameId:'press-your-luck',request:fetch.bind(globalThis),storage,
  onStats:data=>{
   const g=data.games.find(g=>g.id==='press-your-luck');
   if(g)$('pyl-stats-game').textContent=g.players+' players · '+g.racks+' racks · '+g.balls+' balls';
  },onStatus:state=>$('pyl-stats-status').textContent=state==='live'?'Live game totals':'Stats unavailable; gameplay works'});
 void tracker.refresh();void tracker.flush();
 window.addEventListener('online',()=>{void tracker.refresh();void tracker.flush();});
}catch(error){console.error('Press Your Luck stats unavailable',error);}
try{
 startMatch();
 draw();
 requestAnimationFrame(frame);
}catch(error){
 console.error('Press Your Luck startup failed',error);
 $('pyl-status').textContent='Game could not initialize: '+(error?.message||String(error));
}
