/** Three-seat Coin-Op Cutthroat: original Episode 4 rules, shared 120 Hz table physics. */
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {startCutthroat,availableGroups,assignCutthroatGroup,remainingCutthroatBalls,finishCutthroatShot,resolveCutthroatClaim} from './cutthroat-rules.js';
import {initCutthroatStats,newCutthroatStatsId,reportCutthroatRack,reportCutthroatBalls} from './cutthroat-stats.js';
const $=id=>document.getElementById(id);
const canvas=$('cut-table'),ctx=canvas.getContext('2d');
const names=['Player 1','Player 2','Player 3'];
const ranges=['1–5','6–10','11–15'];
let game,lastTime=0,accumulator=0,dragging=false;
function say(message){
 const li=document.createElement('li');li.textContent=message;
 $('cut-log').prepend(li);
 while($('cut-log').children.length>15)$('cut-log').lastElementChild.remove();
}
function newGame(){
 setTableSize(Number($('cut-size').value));
 try{localStorage.setItem('squatch-table-size',String(TABLE.size));}catch{}
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 canvas.style.aspectRatio=String(TABLE.width/TABLE.height);
 const balls=fullRack();
 const p=kitchenPoint(TABLE.width*.18,TABLE.height/2);
 Object.assign(balls[0],p);
 game={balls,match:startCutthroat(),phase:'placeBreak',breakShot:true,
  angle:0,power:85,top:0,side:0,shot:null,statsRackId:newCutthroatStatsId(),placementValid:canPlaceBreakCue(balls,p.x,p.y)};
 accumulator=0;
 $('cut-log').replaceChildren();
 $('cut-power').value='85';$('cut-top').value='0';$('cut-side').value='0';
 say('New three-player rack. Player 1 breaks. Tap a legal spot in the kitchen, then confirm.');
 update();
}
const cue=()=>game.balls[0];
function update(){
 const m=game.match,placing=game.phase==='placeBreak'||game.phase==='placeCue';
 const canShoot=game.phase==='aim';
 const claim=m.pendingClaim;
 const actor=game.phase==='claim'&&claim?claim.claimant:m.turn;
 $('cut-turn').textContent=m.winner!==null?names[m.winner]+' wins!':names[actor]+' · '+(placing?'place the white ball':game.phase==='moving'?'balls moving':game.phase==='claim'?'scratch claim':game.phase==='chooseGroup'?'choose group':'shooting');
 $('cut-scores').textContent=m.owners.map((group,i)=>names[i]+': '+(group===null?'unassigned':ranges[group])+
  (group===null?'':' · '+remainingCutthroatBalls(m,group).length+' left')).join('  |  ');
 $('cut-status').textContent=m.winner!==null?'Last player with a ball on the table wins. Start a new rack to play again.':
  game.phase==='placeBreak'?'Tap or drag the cue ball behind the head string, then confirm break position.':
  game.phase==='placeCue'?'Scratch: incoming player has ball in hand. Tap an open place on the felt.':
  game.phase==='claim'&&claim?names[claim.claimant]+' may claim one on-table ball from '+names[claim.scratcher]+', or decline.':
  game.phase==='chooseGroup'?'Your turn has ended. Choose your earned group before play passes.':
  game.phase==='moving'?'Balls rolling…':
  m.groupChoicePlayer===m.turn?'You earned a group choice. Select 1–5, 6–10 or 11–15 now, or keep shooting.':
  game.breakShot?'Break the rack; balls pocketed on the break stay down.':
  'Aim from the white ball, then shoot. Any object ball may be pocketed, including your own.';
 $('cut-place').hidden=!placing;
 $('cut-place').disabled=!placing||!game.placementValid;
 $('cut-place').textContent=game.phase==='placeBreak'?'Confirm break position':'Confirm ball in hand';
 $('cut-shoot').disabled=!canShoot;
 $('cut-shoot').textContent=game.breakShot?'BREAK':'SHOOT';
 $('cut-group').hidden=!(m.groupChoicePlayer===m.turn&&['aim','chooseGroup'].includes(game.phase));
 const choices=availableGroups(m);
 $('cut-group-select').replaceChildren(...choices.map(g=>new Option(ranges[g],String(g))));
 $('cut-claim').hidden=game.phase!=='claim';
 $('cut-claim-select').replaceChildren(new Option('Decline claim',''),...(claim?.returnable||[]).map(id=>new Option('Claim ball '+id,String(id))));
 for(const id of ['cut-power','cut-top','cut-side'])$(id).disabled=!canShoot;
 $('cut-power-value').textContent=game.power+'%';
 $('cut-top-value').textContent=game.top+'%';
 $('cut-side-value').textContent=game.side+'%';
}
function finishShot(){
 const shot=game.shot;game.shot=null;
 const pocketed=[...new Set(shot.events.filter(e=>e.type==='pocket'&&e.ballId!==0).map(e=>e.ballId))];
 const scratch=shot.events.some(e=>e.type==='pocket'&&e.ballId===0);
 if(pocketed.length)reportCutthroatBalls(game.statsRackId,shot.statsShotId,pocketed.length);
 const contacted=shot.events.some(e=>e.type==='contact'&&e.balls?.includes(0));
 // The manuscript does not specify non-scratch fouls. Missing all object
 // balls is treated as a turn-ending miss, not a speculative penalty.
 const before=game.match.turn;
 game.match=finishCutthroatShot(game.match,{pocketed,scratch,foul:!contacted&&!shot.breakShot});
 game.breakShot=false;
 say(names[before]+': '+(pocketed.length?'pocketed '+pocketed.join(', '):'no ball pocketed')+
  (scratch?' · scratch. Third player decides a claim.':'.'));
 if(game.match.winner!==null){game.phase='done';say(names[game.match.winner]+' wins the rack.');}
 else if(game.match.pendingTurn!==null){game.phase='chooseGroup';}
 else if(game.match.pendingClaim){game.phase='claim';}
 else game.phase='aim';
 update();
}
function shoot(){
 if(game.phase!=='aim')return;
 const b=cue(),speed=shotSpeed(game.power,game.breakShot);
 b.vx=Math.cos(game.angle)*speed;b.vy=Math.sin(game.angle)*speed;
 applyCueSpin(b,game.top/100,game.side/100);
 game.shot={events:[],time:0,stillFrames:0,breakShot:game.breakShot,statsShotId:newCutthroatStatsId()};
 if(game.breakShot)reportCutthroatRack(game.statsRackId);
 game.phase='moving';game.power=68;game.top=0;game.side=0;
 $('cut-power').value='68';$('cut-top').value='0';$('cut-side').value='0';
 update();
}
function placeCue(p){
 if(game.phase==='placeBreak'){
  const q=kitchenPoint(p.x,p.y);
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
  if(b.id){ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(b.id),b.x,b.y);}
 }
 if(game.phase==='aim'){
  const b=cue(),dx=Math.cos(game.angle),dy=Math.sin(game.angle);
  ctx.strokeStyle='#fce2a8';ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();
  ctx.moveTo(b.x+dx*(r+4),b.y+dy*(r+4));ctx.lineTo(b.x+dx*280,b.y+dy*280);ctx.stroke();ctx.setLineDash([]);
  ctx.lineWidth=5;ctx.strokeStyle='#dfb37c';ctx.beginPath();
  ctx.moveTo(b.x-dx*(r+22),b.y-dy*(r+22));ctx.lineTo(b.x-dx*(r+170),b.y-dy*(r+170));ctx.stroke();
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
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(point(e));
 else if(game.phase==='aim')aim(point(e));
 else return;
 dragging=true;canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!dragging)return;
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(point(e));
 else if(game.phase==='aim')aim(point(e));
});
canvas.addEventListener('pointerup',e=>{
 if(dragging&&game.phase==='aim')aim(point(e));
 dragging=false;
});
canvas.addEventListener('pointercancel',()=>dragging=false);
$('cut-place').addEventListener('click',()=>{
 if(!game.placementValid||!['placeBreak','placeCue'].includes(game.phase))return;
 if(game.phase==='placeCue'){
  const b=cue();b.pocketed=false;b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;b.motion='stationary';
 }
 game.phase='aim';update();
});
$('cut-shoot').addEventListener('click',shoot);
$('cut-new').addEventListener('click',newGame);
$('cut-size').addEventListener('change',newGame);
$('cut-group-confirm').addEventListener('click',()=>{
 if(!['aim','chooseGroup'].includes(game.phase)||game.match.groupChoicePlayer!==game.match.turn)return;
 const g=Number($('cut-group-select').value),chooser=game.match.turn;
 game.match=assignCutthroatGroup(game.match,chooser,g);
 say(names[chooser]+' chose '+ranges[g]+'.');
 if(game.match.winner!==null)game.phase='done';
 else if(game.match.pendingClaim)game.phase='claim';
 else if(game.phase==='chooseGroup')game.phase='aim';
 update();
});
$('cut-claim-confirm').addEventListener('click',()=>{
 if(game.phase!=='claim'||!game.match.pendingClaim)return;
 const id=$('cut-claim-select').value;
 const claimant=game.match.pendingClaim.claimant;
 game.match=resolveCutthroatClaim(game.match,id?Number(id):null);
 say(names[claimant]+(id?' claimed ball '+id+'.':' declined the scratch claim.'));
 if(game.match.winner!==null){game.phase='done';}
 else{
  const b=cue(),p=findPlacement(game.balls);
  if(p){Object.assign(b,p);game.placementValid=true;}
  else game.placementValid=false;
  game.phase='placeCue';
 }
 update();
});
for(const [id,key] of [['cut-power','power'],['cut-top','top'],['cut-side','side']])
 $(id).addEventListener('input',e=>{game[key]=Number(e.target.value);update();});
window.addEventListener('keydown',e=>{
 const tag=e.target?.tagName?.toLowerCase();
 if(!game||game.phase!=='aim'||e.target?.isContentEditable||
  (tag&&!['body','html','canvas'].includes(tag))||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'){game.angle-=.025;e.preventDefault();}
 if(e.key==='ArrowRight'){game.angle+=.025;e.preventDefault();}
 if(e.code==='Space'){shoot();e.preventDefault();}
});
try{const saved=localStorage.getItem('squatch-table-size');if(['7','8','9'].includes(saved))$('cut-size').value=saved;}catch{}
initCutthroatStats();newGame();requestAnimationFrame(frame);
