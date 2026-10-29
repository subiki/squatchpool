/** Caroms local pass-and-play preview, isolated from But Wait's production game. */
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,headStringX} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupOf,liveGroupBalls} from './rules.js';
import {caromsTurn,caromsEligible,caromsCallRequired} from './caroms-rules.js';
import {respotCaromsBall} from './caroms-placement.js';
import {caromsBreaker} from './caroms-match.js';
import {initCaromsStats,newCaromsStatsId,reportCaromsRack,reportCaromsBalls} from './caroms-stats.js';
import {bindInvertAim,angleFromPointer} from './aim-preference.js';

const $=id=>document.getElementById(id);
const POCKET_BUTTONS=['TL','TM','TR','BL','BM','BR'];
const canvas=$('caroms-table'),ctx=canvas.getContext('2d');
const invertAim=bindInvertAim($('invert-aim'));
const level=i=>$('caroms-level-'+i).value;
let state,lastTime=0,accumulator=0,botTimer=null,botActionId=0,matchWins=[0,0];
const solo=()=>$('caroms-mode').value==='bot';
const isBot=()=>solo()&&state.turn===1;
const humanTurn=()=>!isBot();
// Invalidate callbacks even when clearTimeout races an already-queued callback.
function cancelBot(){botActionId++;if(botTimer!==null)clearTimeout(botTimer);botTimer=null;}
function scheduleBot(){
 cancelBot();if(!isBot()||!['aim','option'].includes(state.phase))return;
 const generation=state.generation,actionId=botActionId;
 botTimer=setTimeout(()=>{
  // A stale callback must not clear the newer timer or act on a later bot turn
  // in the same rack (the rack generation alone cannot distinguish turns).
  if(state.generation!==generation||botActionId!==actionId||!isBot()||
   !['aim','option'].includes(state.phase))return;
  botTimer=null;
  if(state.phase==='option'){chooseOption(false,true);return;}
  const candidates=eligibleBalls(),white=cue();if(!candidates.length||!white||white.pocketed)return;
  // Bounded deterministic geometric baseline. All strokes use the real physics engine.
  const b=candidates.slice().sort((a,z)=>Math.hypot(a.x-white.x,a.y-white.y)-Math.hypot(z.x-white.x,z.y-white.y))[0];
  state.shooterBall=b.id;state.angle=Math.atan2(white.y-b.y,white.x-b.x);
  state.power=78;state.spinTop=0;state.spinSide=0;
  const required=!state.breakShot&&caromsCallRequired(level(state.turn),caromsEligible(state.balls,state.groups[state.turn]));
  if(required){
   state.calledBall=b.id;
   const p=pockets.slice().sort((a,z)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(z.x-b.x,z.y-b.y))[0];
   state.calledPocket=p?.id??null;
  }
  // The scheduled bot action is the only authorized shooter on bot turns.
  update();hit(true);
 },650);
}
const player=i=>i===1&&solo()?'Squatch Bot':'Player '+(i+1);
const matchWinner=()=>matchWins.findIndex(wins=>wins>=2);
const cue=()=>state.balls.find(b=>b.id===0);
const striker=()=>state.balls.find(b=>b.id===state.shooterBall);
function log(message){
 const li=document.createElement('li');li.textContent=message;
 $('caroms-log').prepend(li);
 while($('caroms-log').children.length>14)$('caroms-log').lastElementChild.remove();
}
function eligibleBalls(){
 if(state.breakShot)return state.balls.filter(b=>b.id===1&&!b.pocketed);
 const group=state.groups[state.turn];
 const eligible8=caromsEligible(state.balls,group);
 return state.balls.filter(b=>!b.pocketed&&(eligible8?b.id===8:
  group?groupOf(b.id)===group:Boolean(groupOf(b.id))));
}
function updateSelect(select,options,selected,placeholder){
 const value=String(selected??'');
 select.replaceChildren();
 if(placeholder)select.add(new Option(placeholder,''));
 for(const [id,name] of options)select.add(new Option(name,String(id)));
 if([...select.options].some(o=>o.value===value))select.value=value;
 else if(placeholder)select.value='';
}
function update(){
 const available=eligibleBalls();
 if(!available.some(b=>b.id===state.shooterBall))state.shooterBall=available[0]?.id??null;
 const canAim=state.phase==='aim'&&humanTurn(),needCall=!state.breakShot&&caromsCallRequired(level(state.turn),
  caromsEligible(state.balls,state.groups[state.turn]));
 // Only offer legal called targets: any group ball on an open table,
 // your own group once assigned, or the 8 after clearing that group.
 const group=state.groups[state.turn];
 const eightReady=caromsEligible(state.balls,group);
 const targets=state.balls.filter(b=>!b.pocketed&&
  (group?(eightReady?b.id===8:groupOf(b.id)===group):Boolean(groupOf(b.id))));
 if(state.calledBall!==null&&!targets.some(b=>b.id===state.calledBall)){
  state.calledBall=null;state.calledPocket=null;
 }
 updateSelect($('caroms-striker'),available.map(b=>[b.id,'Strike ball '+b.id]),state.shooterBall);
 updateSelect($('caroms-call-ball'),targets.map(b=>[b.id,'Ball '+b.id]),state.calledBall,'Choose called ball');
 updateSelect($('caroms-call-pocket'),pockets.map(p=>[p.id,p.label]),state.calledPocket,'Choose pocket');
 $('caroms-call-controls').hidden=!needCall;
 $('caroms-turn').textContent=state.phase==='done'?'Rack complete':player(state.turn)+(state.breakShot?' · 1-ball break':' · '+level(state.turn));
 $('caroms-score').textContent='Best of 3 · Racks: '+player(0)+' '+matchWins[0]+' – '+player(1)+' '+matchWins[1]+' · '+
  state.groups.map((g,i)=>player(i)+': '+(g||'open table')+
  (g?' ('+liveGroupBalls(state.balls,g).length+' left)':'')).join('   ·   ');
 $('caroms-status').textContent=state.phase==='moving'?'Balls rolling…':
  state.phase==='option'?(isBot()?'Squatch Bot is choosing a foul option…':'Foul: incoming player chooses whether to move the white ball to center.'):
  state.phase==='done'?(matchWinner()>=0?player(matchWinner())+' wins the best-of-three match!':
   player(state.winner)+' wins this rack. Start the next rack.'):
  state.breakShot?(isBot()?'Squatch Bot is lining up the 1-ball break.':'Strike the 1-ball toward the white ball to break.'):
  needCall?'Select an object ball, call the ball and pocket, then aim and shoot.':
  'Select one of your object balls, aim from it through the white ball, then shoot.';
 $('caroms-option').hidden=state.phase!=='option';
 // The foul-option decision belongs to the incoming player, not the human
 // watching a solo Squatch Bot turn.
 for(const id of ['caroms-center','caroms-leave'])$(id).disabled=state.phase!=='option'||isBot();
 $('caroms-new').disabled=matchWinner()>=0;
 $('caroms-shoot').disabled=!canAim||state.shooterBall===null||
  (needCall&&(!state.calledBall||!state.calledPocket));
 $('caroms-shoot').textContent=state.breakShot?'BREAK WITH THE 1':'SHOOT';
 for(const id of ['caroms-striker','caroms-power','caroms-top','caroms-side'])
  $(id).disabled=!canAim;
 for(const id of ['caroms-call-ball','caroms-call-pocket'])$(id).disabled=!canAim||!needCall;
 $('caroms-undo').disabled=!canAim||!needCall||(!state.calledBall&&!state.calledPocket);
 for(const id of POCKET_BUTTONS){
  const button=$('caroms-pocket-'+id);
  if(!button)continue; // The older stacked Gameplay preview has no quick-call buttons.
  button.disabled=!canAim||!needCall;
  button.setAttribute('aria-pressed',String(state.calledPocket===id));
 }
 $('caroms-power-value').textContent=state.power+'%';
 $('caroms-top-value').textContent=state.spinTop+'%';
 $('caroms-side-value').textContent=state.spinSide+'%';
}
function newGame(){
 if(matchWinner()>=0)return;
 setTableSize(Number($('caroms-size').value));
 // Share the regulation table-size preference with But Wait across game modes.
 // Private browsing or disabled storage must never prevent a rack from starting.
 try{if(typeof localStorage!=='undefined')localStorage.setItem('squatch-table-size',String(TABLE.size));}catch{}
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 canvas.style.aspectRatio=String(TABLE.width/TABLE.height);
 const balls=fullRack(),one=balls.find(b=>b.id===1),white=balls.find(b=>b.id===0);
 one.x=TABLE.radius+TABLE.width*.11;one.y=TABLE.height/2;
 white.x=headStringX()+TABLE.radius*3;white.y=TABLE.height/2;
 cancelBot();
 state={balls,groups:[null,null],turn:caromsBreaker(matchWins),phase:'aim',breakShot:true,shooterBall:1,generation:(state?.generation||0)+1,
  angle:0,power:85,spinTop:0,spinSide:0,calledBall:null,calledPocket:null,
  shot:null,shotNumber:0,winner:null,statsRackId:newCaromsStatsId()};
 accumulator=0;
 $('caroms-power').value='85';$('caroms-top').value='0';$('caroms-side').value='0';
 $('caroms-log').replaceChildren();
 log('Fresh Caroms rack. '+player(state.turn)+' breaks. '+(solo()?'Solo vs Squatch Bot.':'Two-player local play.'));
 scheduleBot();
 update();
}
function newMatch(){
 matchWins=[0,0];newGame();
 log('New best-of-three match. First to two racks wins. Breaks alternate each rack (playtest rule).');
}
function respot(id){
 return respotCaromsBall(state.balls,id);
}
function finishShot(){
 const shot=state.shot;state.shot=null;
 const decision=caromsTurn({balls:state.balls,groups:state.groups,
  shooter:shot.player,shooterBall:shot.shooterBall,shotEvents:shot.events,
  level:shot.level,breakShot:shot.breakShot,calledBall:shot.calledBall,
  calledPocket:shot.calledPocket,eightEligibleBefore:shot.eightEligibleBefore});
 state.groups=decision.groups;
 // Every physically pocketed object ball counts, including slop and illegal shots.
 // White-ball scratches do not count. Reporting never blocks the local match.
 const made=decision.pocketed.filter(id=>id!==0).length;
 if(made)reportCaromsBalls(state.statsRackId,shot.statsShotId,made);
 if(decision.respotCue)respot(0);
 if(decision.respotEight)respot(8);
 log(player(shot.player)+': '+(decision.pocketed.filter(id=>id!==0).join(', ')||'no object balls')+
  '. '+decision.reason);
 if(decision.newGroup)log(player(shot.player)+' takes '+decision.newGroup+'.');
 state.breakShot=false;
 state.calledBall=null;state.calledPocket=null;
 if(decision.winner!==null){
  matchWins[decision.winner]++;
  state.winner=decision.winner;state.phase='done';
 }
 else{
  state.turn=decision.nextPlayer;
  state.phase=decision.cueOption?'option':'aim';
 }
 update();scheduleBot();
}
function hit(fromBot=false){
 // A disabled button is a UI hint, not a turn-ownership check. Reject even
 // synthetic clicks on the human Shoot control while Squatch Bot is aiming.
 if(state.phase!=='aim'||(isBot()&&fromBot!==true))return;
 const needCall=!state.breakShot&&caromsCallRequired(level(state.turn),
  caromsEligible(state.balls,state.groups[state.turn]));
 if(needCall&&(!state.calledBall||!state.calledPocket))return;
 const b=striker();if(!b||b.pocketed)return;
 const speed=shotSpeed(state.power,state.breakShot);
 b.vx=Math.cos(state.angle)*speed;b.vy=Math.sin(state.angle)*speed;
 applyCueSpin(b,state.spinTop/100,state.spinSide/100);
 state.shot={player:state.turn,shooterBall:b.id,events:[],time:0,stillFrames:0,
  level:level(state.turn),breakShot:state.breakShot,calledBall:state.calledBall,
  calledPocket:state.calledPocket,
  eightEligibleBefore:caromsEligible(state.balls,state.groups[state.turn]),
  statsShotId:newCaromsStatsId()};
 if(state.breakShot)reportCaromsRack(state.statsRackId);
 state.phase='moving';state.shotNumber++;
 state.power=68;state.spinTop=0;state.spinSide=0;
 $('caroms-power').value='68';$('caroms-top').value='0';$('caroms-side').value='0';
 update();
}
function chooseOption(center,fromBot=false){
 if(state.phase!=='option'||(isBot()&&!fromBot))return;
 if(center&&!respot(0)){log('No clear center placement; white ball stays put.');}
 else if(center)log(player(state.turn)+' moved the white ball near table center.');
 state.phase='aim';update();scheduleBot();
}
function draw(){
 const w=TABLE.width,h=TABLE.height,r=TABLE.radius;
 ctx.fillStyle='#175f4b';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#61452f';
 ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);
 ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
 for(const p of pockets)renderPocket(ctx,p);
 ctx.strokeStyle='#b58a53';ctx.lineWidth=3;ctx.beginPath();
 for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}
 ctx.stroke();
 ctx.strokeStyle='#ffffff50';ctx.setLineDash([6,8]);ctx.beginPath();
 ctx.moveTo(headStringX(),r);ctx.lineTo(headStringX(),h-r);ctx.stroke();ctx.setLineDash([]);
 for(const b of state.balls){
  if(b.pocketed)continue;
  ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);
  ctx.fillStyle=b.id===0?'#f8f6ed':b.id===8?'#14171b':groupOf(b.id)==='solids'?'#d9aa41':'#4a80b2';
  ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#ffffffaa';ctx.stroke();
  if(b.id!==0){
   ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(String(b.id),b.x,b.y);
  }
 }
 // Match the original called-shot flow: no visible stick or aim guide until
 // the called ball and pocket are locked. Break and slop levels remain exempt.
 const callPending=!state.breakShot&&
  caromsCallRequired(level(state.turn),caromsEligible(state.balls,state.groups[state.turn]))&&
  (state.calledBall===null||state.calledPocket===null);
 if(state.phase==='aim'&&!callPending&&striker()&&!striker().pocketed){
  const b=striker(),dx=Math.cos(state.angle),dy=Math.sin(state.angle);
  ctx.strokeStyle='#fce2a8';ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();
  ctx.moveTo(b.x+dx*(r+4),b.y+dy*(r+4));
  ctx.lineTo(b.x+dx*300,b.y+dy*300);ctx.stroke();ctx.setLineDash([]);
  ctx.lineWidth=5;ctx.strokeStyle='#dfb37c';ctx.beginPath();
  ctx.moveTo(b.x-dx*(r+22),b.y-dy*(r+22));
  ctx.lineTo(b.x-dx*(r+170),b.y-dy*(r+170));ctx.stroke();
  ctx.strokeStyle='#ffde7b';ctx.lineWidth=3;ctx.beginPath();
  ctx.arc(b.x,b.y,r+5,0,Math.PI*2);ctx.stroke();
 }
}
function frame(t){
 const elapsed=lastTime?Math.min(.25,Math.max(0,(t-lastTime)/1000)):0;lastTime=t;
 if(state?.phase==='moving'){
  accumulator=Math.min(.35,accumulator+elapsed);let n=0;
  while(accumulator>=1/120&&n++<24){
   const result=step(state.balls,1/120);
   state.shot.events.push(...result.shotEvents);
   state.shot.time+=1/120;
   state.shot.stillFrames=stationary(state.balls)?state.shot.stillFrames+1:0;
   accumulator-=1/120;
   if(state.shot.stillFrames>24||state.shot.time>20){
    if(state.shot.time>20){
     // A safety timeout must not leave rolling balls in the next player's shot.
     for(const b of state.balls)if(!b.pocketed){
      b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;b.motion='stationary';
     }
     log('20-second shot limit reached; balls stopped before the next turn.');
    }
    accumulator=0;finishShot();break;
   }
  }
 }
 if(state)draw();
 requestAnimationFrame(frame);
}
function point(e){
 const rect=canvas.getBoundingClientRect();
 return{x:(e.clientX-rect.left)*TABLE.width/rect.width,
  y:(e.clientY-rect.top)*TABLE.height/rect.height};
}
function aim(p){
 const b=striker();if(!b||state.phase!=='aim')return;
 const angle=angleFromPointer(b,p,invertAim(),radiansToPixels());
 if(angle!==null)state.angle=angle;
}
const radiansToPixels=()=>TABLE.radius;
let dragging=false,startedOnBall=false,dragStart=null;
const movedFromStart=e=>dragStart&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&
 Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y)>=6;
