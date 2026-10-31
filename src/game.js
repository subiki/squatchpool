import {TABLE,pockets,cushions,ball,rack,step,stationary,canPlace,findPlacement,clearShot,clamp,distance,applyCueSpin,headStringX,canPlaceBreakCue,kitchenPoint,shotSpeed} from './physics.js';
import {renderPocket,facings,setTableSize} from './table-geometry.js';
import {initStats,newStatsId,reportRack,reportBalls} from './stats.js';
import {groupOf,otherGroup,otherPlayer,stashBall,resolveSurpriseChoice,readyForStash,readyForEight,liveGroupBalls,adjudicate} from './rules.js';
import {bindInvertAim,angleFromPointer} from './aim-preference.js';
const $=s=>document.querySelector(s),canvas=$('#table'),ctx=canvas.getContext('2d');
const colors=['#fffdf3','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39','#161819','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39'];
let state,lastTime=0,accumulator=0,botTimer=null,selectedTableSize=7;
const invertAim=bindInvertAim($('#invert-aim'));
const person=i=>i===0?(state.mode==='bot'?'You':'Player 1'):(state.mode==='bot'?'Speed Squatch':'Player 2');
const human=i=>state.mode==='local'||i===0;
const cue=()=>state.balls.find(b=>b.id===0);
function say(message){$('#announcer-text').textContent=message;}
function log(message){
 const list=$('#shot-log'),li=document.createElement('li');li.textContent=message;list.prepend(li);
 while(list.children.length>12)list.lastElementChild.remove();
}
function newGame(){
 clearTimeout(botTimer);
 setTableSize(selectedTableSize);
 for(const button of document.querySelectorAll('.table-size-pick')){
  const chosen=Number(button.dataset.size)===TABLE.size;
  button.classList.toggle('selected',chosen);
  button.setAttribute('aria-pressed',String(chosen));
 }
 canvas.width=Math.round(TABLE.width);
 canvas.height=Math.round(TABLE.height);
 // Canonical simulation coordinates must match the browser's pixel canvas.
 // The fractional logical dimensions are retained for inch-perfect physics.
 $('.table-playfield')?.style?.setProperty('--table-aspect',String(TABLE.width/TABLE.height));
 $('#table-dimensions').textContent=TABLE.size+' FT · '+TABLE.playingLengthIn+' × '+TABLE.playingWidthIn+' IN';
 try{if(typeof localStorage!=='undefined')localStorage.setItem('squatch-table-size',String(TABLE.size));}catch{}
 state={mode:$('#mode').value,balls:rack(),groups:[null,null],deployed:{solids:false,stripes:false},heldBalls:[7,15],turn:0,phase:'placeBreak',angle:0,power:85,spinTop:0,spinSide:0,callBall:null,callPocket:null,isBreak:true,shotNumber:0,shot:null,pendingStash:null,pendingStashBall:null,pendingStashPoint:null,pendingCue:false,winner:null,statsRackId:newStatsId(),generation:(state?.generation||0)+1};
 accumulator=0;$('#power').value='85';$('#spin-top').value='0';$('#spin-side').value='0';$('#result-modal').hidden=true;$('#shot-log').replaceChildren();
 log('Fresh rack. 7 and 15 are hiding in the back room.');
 say('Break setup: tap or drag anywhere in the shaded kitchen. You can change its position before BREAK!');update();
}
function callTargets(){
 const group=state.groups[state.turn];
 return state.balls.filter(b=>!b.pocketed&&b.id!==0&&(
  group?(readyForEight(state.balls,group,state.deployed[group])?b.id===8:groupOf(b.id)===group):groupOf(b.id)));
}
// One clear interaction sequence: ball → pocket → aim → shoot.
const callReady=()=>state.isBreak||(state.callBall!==null&&Boolean(state.callPocket));
const canPickCall=()=>state.phase==='aim'&&!state.isBreak&&human(state.turn);
function selectCallBall(id){
 if(!canPickCall()||!callTargets().some(b=>b.id===id))return;
 state.callBall=id;state.callPocket=null;
 say('Called '+id+'-ball. Now tap one of the six glowing pocket targets.');
 update();
}
function selectCallPocket(id){
 if(!canPickCall()||state.callBall===null||!pockets.some(p=>p.id===id))return;
 state.callPocket=id;
 const p=pockets.find(p=>p.id===id);
 say('Called '+state.callBall+'-ball to '+p.label+'. Now aim on the felt and press SHOOT.');
 update();
}
function undoCall(){
 if(!canPickCall()||(state.callBall===null&&!state.callPocket))return;
 state.callBall=null;state.callPocket=null;
 say('Call cleared. Tap an object ball to start again.');
 update();
}
function updateCallUI(){
 const available=callTargets();
 if(state.callBall!==null&&!available.some(b=>b.id===state.callBall)){
  state.callBall=null;state.callPocket=null;
 }
 const picking=canPickCall();
 const pickingBall=picking&&state.callBall===null;
 const pickingPocket=picking&&state.callBall!==null&&!state.callPocket;
 const p=pockets.find(p=>p.id===state.callPocket);
 $('#call-ball-status').textContent=state.callBall===null?'Ball: —':'Ball: '+state.callBall;
 $('#call-pocket-status').textContent=p?'Pocket: '+p.label:'Pocket: —';
 $('#undo-call').disabled=!picking||(state.callBall===null&&!state.callPocket);
 $('#pocket-targets').hidden=!pickingPocket;
 const choices=$('#ball-picks');
 choices.hidden=!pickingBall;
 if(pickingBall){
  choices.replaceChildren(...available.map(b=>{
   const button=document.createElement('button');
   button.type='button';button.className='ball-pick';
   button.textContent=String(b.id);button.setAttribute('aria-label','Call '+b.id+'-ball');
   button.addEventListener('click',()=>selectCallBall(b.id));
   return button;
  }));
 }else if(choices.children.length)choices.replaceChildren();
 $('#call-hint').textContent=state.isBreak?(state.phase==='placeBreak'?'Break: first position the white ball in the shaded kitchen.':'Break: no called ball or pocket needed. Aim and shoot.'):
  !picking?(state.phase==='aim'?'Speed Squatch is calling a shot.':'Calls lock once you shoot.'):
  pickingBall?'1. Tap a ball on the table (or its number below).':
  pickingPocket?'2. Tap a glowing pocket number on the table.':
  '3. Aim from the white ball. Then press SHOOT.';
}

