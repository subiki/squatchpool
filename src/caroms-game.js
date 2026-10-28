/** Caroms local pass-and-play preview, isolated from But Wait's production game. */
import {TABLE,pockets,cushions,fullRack,step,stationary,findPlacement,shotSpeed,applyCueSpin,headStringX} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupOf,liveGroupBalls} from './rules.js';
import {caromsTurn,caromsEligible,caromsCallRequired} from './caroms-rules.js';
import {initCaromsStats,newCaromsStatsId,reportCaromsRack,reportCaromsBalls} from './caroms-stats.js';

const $=id=>document.getElementById(id);
const canvas=$('caroms-table'),ctx=canvas.getContext('2d');
const level=i=>$('caroms-level-'+i).value;
let state,lastTime=0,accumulator=0;
const player=i=>'Player '+(i+1);
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
 const canAim=state.phase==='aim',needCall=!state.breakShot&&caromsCallRequired(level(state.turn),
  caromsEligible(state.balls,state.groups[state.turn]));
 const targets=state.balls.filter(b=>!b.pocketed&&b.id!==0);
 updateSelect($('caroms-striker'),available.map(b=>[b.id,'Strike ball '+b.id]),state.shooterBall);
 updateSelect($('caroms-call-ball'),targets.map(b=>[b.id,'Ball '+b.id]),state.calledBall,'Choose called ball');
 updateSelect($('caroms-call-pocket'),pockets.map(p=>[p.id,p.label]),state.calledPocket,'Choose pocket');
 $('caroms-call-controls').hidden=!needCall;
 $('caroms-turn').textContent=state.phase==='done'?'Rack complete':player(state.turn)+(state.breakShot?' · 1-ball break':' · '+level(state.turn));
 $('caroms-score').textContent=state.groups.map((g,i)=>player(i)+': '+(g||'open table')+
  (g?' ('+liveGroupBalls(state.balls,g).length+' left)':'')).join('   ·   ');
 $('caroms-status').textContent=state.phase==='moving'?'Balls rolling…':
  state.phase==='option'?'Foul: incoming player chooses whether to move the white ball to center.':
  state.phase==='done'?player(state.winner)+' wins the rack!':
  state.breakShot?'Strike the 1-ball toward the white ball to break.':
  needCall?'Select an object ball, call the ball and pocket, then aim and shoot.':
  'Select one of your object balls, aim from it through the white ball, then shoot.';
 $('caroms-option').hidden=state.phase!=='option';
 $('caroms-shoot').disabled=!canAim||state.shooterBall===null||
  (needCall&&(!state.calledBall||!state.calledPocket));
 $('caroms-shoot').textContent=state.breakShot?'BREAK WITH THE 1':'SHOOT';
 for(const id of ['caroms-striker','caroms-power','caroms-top','caroms-side'])
  $(id).disabled=!canAim;
 for(const id of ['caroms-call-ball','caroms-call-pocket'])$(id).disabled=!canAim||!needCall;
 $('caroms-undo').disabled=!canAim||!needCall||(!state.calledBall&&!state.calledPocket);
 $('caroms-power-value').textContent=state.power+'%';
 $('caroms-top-value').textContent=state.spinTop+'%';
 $('caroms-side-value').textContent=state.spinSide+'%';
}
function newGame(){
 setTableSize(Number($('caroms-size').value));
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 canvas.style.aspectRatio=String(TABLE.width/TABLE.height);
 const balls=fullRack(),one=balls.find(b=>b.id===1),white=balls.find(b=>b.id===0);
 one.x=TABLE.radius+TABLE.width*.11;one.y=TABLE.height/2;
 white.x=headStringX()+TABLE.radius*3;white.y=TABLE.height/2;
 state={balls,groups:[null,null],turn:0,phase:'aim',breakShot:true,shooterBall:1,
  angle:0,power:85,spinTop:0,spinSide:0,calledBall:null,calledPocket:null,
  shot:null,shotNumber:0,winner:null,statsRackId:newCaromsStatsId()};
 accumulator=0;
 $('caroms-power').value='85';$('caroms-top').value='0';$('caroms-side').value='0';
 $('caroms-log').replaceChildren();
 log('Fresh Caroms rack. Player 1 breaks with the 1-ball. Two-player local play.');
 update();
}
function respot(id){
 const b=state.balls.find(b=>b.id===id);
 if(!b)return false;
 b.pocketed=true;
 const point=findPlacement(state.balls,{x:TABLE.width/2,y:TABLE.height/2});
 if(!point)return false;
 Object.assign(b,{...point,pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});
 return true;
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
 if(decision.winner!==null){state.winner=decision.winner;state.phase='done';}
 else{
  state.turn=decision.nextPlayer;
  state.phase=decision.cueOption?'option':'aim';
 }
 update();
}
function hit(){
 if(state.phase!=='aim')return;
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
function chooseOption(center){
 if(state.phase!=='option')return;
 if(center&&!respot(0)){log('No clear center placement; white ball stays put.');}
 else if(center)log(player(state.turn)+' moved the white ball near table center.');
 state.phase='aim';update();
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
 if(state.phase==='aim'&&striker()&&!striker().pocketed){
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
 const dx=p.x-b.x,dy=p.y-b.y;
 if(Math.hypot(dx,dy)>radiansToPixels())state.angle=Math.atan2(dy,dx);
}
const radiansToPixels=()=>TABLE.radius;
let dragging=false;
canvas.addEventListener('pointerdown',e=>{
 if(state.phase!=='aim')return;
 const p=point(e),nearest=eligibleBalls().map(b=>({b,d:Math.hypot(b.x-p.x,b.y-p.y)}))
  .sort((a,b)=>a.d-b.d)[0];
 if(nearest&&nearest.d<TABLE.radius*2.4){
  state.shooterBall=nearest.b.id;state.angle=0;update();return;
 }
 dragging=true;canvas.setPointerCapture(e.pointerId);aim(p);
});
canvas.addEventListener('pointermove',e=>{if(dragging)aim(point(e));});
canvas.addEventListener('pointerup',()=>{dragging=false;});
canvas.addEventListener('pointercancel',()=>{dragging=false;});
$('caroms-striker').addEventListener('change',e=>{state.shooterBall=Number(e.target.value);update();});
$('caroms-call-ball').addEventListener('change',e=>{state.calledBall=e.target.value?Number(e.target.value):null;update();});
$('caroms-call-pocket').addEventListener('change',e=>{state.calledPocket=e.target.value||null;update();});
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
$('caroms-size').addEventListener('change',newGame);
$('caroms-center').addEventListener('click',()=>chooseOption(true));
$('caroms-leave').addEventListener('click',()=>chooseOption(false));
window.addEventListener('keydown',e=>{
 if(!state||state.phase!=='aim'||/input|select|textarea/i.test(e.target?.tagName))return;
 if(e.key==='ArrowLeft'){state.angle-=.025;e.preventDefault();}
 if(e.key==='ArrowRight'){state.angle+=.025;e.preventDefault();}
 if(e.code==='Space'){hit();e.preventDefault();}
});
initCaromsStats();newGame();requestAnimationFrame(frame);