canvas.addEventListener('pointerdown',e=>{
 if(state.phase!=='aim'||!humanTurn())return;
 const p=point(e),nearest=eligibleBalls().map(b=>({b,d:Math.hypot(b.x-p.x,b.y-p.y)}))
  .sort((a,b)=>a.d-b.d)[0];
 // Regulation balls render only ~7px wide on a phone. Keep the real ball
 // geometry unchanged, but make touch/pen selection forgiving in CSS pixels.
 // Mouse users retain precise hit testing for aiming on the surrounding felt.
 const rect=canvas.getBoundingClientRect();
 const cssHitRadius=e.pointerType==='touch'?22:e.pointerType==='pen'?16:0;
 const hitRadius=Math.max(TABLE.radius*2.4,
  cssHitRadius&&rect.width>0?cssHitRadius*TABLE.width/rect.width:0);
 dragStart={x:e.clientX,y:e.clientY};
 startedOnBall=Boolean(nearest&&nearest.d<hitRadius);
 if(startedOnBall){
  // Tapping a ball selects it without rotating the cue. A deliberate drag
  // (6 CSS pixels) selects and aims in one gesture, even on a small phone.
  if(state.shooterBall!==nearest.b.id)state.angle=0;
  state.shooterBall=nearest.b.id;
  // One-touch calling: an advanced player may tap the intended object ball,
  // then choose a pocket. The selector still supports calling a different ball.
  if(!state.breakShot&&state.calledBall===null&&
   caromsCallRequired(level(state.turn),caromsEligible(state.balls,state.groups[state.turn])))
   state.calledBall=nearest.b.id;
  update();
  dragging=true;canvas.setPointerCapture(e.pointerId);return;
 }
 dragging=true;canvas.setPointerCapture(e.pointerId);aim(p);
});
canvas.addEventListener('pointermove',e=>{
 if(dragging&&(!startedOnBall||movedFromStart(e)))aim(point(e));
});
canvas.addEventListener('pointerup',e=>{
 // Some touch devices deliver the final position only with pointerup.
 // Do not reinterpret a stationary finger tap as an aim command.
 if(dragging&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&
  (!startedOnBall||movedFromStart(e)))aim(point(e));
 dragging=false;startedOnBall=false;dragStart=null;
});
canvas.addEventListener('pointercancel',()=>{
 dragging=false;startedOnBall=false;dragStart=null;
});
$('caroms-striker').addEventListener('change',e=>{state.shooterBall=Number(e.target.value);update();});
$('caroms-call-ball').addEventListener('change',e=>{state.calledBall=e.target.value?Number(e.target.value):null;update();});
$('caroms-call-pocket').addEventListener('change',e=>{state.calledPocket=e.target.value||null;update();});
for(const id of POCKET_BUTTONS){
 $('caroms-pocket-'+id)?.addEventListener('click',()=>{
  if(state.phase!=='aim'||state.breakShot||
   !caromsCallRequired(level(state.turn),caromsEligible(state.balls,state.groups[state.turn])))return;
  state.calledPocket=id;update();
 });
}
$('caroms-undo').addEventListener('click',()=>{
 if(state.phase!=='aim')return;
 state.calledBall=null;state.calledPocket=null;update();
});
for(const [id,key] of [['caroms-power','power'],['caroms-top','spinTop'],['caroms-side','spinSide']]){
 $(id).addEventListener('input',e=>{state[key]=Number(e.target.value);update();});
}
for(const i of [0,1])$('caroms-level-'+i).addEventListener('change',update);
$('caroms-shoot').addEventListener('click',hit);
$('caroms-new').addEventListener('click',newGame);
$('caroms-match-reset').addEventListener('click',newMatch);
$('caroms-size').addEventListener('change',newMatch);
$('caroms-mode').addEventListener('change',newMatch);
$('caroms-center').addEventListener('click',()=>chooseOption(true));
$('caroms-leave').addEventListener('click',()=>chooseOption(false));
window.addEventListener('keydown',e=>{
 // Let focused buttons, links, sliders and other controls handle their own keys.
 // Space on Undo/New rack must never fire a shot instead of activating the control.
 const tag=e.target?.tagName?.toLowerCase();
 if(!state||state.phase!=='aim'||!humanTurn()||e.target?.isContentEditable||
  (tag&&!['body','html','canvas'].includes(tag))||
  e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'){state.angle-=.025;e.preventDefault();}
 if(e.key==='ArrowRight'){state.angle+=.025;e.preventDefault();}
 if(e.code==='Space'){hit();e.preventDefault();}
});
// Restore the same 7/8/9-ft preference used by the original playable game.
try{
 if(typeof localStorage!=='undefined'){
  const saved=localStorage.getItem('squatch-table-size');
  if(['7','8','9'].includes(saved))$('caroms-size').value=saved;
 }
}catch{}
initCaromsStats();newMatch();requestAnimationFrame(frame);