function updateSurpriseUI(){
 const choosing=state.phase==='placeStash';
 $('#stash-panel').hidden=!choosing;
 if(!choosing)return;
 const actor=otherPlayer(state.turn);
 $('#stash-actor').textContent=person(actor)+' chooses and places a held ball';
 $('#stash-instructions').textContent=state.pendingStashBall===null?
  'Choose the held 7 or 15. Either can be placed to help or block the shooter.':
  state.pendingStashPoint?'Preview ready. Confirm this spot, or tap elsewhere to move it.':
  'Tap an empty spot on the table to preview the '+state.pendingStashBall+'-ball.';
 for(const [id,selector] of [[7,'#stash-solid'],[15,'#stash-stripe']]){
  const button=$(selector);button.hidden=!state.heldBalls.includes(id);
  button.disabled=!human(actor);
  button.setAttribute('aria-pressed',String(state.pendingStashBall===id));
 }
 $('#stash-confirm').disabled=!human(actor)||state.pendingStashBall===null||!state.pendingStashPoint;
}
function update(){
 updateCallUI();
 updateSurpriseUI();
 for(let i=0;i<2;i++){
  $('#player-'+i).classList.toggle('active',state.turn===i&&state.winner===null);
  $('#player-name-'+i).textContent=person(i);
  const g=state.groups[i];
  $('#player-group-'+i).textContent=g?(g[0].toUpperCase()+g.slice(1))+(state.deployed[g]?' · surprise resolved':' · surprise pending'):'Open table';
  $('#player-count-'+i).textContent=g?String(liveGroupBalls(state.balls,g).length+(!state.deployed[g]&&state.heldBalls.includes(stashBall(g))?1:0))+' left':'—';
 }
 $('#shot-counter').textContent=state.shotNumber===0?'Break shot':'Shot '+(state.shotNumber+1);
 $('#table-status').textContent=state.phase==='placeBreak'?'PLACE BREAK CUE':state.phase==='placeStash'?'SURPRISE BALL!':state.phase==='placeCue'?'BALL IN HAND':
  state.phase==='aim'&&!state.isBreak&&human(state.turn)?(state.callBall===null?'PICK A BALL':!state.callPocket?'PICK A POCKET':'AIM & SHOOT'):
  state.groups[0]?'GROUPS SET':'OPEN TABLE';
 $('#power-value').textContent=state.power+'%';
 $('#spin-top-value').textContent=state.spinTop>0?'Follow '+state.spinTop+'%':state.spinTop<0?'Draw '+(-state.spinTop)+'%':'Center';
 $('#spin-side-value').textContent=state.spinSide>0?'Right '+state.spinSide+'%':state.spinSide<0?'Left '+(-state.spinSide)+'%':'Center';
 const actor=state.phase==='placeStash'?otherPlayer(state.turn):state.turn;
 const title={placeBreak:'Place the break cue ball',aim:person(state.turn)+(state.shotNumber===0?' breaks':' shoots'),moving:'Balls rolling…',placeCue:'Ball in hand',placeStash:"But wait… THERE'S MORE!",done:'Rack finished!'};
 const hint={placeBreak:'Tap or drag anywhere in the shaded kitchen (even close to the rails), release, then aim.',aim:human(actor)?(state.isBreak?'Break: aim, power, SHOOT.':!state.callBall?'Tap the object ball you want to call.':!state.callPocket?'Now tap one of the pocket targets.':'Call set. Tap or drag on the felt to aim, then SHOOT.'):'Speed Squatch is sizing up the shot…',moving:'Let the balls come to rest.',placeCue:'Your opponent fouled. Tap a clear spot to place the white ball.',placeStash:'Opponent: choose a held ball, tap a legal spot on the table, then confirm placement.',done:'Rack again to play another game.'};
 $('#control-title').textContent=title[state.phase];$('#control-hint').textContent=hint[state.phase];
 $('#shoot').disabled=state.phase!=='aim'||!human(state.turn)||!callReady();
 $('#move-cue').hidden=!state.isBreak||!human(state.turn)||!['placeBreak','aim'].includes(state.phase);
 $('#move-cue').disabled=state.phase==='placeBreak';
 $('#shoot').textContent=state.isBreak?'BREAK!':'SHOOT ➜';
 $('#power').disabled=state.phase!=='aim'||!human(state.turn)||!callReady();
 $('#spin-top').disabled=$('#spin-side').disabled=state.phase!=='aim'||!human(state.turn)||!callReady();
 // Called shots must remain discoverable when the primary kit is fullscreen.
 if(state.phase==='aim'&&!state.isBreak&&human(state.turn)&&!callReady())$('#but-wait-more').open=true;
}
function revealStashIfNeeded(){
 const group=state.groups[state.turn];
 if(!readyForStash(state.balls,group,state.deployed[group]))return false;
 state.pendingStash=group;state.pendingStashBall=null;state.pendingStashPoint=null;
 state.phase='placeStash';
 say("BUT WAIT, THERE'S MORE! "+person(otherPlayer(state.turn))+' chooses the held 7 or 15, then places it on the table.');
 if(!human(otherPlayer(state.turn))){
  const token=state.generation;
  botTimer=setTimeout(()=>{if(state.generation===token&&state.phase==='placeStash'){
   // The bot chooses deliberately; never silently derive the ball from the shooter.
   const preferred=stashBall(group);
   state.pendingStashBall=state.heldBalls.includes(preferred)?preferred:state.heldBalls[0];
   const eight=state.balls.find(b=>b.id===8&&!b.pocketed);
   const p=findPlacement(state.balls,eight?{x:eight.x+TABLE.radius*2.2,y:eight.y}:{x:TABLE.width/2,y:TABLE.height/2});
   if(p){state.pendingStashPoint=p;placeStash(p);}
   else say('No legal placement found for the held ball.');
  }},680);
 }
 return true;
}
function resume(){
 if(state.winner!==null)return;
 if(state.pendingCue){
  state.phase='placeCue';
  if(!human(state.turn)){
   const token=state.generation;
   botTimer=setTimeout(()=>{if(state.generation===token&&state.phase==='placeCue'){
    const p=findPlacement(state.balls,{x:260,y:250});if(p)placeCue(p);
   }},680);
  }
 }else if(!revealStashIfNeeded()){
  state.phase='aim';if(!human(state.turn))planBotShot();
 }
 update();
}
function placeBreakCue(point){
 if(state.phase!=='placeBreak')return false;
 const {x,y}=kitchenPoint(point.x,point.y);
 if(!canPlaceBreakCue(state.balls,x,y)){
  say('The cue ball must fit within the kitchen without overlapping a ball.');
  return false;
 }
 Object.assign(cue(),{x,y,vx:0,vy:0,wx:0,wy:0,wz:0,pocketed:false});
 return true;
}
function finishBreakPlacement(){
 if(state.phase!=='placeBreak')return;
 state.phase='aim';
 state.angle=0;
 say('Break cue placed. Aim on the table, set break power, then press BREAK!');
 update();
}
function moveBreakCue(){
 if(!state.isBreak||state.phase!=='aim'||!human(state.turn))return;
 state.phase='placeBreak';
 say('Tap or drag the cue ball in the shaded kitchen. Release to aim.');
 update();
}
function placeCue({x,y}){
 if(!canPlace(state.balls,x,y,0)){say('That spot is blocked. Try a clear spot.');return;}
 Object.assign(cue(),{x,y,vx:0,vy:0,pocketed:false});
 state.pendingCue=false;say(person(state.turn)+' has ball in hand.');resume();
}
function selectStashBall(id){
 if(state.phase!=='placeStash'||!human(otherPlayer(state.turn))||!state.heldBalls.includes(id))return;
 state.pendingStashBall=id;state.pendingStashPoint=null;
 say('Selected the held '+id+'-ball. Tap a legal spot on the table, then confirm.');
 update();
}
function previewStash({x,y}){
 if(state.phase!=='placeStash'||!human(otherPlayer(state.turn)))return;
 if(state.pendingStashBall===null){say('First choose the held 7 or 15 below the table.');return;}
 if(!canPlace(state.balls,x,y)){say('That spot is blocked. Tap another location.');return;}
 state.pendingStashPoint={x,y};
 say('Previewing the '+state.pendingStashBall+'-ball. Confirm below or tap to reposition.');
 update();
}
function placeStash({x,y}){
 if(state.phase!=='placeStash'||state.pendingStashBall===null||!canPlace(state.balls,x,y))return;
 const group=state.pendingStash,id=state.pendingStashBall;
 const resolved=resolveSurpriseChoice(state.heldBalls,state.deployed,group,id);
 if(!resolved)return;
 state.balls.push(ball(id,x,y));
 state.heldBalls=resolved.heldBalls;state.deployed=resolved.deployed;
 state.pendingStash=null;state.pendingStashBall=null;state.pendingStashPoint=null;
 log(person(otherPlayer(state.turn))+' chose and placed the held '+id+'-ball. '+(state.heldBalls.length?state.heldBalls.join(', ')+' still held.':'No balls remain held.'));
 say('The '+id+'-ball is on the table. '+(groupOf(id)===group?'Clear it before your 8.':'Your 8 is available if your own group is clear.'));
 resume();
}
function aimFrom(p){
 if(state.phase!=='aim'||!human(state.turn)||!callReady())return;
 const angle=angleFromPointer(cue(),p,invertAim(),8);
 if(angle!==null)state.angle=angle;
}
function resetShotControls(){
 // Each stroke consumes its own power/draw/English settings. Restore neutral
 // controls immediately after striking, ready for the next shooter.
 state.power=68;state.spinTop=0;state.spinSide=0;
 $('#power').value='68';$('#spin-top').value='0';$('#spin-side').value='0';
}
function hit(direction=state.angle,power=state.power){
 if(state.phase!=='aim'||!callReady())return;
 const b=cue();if(!b||b.pocketed)return;
 const speed=shotSpeed(power,state.isBreak);
 b.vx=Math.cos(direction)*speed;b.vy=Math.sin(direction)*speed;
 applyCueSpin(b,state.spinTop/100,state.spinSide/100);
 state.shot={player:state.turn,statsRackId:state.statsRackId,statsShotId:newStatsId(),balls:[],pocketEvents:[],calledBall:state.isBreak?null:state.callBall,calledPocket:state.isBreak?null:state.callPocket,firstContact:null,time:0,stillFrames:0,breakShot:state.isBreak,preShotReadyForEight:readyForEight(state.balls,state.groups[state.turn],state.deployed[state.groups[state.turn]])};
 if(state.isBreak)reportRack(state.statsRackId);
 state.shotNumber++;state.isBreak=false;state.phase='moving';
 resetShotControls();
 say(person(state.turn)+' lets it fly!');update();
}
function finishShot(){
 if(state.phase!=='moving'||!state.shot)return;
 const shot=state.shot;state.shot=null;
 // Stroke controls were reset at strike, not delayed until balls settled.
 const decision=adjudicate({balls:state.balls,shooter:shot.player,groups:state.groups,deployed:state.deployed,pocketed:shot.balls,pocketEvents:shot.pocketEvents,calledBall:shot.calledBall,calledPocket:shot.calledPocket,firstContact:shot.firstContact,breakShot:shot.breakShot,preShotReadyForEight:shot.preShotReadyForEight});
 const potted=shot.balls.filter(n=>n!==0);
 if(potted.length)reportBalls(shot.statsRackId,shot.statsShotId,potted.length);
 log(person(shot.player)+': '+(potted.length?'pocketed '+potted.join(', '):'no balls')+(shot.balls.includes(0)?' • scratch':'')+'. '+decision.reason);
 if(decision.newGroup){
  state.groups[shot.player]=decision.newGroup;
  state.groups[otherPlayer(shot.player)]=otherGroup(decision.newGroup);
  log(person(shot.player)+' claims '+decision.newGroup+'. The other player takes '+otherGroup(decision.newGroup)+'.');
 }
 if(decision.winner!==null){
  state.winner=decision.winner;state.phase='done';
  $('#result-title').textContent=person(decision.winner)+' wins!';
  $('#result-description').textContent=decision.reason;
  $('#result-modal').hidden=false;say(decision.reason);update();return;
 }
 if(!decision.keepTurn)state.turn=otherPlayer(state.turn);
 state.callBall=null;state.callPocket=null;
 state.pendingCue=decision.foul;
 if(decision.foul){const b=cue();b.pocketed=true;b.vx=0;b.vy=0;}
 say(decision.reason);resume();
}
function planBotShot(){
 const token=state.generation;
 botTimer=setTimeout(()=>{
  if(token!==state.generation||state.turn!==1||state.phase!=='aim')return;
  const b=cue(),group=state.groups[1];
  const ids=group?(readyForEight(state.balls,group,state.deployed[group])?[8]:state.balls.filter(o=>!o.pocketed&&groupOf(o.id)===group).map(o=>o.id)):state.balls.filter(o=>!o.pocketed&&groupOf(o.id)).map(o=>o.id);
  const targets=state.balls.filter(o=>ids.includes(o.id));let best=null;
  for(const target of targets)for(const pocket of pockets){
   const pdx=pocket.x-target.x,pdy=pocket.y-target.y,len=Math.hypot(pdx,pdy);if(len<1)continue;
   const ghost={x:target.x-pdx/len*2*TABLE.radius,y:target.y-pdy/len*2*TABLE.radius};
   if(ghost.x<TABLE.radius||ghost.x>TABLE.width-TABLE.radius||ghost.y<TABLE.radius||ghost.y>TABLE.height-TABLE.radius)continue;
   if(!clearShot(state.balls,b,ghost,[0,target.id])||!clearShot(state.balls,target,pocket,[target.id,0]))continue;
   const score=distance(b,ghost)+len*.8;if(!best||score<best.score)best={point:ghost,score,targetId:target.id,pocketId:pocket.id};
  }
  if(!best&&targets.length){
   const target=targets.sort((a,c)=>distance(a,b)-distance(c,b))[0];
   const pocket=pockets.slice().sort((a,c)=>distance(target,a)-distance(target,c))[0];
   best={point:target,score:distance(b,target),targetId:target.id,pocketId:pocket.id};
  }
  const angle=best?Math.atan2(best.point.y-b.y,best.point.x-b.x):0;
  state.angle=angle+(Math.random()-.5)*.028;
  state.callBall=best?.targetId??null;state.callPocket=best?.pocketId??null;
  hit(state.angle,clamp(60+(best?.score||300)/27,56,95));
 },900);
}
function drawBall(b){
 const {x,y,id}=b,r=TABLE.radius;
 ctx.fillStyle='#04191599';ctx.beginPath();ctx.ellipse(x+2,y+3.6,r+1.4,r*.78,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y);ctx.fillStyle=colors[id];ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.fill();
 if(id>=9){ctx.fillStyle='#faf8eb';ctx.fillRect(-r*.86,-r*.42,r*1.72,r*.84);
  ctx.save();ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.clip();
  ctx.fillStyle=colors[id];ctx.fillRect(-r,-r,r*2,r*.42);ctx.fillRect(-r,r*.42,r*2,r);ctx.restore();
 }
 const gleam=ctx.createRadialGradient(-r*.4,-r*.5,0,-r*.1,-r*.2,r*1.5);
 gleam.addColorStop(0,'#ffffff99');gleam.addColorStop(.35,'#ffffff00');gleam.addColorStop(1,'#00000066');
 ctx.fillStyle=gleam;ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.fill();
 if(id!==0){ctx.fillStyle='#f9f7e9';ctx.beginPath();ctx.arc(0,0,5.4,0,2*Math.PI);ctx.fill();ctx.fillStyle='#1c2020';ctx.font='bold '+(id>9?7.5:9)+'px Arial';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(String(id),0,.6)}
 ctx.restore();
}
function render(){
 const w=TABLE.width,h=TABLE.height,r=TABLE.radius,gr=ctx.createRadialGradient(w*.44,h*.42,100,w*.5,h*.5,710);
 gr.addColorStop(0,'#217766');gr.addColorStop(1,'#104638');ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
 // Rail tops are wood inside the canvas; diamond inlays stay on the wood.
 ctx.fillStyle='#5d402a';ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);
 ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
 for(const p of pockets)renderPocket(ctx,p);
 ctx.save();ctx.strokeStyle='#a6865f';ctx.lineWidth=2.5;ctx.lineCap='round';
 ctx.beginPath();for(const f of facings){ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);}
 ctx.stroke();ctx.restore();
 // Visible cushion faces line up with the physics collision planes (ball centers at radius r).
 // The former decorative inset rectangle looked like an invisible second set of rails.
 ctx.save();ctx.strokeStyle='#b58a53';ctx.lineWidth=3;
 ctx.beginPath();
 for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}
 ctx.stroke();ctx.restore();
 // Regulation head string: break cue center must remain behind this line.
 if(state.phase==='placeBreak'){
  ctx.fillStyle='#e6cb7135';ctx.fillRect(2*r,2*r,headStringX()-2*r,h-4*r);
 }
 ctx.setLineDash([6,9]);ctx.strokeStyle=state.phase==='placeBreak'?'#ffe6a5':'#f7e8c129';
 ctx.lineWidth=state.phase==='placeBreak'?3:1;
 ctx.beginPath();ctx.moveTo(headStringX(),r);ctx.lineTo(headStringX(),h-r);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#e6c89566';ctx.beginPath();ctx.arc(r+(w-2*r)*.75,h/2,3,0,2*Math.PI);ctx.fill();
 if(state.phase==='aim'&&state.callPocket){
  const p=pockets.find(p=>p.id===state.callPocket);
  if(p){ctx.save();ctx.strokeStyle='#ffe2a3';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();
   ctx.arc(p.x+(p.kind==='corner'?p.sx*25:0),p.y+(p.kind==='corner'?p.sy*25:p.sy*14),14,0,Math.PI*2);
   ctx.stroke();ctx.restore();}
 }
 for(let i=1;i<=7;i++)for(const y of [r/2,h-r/2]){ctx.save();ctx.translate(i*w/8,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#d6ab6a';ctx.fillRect(-3,-3,6,6);ctx.restore();}
 for(let i=1;i<=3;i++)for(const x of [r/2,w-r/2]){ctx.save();ctx.translate(x,i*h/4);ctx.rotate(Math.PI/4);ctx.fillStyle='#d6ab6a';ctx.fillRect(-3,-3,6,6);ctx.restore();}
 if(state.phase==='aim'){
  if(!state.isBreak&&state.callBall===null&&human(state.turn)){
   ctx.save();ctx.strokeStyle='#f2dfa5';ctx.lineWidth=1.8;
   for(const b of callTargets()){ctx.beginPath();ctx.arc(b.x,b.y,r+6,0,Math.PI*2);ctx.stroke();}
   ctx.restore();
  }
  if(state.callBall!==null){const selected=state.balls.find(b=>b.id===state.callBall&&!b.pocketed);
   if(selected){ctx.save();ctx.strokeStyle='#ffdf84';ctx.lineWidth=2;ctx.beginPath();ctx.arc(selected.x,selected.y,r+5,0,2*Math.PI);ctx.stroke();ctx.restore();}}
  const cb=cue();if(callReady()&&cb&&!cb.pocketed){
   const dx=Math.cos(state.angle),dy=Math.sin(state.angle);let reach=Math.hypot(w,h);
   for(const b of state.balls){if(b.pocketed||b.id===0)continue;
    const tx=b.x-cb.x,ty=b.y-cb.y,proj=tx*dx+ty*dy;if(proj<=0)continue;
    const side=Math.abs(tx*dy-ty*dx);if(side<2*r){
     const approach=proj-Math.sqrt(Math.max(0,(2*r)**2-side**2));if(approach>0)reach=Math.min(reach,approach);
    }
   }
   ctx.save();ctx.setLineDash([11,11]);ctx.lineWidth=2.5;ctx.strokeStyle='#f0dda4ad';ctx.beginPath();ctx.moveTo(cb.x+dx*16,cb.y+dy*16);ctx.lineTo(cb.x+dx*reach,cb.y+dy*reach);ctx.stroke();ctx.setLineDash([]);
   const back=30+state.power/100*45;
   ctx.strokeStyle='#d4a76c';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cb.x-dx*(r+back),cb.y-dy*(r+back));ctx.lineTo(cb.x-dx*(r+back+180),cb.y-dy*(r+back+180));ctx.stroke();
   ctx.strokeStyle='#78c3bd';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cb.x-dx*(r+back),cb.y-dy*(r+back));ctx.lineTo(cb.x-dx*(r+back+15),cb.y-dy*(r+back+15));ctx.stroke();ctx.restore();
  }
 }
 if(state.phase==='placeBreak'||state.phase==='placeCue'||state.phase==='placeStash'){
  ctx.fillStyle='#f2d6a6ed';ctx.font='bold 25px system-ui';ctx.textAlign='center';
  ctx.fillText(state.phase==='placeBreak'?'POSITION WHITE BALL BEHIND HEAD STRING':state.phase==='placeCue'?'TAP TO PLACE CUE BALL':'TAP TO PLACE THE SURPRISE BALL',w/2,40);
 }
 for(const b of state.balls)if(!b.pocketed)drawBall(b);
 if(state.phase==='placeStash'&&state.pendingStashBall!==null&&state.pendingStashPoint){
  ctx.save();ctx.globalAlpha=.6;
  drawBall(ball(state.pendingStashBall,state.pendingStashPoint.x,state.pendingStashPoint.y));
  ctx.restore();
  ctx.beginPath();ctx.arc(state.pendingStashPoint.x,state.pendingStashPoint.y,TABLE.radius+7,0,2*Math.PI);
  ctx.lineWidth=3;ctx.strokeStyle='#ffe7a4';ctx.stroke();
 }
}
function frame(timestamp){
 // The old .08s clamp plus discarded substeps caused visible slow motion
 // on busy/mobile frames, exactly when break collisions were most expensive.
 const elapsed=lastTime?Math.min(.25,Math.max(0,(timestamp-lastTime)/1000)):0;lastTime=timestamp;
 if(state?.phase==='moving'){
  accumulator=Math.min(.35,accumulator+elapsed);let steps=0;
  while(accumulator>=1/120&&steps<24){
   const result=step(state.balls,1/120);
   for(const id of result.pocketed)state.shot.balls.push(id);
   state.shot.pocketEvents.push(...result.pocketEvents);
   if(state.shot.firstContact===null)for(const [a,b] of result.contacts)if(a===0||b===0){state.shot.firstContact=a===0?b:a;break;}
   state.shot.time+=1/120;
   if(stationary(state.balls))state.shot.stillFrames++;else state.shot.stillFrames=0;
   accumulator-=1/120;steps++;
   if(state.shot.stillFrames>24||state.shot.time>20){
    if(state.shot.time>20)for(const b of state.balls){b.vx=0;b.vy=0;}
    accumulator=0;finishShot();break;
   }
  }
  // Keep leftover simulation time to catch up on the next animation frame.
  // A finite backlog cap above prevents infinite catch-up after tab suspension.
 }
 if(state)render();requestAnimationFrame(frame);
}
function eventPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*TABLE.width/r.width,y:(e.clientY-r.top)*TABLE.height/r.height};}
let dragging=false,draggingBreak=false,breakPositionValid=false;
// Hit targets are sized in CSS pixels so touch taps remain usable on phones.
function closestCallBall(point){
 const box=canvas.getBoundingClientRect();
 const radius=Math.max(TABLE.radius+7,30*TABLE.width/box.width);
 return callTargets().map(b=>({ball:b,dist:distance(b,point)}))
  .filter(x=>x.dist<=radius).sort((a,b)=>a.dist-b.dist)[0]?.ball??null;
}
function closestCallPocket(point){
 const box=canvas.getBoundingClientRect();
 const snapRadius=Math.max(35,46*TABLE.width/box.width);
 return pockets.map(p=>({p,dist:distance(p,point)}))
  .filter(x=>x.dist<=snapRadius).sort((a,b)=>a.dist-b.dist)[0]?.p??null;
}
canvas.addEventListener('pointerdown',e=>{
 if(!state)return;
 const p=eventPoint(e);
 if(state.isBreak&&human(state.turn)&&
    (state.phase==='placeBreak'||(state.phase==='aim'&&!invertAim()))&&p.x<=headStringX()+TABLE.radius){
  // Placing anywhere inside the kitchen is direct: no cue-ball hit target.
  if(state.phase==='aim')state.phase='placeBreak';
  draggingBreak=true;breakPositionValid=placeBreakCue(p);
  canvas.setPointerCapture(e.pointerId);
  return;
 }
 if(state.phase==='placeCue'&&human(state.turn)){placeCue(p);return;}
 if(state.phase==='placeStash'&&human(otherPlayer(state.turn))){previewStash(p);return;}
 if(state.phase!=='aim'||!human(state.turn))return;
 if(!state.isBreak&&!callReady()){
  if(state.callBall===null){
   const target=closestCallBall(p);
   if(target)selectCallBall(target.id);
   else say('Tap an outlined object ball to call it, or choose its number below.');
  }else{
   const target=closestCallPocket(p);
   if(target)selectCallPocket(target.id);
   else say('Tap one of the six large pocket numbers to complete your call.');
  }
  return;
 }
 dragging=true;canvas.setPointerCapture(e.pointerId);aimFrom(p);
});

