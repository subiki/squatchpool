import {TABLE,pockets,ball,rack,step,stationary,canPlace,findPlacement,clearShot,clamp,distance} from './physics.js';
import {groupOf,otherGroup,otherPlayer,stashBall,readyForStash,readyForEight,liveGroupBalls,adjudicate} from './rules.js';
import {createJungleView} from './jungle3d.js';
const $=s=>document.querySelector(s),canvas=$('#table'),ctx=canvas.getContext('2d');
const colors=['#fffdf3','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39','#161819','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39'];
let state,lastTime=0,accumulator=0,botTimer=null;
const person=i=>i===0?(state.mode==='bot'?'You':'Player 1'):(state.mode==='bot'?'Speed Squatch':'Player 2');
const human=i=>state.mode==='local'||i===0;
const cue=()=>state.balls.find(b=>b.id===0);
const jungle=createJungleView({
 host:$('#jungle-stage'),classic:canvas,
 controls:{classic:$('#classic-view'),jungle:$('#jungle-view'),intro:$('#squatch-intro')},
 getState:()=>state,
 onTablePoint:(p,isDrag)=>{
  if(!state)return;
  if(state.phase==='placeCue'&&!isDrag&&human(state.turn))placeCue(p);
  else if(state.phase==='placeStash'&&!isDrag&&human(otherPlayer(state.turn)))placeStash(p);
  else if(state.phase==='aim'&&human(state.turn))aimFrom(p);
 },
 onStatus:message=>say(message)
});
function say(message){$('#announcer-text').textContent=message;}
function log(message){
 const list=$('#shot-log'),li=document.createElement('li');li.textContent=message;list.prepend(li);
 while(list.children.length>12)list.lastElementChild.remove();
}
function newGame(){
 clearTimeout(botTimer);
 state={mode:$('#mode').value,balls:rack(),groups:[null,null],deployed:{solids:false,stripes:false},turn:0,phase:'aim',angle:0,power:68,isBreak:true,shotNumber:0,shot:null,pendingStash:null,pendingCue:false,winner:null,generation:(state?.generation||0)+1};
 accumulator=0;$('#power').value='68';$('#result-modal').hidden=true;$('#shot-log').replaceChildren();
 log('Fresh rack. 7 and 15 are hiding in the back room.');
 say("First time? Aim on the felt, set power, then tap SHOOT. Clear your balls and the surprise ball before the 8.");update();
}
function update(){
 for(let i=0;i<2;i++){
  $('#player-'+i).classList.toggle('active',state.turn===i&&state.winner===null);
  $('#player-name-'+i).textContent=person(i);
  const g=state.groups[i];
  $('#player-group-'+i).textContent=g?(g[0].toUpperCase()+g.slice(1))+(state.deployed[g]?' · surprise revealed':' · 1 hidden'):'Open table';
  $('#player-count-'+i).textContent=g?String(liveGroupBalls(state.balls,g).length+(state.deployed[g]?0:1))+' left':'—';
 }
 $('#shot-counter').textContent=state.shotNumber===0?'Break shot':'Shot '+(state.shotNumber+1);
 $('#table-status').textContent=state.phase==='placeStash'?'SURPRISE BALL!':state.phase==='placeCue'?'BALL IN HAND':state.groups[0]?'GROUPS SET':'OPEN TABLE';
 $('#power-value').textContent=state.power+'%';
 const actor=state.phase==='placeStash'?otherPlayer(state.turn):state.turn;
 const title={aim:person(state.turn)+(state.shotNumber===0?' breaks':' shoots'),moving:'Balls rolling…',placeCue:'Ball in hand',placeStash:"But wait… THERE'S MORE!",done:'Rack finished!'};
 const hint={aim:human(actor)?'1. Tap or drag to aim  ·  2. Set power  ·  3. Press SHOOT':'Speed Squatch is sizing up the shot…',moving:'Let the balls come to rest.',placeCue:'Your opponent fouled. Tap a clear spot to place the white ball.',placeStash:'Opponent: tap a clear spot to bring the hidden '+stashBall(state.pendingStash)+'-ball back.',done:'Rack again to play another game.'};
 $('#control-title').textContent=title[state.phase];$('#control-hint').textContent=hint[state.phase];
 $('#shoot').disabled=state.phase!=='aim'||!human(state.turn);
 $('#power').disabled=state.phase!=='aim'||!human(state.turn);
}
function revealStashIfNeeded(){
 const group=state.groups[state.turn];
 if(!readyForStash(state.balls,group,state.deployed[group]))return false;
 state.pendingStash=group;state.phase='placeStash';
 say("BUT WAIT, THERE'S MORE! "+person(otherPlayer(state.turn))+' places the missing '+stashBall(group)+'-ball.');
 log(person(state.turn)+' cleared the visible '+group+'; the '+stashBall(group)+'-ball enters play!');
 if(!human(otherPlayer(state.turn))){
  const token=state.generation;
  botTimer=setTimeout(()=>{if(state.generation===token&&state.phase==='placeStash'){
   const p=findPlacement(state.balls,{x:560,y:215});if(p)placeStash(p);
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
function placeCue({x,y}){
 if(!canPlace(state.balls,x,y,0)){say('That spot is blocked. Try a clear spot.');return;}
 Object.assign(cue(),{x,y,vx:0,vy:0,pocketed:false});
 state.pendingCue=false;say(person(state.turn)+' has ball in hand.');resume();
}
function placeStash({x,y}){
 if(!canPlace(state.balls,x,y)){say('That spot is blocked. Try another spot.');return;}
 const group=state.pendingStash;state.balls.push(ball(stashBall(group),x,y));
 state.deployed[group]=true;state.pendingStash=null;
 say('The '+stashBall(group)+'-ball is back! Clear it before going for the 8.');resume();
}
function aimFrom(p){
 if(state.phase!=='aim'||!human(state.turn))return;
 const b=cue(),dx=p.x-b.x,dy=p.y-b.y;
 if(Math.hypot(dx,dy)>8)state.angle=Math.atan2(dy,dx);
}
function hit(direction=state.angle,power=state.power){
 if(state.phase!=='aim')return;
 const b=cue();if(!b||b.pocketed)return;
 const speed=240+11*clamp(power,10,100);
 b.vx=Math.cos(direction)*speed;b.vy=Math.sin(direction)*speed;
 state.shot={player:state.turn,balls:[],firstContact:null,time:0,stillFrames:0,breakShot:state.isBreak,preShotReadyForEight:readyForEight(state.balls,state.groups[state.turn],state.deployed[state.groups[state.turn]])};
 state.shotNumber++;state.isBreak=false;state.phase='moving';
 say(person(state.turn)+' lets it fly!');update();
}
function finishShot(){
 if(state.phase!=='moving'||!state.shot)return;
 const shot=state.shot;state.shot=null;
 const decision=adjudicate({balls:state.balls,shooter:shot.player,groups:state.groups,deployed:state.deployed,pocketed:shot.balls,firstContact:shot.firstContact,breakShot:shot.breakShot,preShotReadyForEight:shot.preShotReadyForEight});
 const potted=shot.balls.filter(n=>n!==0);
 jungle.react(decision.winner!==null?'win':decision.foul?'scratch':potted.length?'pocket':'miss');
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
   const score=distance(b,ghost)+len*.8;if(!best||score<best.score)best={point:ghost,score};
  }
  if(!best&&targets.length){
   const target=targets.sort((a,c)=>distance(a,b)-distance(c,b))[0];best={point:target,score:distance(b,target)};
  }
  const angle=best?Math.atan2(best.point.y-b.y,best.point.x-b.x):0;
  state.angle=angle+(Math.random()-.5)*.028;
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
 // Visible cushion faces line up with the physics collision planes (ball centers at radius r).
 // The former decorative inset rectangle looked like an invisible second set of rails.
 ctx.save();ctx.strokeStyle='#b58a53';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(38,r);ctx.lineTo(w/2-43,r);ctx.moveTo(w/2+43,r);ctx.lineTo(w-38,r);
 ctx.moveTo(38,h-r);ctx.lineTo(w/2-43,h-r);ctx.moveTo(w/2+43,h-r);ctx.lineTo(w-38,h-r);
 ctx.moveTo(r,38);ctx.lineTo(r,h-38);ctx.moveTo(w-r,38);ctx.lineTo(w-r,h-38);ctx.stroke();ctx.restore();
 ctx.setLineDash([4,10]);ctx.strokeStyle='#f7e8c129';ctx.beginPath();ctx.moveTo(250,12);ctx.lineTo(250,h-12);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#e6c89566';ctx.beginPath();ctx.arc(695,250,3,0,2*Math.PI);ctx.fill();
 for(const p of pockets){ctx.fillStyle='#06150f';ctx.beginPath();ctx.arc(p.x,p.y,TABLE.pocketRadius+4,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#b0834f';ctx.lineWidth=4;ctx.stroke();}
 for(let i=1;i<=7;i++)for(const y of [7,h-7]){ctx.save();ctx.translate(i*w/8,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#d6ab6a';ctx.fillRect(-3,-3,6,6);ctx.restore();}
 if(state.phase==='aim'){
  const cb=cue();if(cb&&!cb.pocketed){
   const dx=Math.cos(state.angle),dy=Math.sin(state.angle);let reach=850;
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
 if(state.phase==='placeCue'||state.phase==='placeStash'){
  ctx.fillStyle='#f2d6a6ed';ctx.font='bold 25px system-ui';ctx.textAlign='center';
  ctx.fillText(state.phase==='placeCue'?'TAP TO PLACE CUE BALL':'TAP TO PLACE THE SURPRISE BALL',w/2,40);
 }
 for(const b of state.balls)if(!b.pocketed)drawBall(b);
}
function frame(timestamp){
 const elapsed=lastTime?Math.min(.08,Math.max(0,(timestamp-lastTime)/1000)):0;lastTime=timestamp;
 if(state?.phase==='moving'){
  accumulator+=elapsed;let steps=0;
  while(accumulator>=1/120&&steps<14){
   const result=step(state.balls,1/120);
   for(const id of result.pocketed)state.shot.balls.push(id);
   if(state.shot.firstContact===null)for(const [a,b] of result.contacts)if(a===0||b===0){state.shot.firstContact=a===0?b:a;break;}
   state.shot.time+=1/120;
   if(stationary(state.balls))state.shot.stillFrames++;else state.shot.stillFrames=0;
   accumulator-=1/120;steps++;
   if(state.shot.stillFrames>24||state.shot.time>20){
    if(state.shot.time>20)for(const b of state.balls){b.vx=0;b.vy=0;}
    accumulator=0;finishShot();break;
   }
  }
  if(steps===14)accumulator=0;
 }
 if(state){render();jungle.render(state,timestamp);}requestAnimationFrame(frame);
}
function eventPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*TABLE.width/r.width,y:(e.clientY-r.top)*TABLE.height/r.height};}
let dragging=false;
canvas.addEventListener('pointerdown',e=>{
 if(!state)return;const p=eventPoint(e);
 if(state.phase==='placeCue'&&human(state.turn)){placeCue(p);return;}
 if(state.phase==='placeStash'&&human(otherPlayer(state.turn))){placeStash(p);return;}
 if(state.phase==='aim'&&human(state.turn)){dragging=true;canvas.setPointerCapture(e.pointerId);aimFrom(p);}
});
canvas.addEventListener('pointermove',e=>{if(dragging)aimFrom(eventPoint(e));});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);
$('#power').addEventListener('input',e=>{state.power=Number(e.target.value);update();});
$('#shoot').addEventListener('click',()=>{if(state.phase==='aim'&&human(state.turn))hit();});
$('#new-game').addEventListener('click',newGame);
$('#play-again').addEventListener('click',newGame);
$('#mode').addEventListener('change',newGame);
window.addEventListener('keydown',e=>{
 if(!state||state.phase!=='aim'||!human(state.turn)||/input|select|textarea/i.test(e.target?.tagName))return;
 if(e.key==='ArrowLeft'||e.key==='a'){state.angle-=.02;e.preventDefault();}
 if(e.key==='ArrowRight'||e.key==='d'){state.angle+=.02;e.preventDefault();}
 if(e.code==='Space'){e.preventDefault();hit();}
});
newGame();requestAnimationFrame(frame);