canvas.addEventListener('pointermove',e=>{if(draggingBreak){breakPositionValid=placeBreakCue(eventPoint(e))||breakPositionValid;return;}if(dragging)aimFrom(eventPoint(e));});
canvas.addEventListener('pointerup',()=>{if(draggingBreak){draggingBreak=false;if(breakPositionValid)finishBreakPlacement();breakPositionValid=false;}dragging=false;});
canvas.addEventListener('pointercancel',()=>{draggingBreak=false;breakPositionValid=false;dragging=false;});
$('#power').addEventListener('input',e=>{state.power=Number(e.target.value);update();});
$('#spin-top').addEventListener('input',e=>{state.spinTop=Number(e.target.value);update();});
$('#spin-side').addEventListener('input',e=>{state.spinSide=Number(e.target.value);update();});
$('#undo-call').addEventListener('click',undoCall);
for(const button of document.querySelectorAll('.pocket-pick')){
 button.addEventListener('click',()=>selectCallPocket(button.dataset.pocket));
}
$('#move-cue').addEventListener('click',moveBreakCue);
$('#stash-solid').addEventListener('click',()=>selectStashBall(7));
$('#stash-stripe').addEventListener('click',()=>selectStashBall(15));
$('#stash-confirm').addEventListener('click',()=>{if(state.phase==='placeStash'&&human(otherPlayer(state.turn))&&state.pendingStashPoint)placeStash(state.pendingStashPoint);});
$('#shoot').addEventListener('click',()=>{if(state.phase==='aim'&&human(state.turn))hit();});
$('#new-game').addEventListener('click',newGame);
$('#play-again').addEventListener('click',newGame);
$('#mode').addEventListener('change',newGame);
for(const button of document.querySelectorAll('.table-size-pick')){
 button.addEventListener('click',()=>{selectedTableSize=Number(button.dataset.size);newGame();});
}
window.addEventListener('keydown',e=>{
 // Preserve native keyboard activation of focused controls (especially Undo).
 const tag=e.target?.tagName?.toLowerCase();
 if(!state||state.phase!=='aim'||!human(state.turn)||e.target?.isContentEditable||
  (tag&&!['body','html','canvas'].includes(tag))||
  e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'||e.key==='a'){state.angle-=.02;e.preventDefault();}
 if(e.key==='ArrowRight'||e.key==='d'){state.angle+=.02;e.preventDefault();}
 if(e.code==='Space'){e.preventDefault();hit();}
});
// Returning players keep their selected size; first-time players use the
// tighter 7-ft bar box by default. Storage failures never block a match.
try{
 if(typeof localStorage!=='undefined'){
  const saved=localStorage.getItem('squatch-table-size');
  if(['7','8','9'].includes(saved))selectedTableSize=Number(saved);
 }
}catch{}
initStats();
newGame();requestAnimationFrame(frame);
