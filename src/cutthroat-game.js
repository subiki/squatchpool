/** Three-seat Coin-Op Cutthroat: original Episode 4 rules, shared 120 Hz table physics. */
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,applyCueSpin,canPlace,canPlaceBreakCue,kitchenPoint,headStringX,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupForBall} from './squatch-modes.js';
import {createTableRenderer} from './table-renderer.js';
import {tablePoint} from './table-pointer.js';
import {startCutthroat,availableGroups,assignCutthroatGroup,remainingCutthroatBalls,resolveCutthroatClaim} from './cutthroat-rules.js';
import {createGameSession} from './game-session.js';
import {attachMatchExitGuard} from './match-navigation.js';
import {attachShotAnnouncer} from './shot-announcer.js';
import {planBotShot} from './bot-shot-planner.js';
import {createBotTurnScheduler} from './bot-turn-scheduler.js';
import {adjudicateCutthroatShot} from './cutthroat-shot-adapter.js';
import {createGameTelemetry,newGameStatsId as newCutthroatStatsId} from './game-telemetry.js';
import {bindInvertAim,angleFromPointer} from './aim-preference.js';
import {mountTableKit} from './table-kit-controls.js';
const mountedGames=new WeakMap();
export function mountCutthroatGame(root=globalThis.document){
 mountedGames.get(root)?.dispose();
 const document=root.ownerDocument||root,cleanups=[];
 let disposed=false,frameId=null;
 const requestAnimationFrame=callback=>{
  if(!disposed)frameId=globalThis.requestAnimationFrame(time=>{if(!disposed)callback(time);});
 };
 function listen(node,event,callback){
  const handler=(...args)=>{if(!disposed)callback(...args);};
  node?.addEventListener(event,handler);
  cleanups.push(()=>node?.removeEventListener?.(event,handler));
 }
 const $=id=>root.getElementById?.(id)||root.querySelector('#'+id);
 cleanups.push(mountTableKit(root));
 let telemetry;
 cleanups.push(()=>telemetry?.dispose());
 const reportCutthroatRack=id=>telemetry?.rack(id);
 const reportCutthroatBalls=(rack,id,count)=>telemetry?.balls(rack,id,count);


const canvas=$('cut-table'),ctx=canvas.getContext('2d');
const renderer=createTableRenderer({table:TABLE,pockets,cushions,renderPocket});
const invertAim=bindInvertAim($('invert-aim'));
cleanups.push(()=>invertAim.dispose());
const botSeat=seat=>seat>=Number($('cut-players')?.value||3);
const seatName=seat=>botSeat(seat)?'Squatch Bot '+(seat+1):'Player '+(seat+1);
const ranges=['Blue','Yellow','Red'];
const teamColors=['#2477df','#efc441','#df493f'];
function drawCutthroatBall(ball,ctx){
 const r=TABLE.radius;
 const group=groupForBall(ball.id);
 ctx.beginPath();ctx.arc(ball.x,ball.y,r,0,Math.PI*2);
 ctx.fillStyle=group<0?'#f8f5e9':teamColors[group];
 ctx.fill();ctx.strokeStyle='#192a24';ctx.lineWidth=1.5;ctx.stroke();
 // A gleam gives depth without numbered billiard-ball markings.
 ctx.beginPath();ctx.arc(ball.x-r*.32,ball.y-r*.32,r*.22,0,Math.PI*2);
 ctx.fillStyle='#ffffff8e';ctx.fill();
}
let game,lastTime=0,accumulator=0,dragging=false,activePointer=null;
function cancelPointer(){dragging=false;activePointer=null;}
const botTurns=createBotTurnScheduler();
function cancelBot(){botTurns.cancel();}
function say(message){
 const li=document.createElement('li');li.textContent=message;
 $('cut-log').prepend(li);
 while($('cut-log').children.length>15)$('cut-log').lastElementChild.remove();
}
const session=createGameSession({game:'cutthroat',adjudicate:adjudicateCutthroatShot});
cleanups.push(attachMatchExitGuard(session));
// Mount only on real DOM stages; minimal controller test doubles omit ownerDocument.
const announcerStage=$('table-stage');
if(announcerStage?.ownerDocument)cleanups.push(attachShotAnnouncer(session,announcerStage));
cleanups.push(session.subscribe(result=>{
 if(result.pocketed.length)reportCutthroatBalls(game.statsRackId,result.shotId,result.pocketed.length);
 say(result.announcement);
}));
function newGame(){
 cancelPointer();cancelBot();
 session.startRack();
 setTableSize(Number($('cut-size').value));
 try{localStorage.setItem('squatch-table-size',String(TABLE.size));}catch{}
 canvas.width=Math.round(TABLE.width);canvas.height=Math.round(TABLE.height);
 canvas.style.aspectRatio=String(TABLE.width/TABLE.height);
 const balls=fullRack();
 const p=kitchenPoint(TABLE.width*.18,TABLE.height/2);
 Object.assign(balls[0],p);
 game={balls,match:startCutthroat(),phase:'placeBreak',
  angle:0,power:85,top:0,side:0,shot:null,statsRackId:newCutthroatStatsId(),placementValid:false};
 accumulator=0;
 $('cut-log').replaceChildren();
 $('cut-power').value='85';$('cut-top').value='0';$('cut-side').value='0';
 say('New three-player rack. Player 1 breaks. Tap or drag in the kitchen, release, then aim and BREAK.');
 update();
}
const cue=()=>game.balls[0];
function update(){
 const m=game.match,placing=game.phase==='placeBreak'||game.phase==='placeCue';
 const canShoot=game.phase==='aim';
 const claim=m.pendingClaim;
 const actor=game.phase==='claim'&&claim?claim.claimant:m.turn;
 $('cut-turn').textContent=m.winner!==null?seatName(m.winner)+' wins!':seatName(actor)+' · '+(placing?'place the white ball':game.phase==='moving'?'balls moving':game.phase==='claim'?'scratch claim':game.phase==='chooseGroup'?'choose group':'shooting');
 $('cut-scores').textContent=m.owners.map((group,i)=>seatName(i)+': '+(group===null?'unassigned':ranges[group])+
  (group===null?'':' · '+remainingCutthroatBalls(m,group).length+' left')).join('  |  ');
 $('cut-status').textContent=m.winner!==null?'Last player with a ball on the table wins. Start a new rack to play again.':
  game.phase==='placeBreak'?'Tap or drag the cue ball behind the head string, then release to aim and BREAK.':
  game.phase==='placeCue'?'Scratch: incoming player has ball in hand. Tap an open place on the felt.':
  game.phase==='claim'&&claim?seatName(claim.claimant)+' may claim one on-table ball from '+seatName(claim.scratcher)+', or decline.':
  game.phase==='chooseGroup'?'Your turn has ended. Choose your earned group before play passes.':
  game.phase==='moving'?'Balls rolling…':
  m.groupChoicePlayer===m.turn?'You earned a team choice. Choose Blue, Yellow or Red above the table, or keep shooting.':
  session.breakShot?'Break the rack; balls pocketed on the break stay down.':
  'Aim from the white ball, then shoot. Any object ball may be pocketed, including your own.';
 $('cut-reposition').hidden=!(game.phase==='aim'&&session.breakShot);
 $('cut-place').hidden=game.phase!=='placeCue';
 $('cut-place').disabled=!placing||!game.placementValid||botSeat(m.turn);
 $('cut-place').textContent='Confirm ball in hand';
 $('cut-shoot').disabled=!canShoot||botSeat(m.turn);
 $('cut-shoot').textContent=session.breakShot?'BREAK':'SHOOT';
 $('cut-group').hidden=!(m.groupChoicePlayer===m.turn&&['aim','chooseGroup'].includes(game.phase));
 const choices=availableGroups(m);
 $('cut-group-select').replaceChildren(...choices.map(g=>new Option(ranges[g],String(g))));
 $('cut-claim').hidden=game.phase!=='claim';
 // The team choice stays above the table; scratch-claim actions remain in the drawer.
 if(game.phase==='claim') $('cut-options').open=true;
 $('cut-claim-select').replaceChildren(new Option('Decline claim',''),...(claim?.returnable||[]).map(id=>{
  const ball=game.balls?.find(b=>b.id===id);
  if(!ball)return new Option('Claim on-table '+ranges[groupForBall(id)]+' ball',String(id));
  const x=Math.round(ball.x/TABLE.width*100),y=Math.round(ball.y/TABLE.height*100);
  return new Option(ranges[groupForBall(id)]+' ball at '+x+'% across, '+y+'% down',String(id));
 }));
 $('cut-group-confirm').disabled=botSeat(m.turn);
 $('cut-claim-confirm').disabled=!!claim&&botSeat(claim.claimant);
 for(const id of ['cut-power','cut-top','cut-side'])$(id).disabled=!canShoot||botSeat(m.turn);
 $('cut-power-value').textContent=game.power+'%';
 $('cut-top-value').textContent=game.top+'%';
 $('cut-side-value').textContent=game.side+'%';
 scheduleBot();
}
function finishShot(){
 const shot=game.shot;if(!shot)return;
 game.shot=null;
 const result=session.resolveShot({shotId:shot.statsShotId,context:{
  match:game.match,shotEvents:shot.events,breakShot:shot.breakShot,
 }});
 game.match=result.actions.match;
 session.settle({done:result.rackEnd,ballInHand:result.ballInHand});
 if(game.match.winner!==null){game.phase='done';say(seatName(game.match.winner)+' wins the rack.');}
 else if(game.match.pendingTurn!==null){game.phase='chooseGroup';}
 else if(game.match.pendingClaim){game.phase='claim';}
 else game.phase='aim';
 update();
}
function shoot(fromBot=false){
 if(game.phase!=='aim'||(botSeat(game.match.turn)&&!fromBot))return;
 const shotId=newCutthroatStatsId();
 if(!session.startShot(shotId))return;
 cancelPointer();
 const b=cue(),speed=shotSpeed(game.power,session.breakShot);
 b.vx=Math.cos(game.angle)*speed;b.vy=Math.sin(game.angle)*speed;
 applyCueSpin(b,game.top/100,game.side/100);
 game.shot={events:[],time:0,stillFrames:0,breakShot:session.breakShot,statsShotId:shotId};
 if(session.breakShot)reportCutthroatRack(game.statsRackId);
 game.phase='moving';game.power=68;game.top=0;game.side=0;
 $('cut-power').value='68';$('cut-top').value='0';$('cut-side').value='0';
 update();
}
function placeCue(p){
 if(game.phase==='placeBreak'){
  // Touches past the head string must not silently teleport the cue into the kitchen.
  // Keep near-rail clamping for finger placement at the cushion edge.
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
 renderer.drawSurface(ctx);renderer.drawBalls(ctx,game.balls,drawCutthroatBall);
 if(game.phase==='aim')renderer.drawAim(ctx,cue(),game.angle);
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
 return tablePoint(canvas,e);
}
function aim(p){
 const angle=angleFromPointer(cue(),p,invertAim(),TABLE.radius);
 if(angle!==null)game.angle=angle;
}
listen(canvas,'pointerdown',e=>{
 if(botSeat(game.match.turn)||activePointer!==null)return;
 const p=point(e);
 if(game.phase==='aim'&&session.breakShot&&p.x<headStringX()){
  game.phase='placeBreak';game.placementValid=false;
 }
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(p);
 else if(game.phase==='aim')aim(point(e));
 else return;
 dragging=true;activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);
});
listen(canvas,'pointermove',e=>{
 if(!dragging||activePointer!==e.pointerId||botSeat(game.match.turn))return;
 if(['placeBreak','placeCue'].includes(game.phase))placeCue(point(e));
 else if(game.phase==='aim')aim(point(e));
});
listen(canvas,'pointerup',e=>{
 if(activePointer!==e.pointerId)return;
 if(!botSeat(game.match.turn)&&dragging&&game.phase==='placeBreak'){
  placeCue(point(e));
  if(game.placementValid)confirmPlacement();
 }else if(!botSeat(game.match.turn)&&dragging&&game.phase==='aim')aim(point(e));
 cancelPointer();
});
for(const event of ['pointercancel','lostpointercapture'])listen(canvas,event,e=>{
 if(activePointer===e.pointerId)cancelPointer();
});
function confirmPlacement(fromBot=false){
 if(!game.placementValid||!['placeBreak','placeCue'].includes(game.phase)||
    (botSeat(game.match.turn)&&!fromBot))return;
 if(game.phase==='placeCue'){
  if(!session.confirmPlacement())return;
  const b=cue();b.pocketed=false;b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;b.motion='stationary';
 }
 cancelPointer();game.phase='aim';update();
}
function chooseGroup(group,fromBot=false){
 if(!['aim','chooseGroup'].includes(game.phase)||game.match.groupChoicePlayer!==game.match.turn||
    (botSeat(game.match.turn)&&!fromBot))return;
 const chooser=game.match.turn;
 game.match=assignCutthroatGroup(game.match,chooser,group);
 say(seatName(chooser)+' chose '+ranges[group]+'.');
 if(game.match.winner!==null){game.phase='done';session.settle({done:true});}
 else if(game.match.pendingClaim)game.phase='claim';
 else if(game.phase==='chooseGroup')game.phase='aim';
 update();
}
function resolveClaim(id,fromBot=false){
 if(game.phase!=='claim'||!game.match.pendingClaim||
    (botSeat(game.match.pendingClaim.claimant)&&!fromBot))return;
 const claimant=game.match.pendingClaim.claimant;
 game.match=resolveCutthroatClaim(game.match,id);
 say(seatName(claimant)+(id!==null?' claimed ball '+id+'.':' declined the scratch claim.'));
 if(game.match.winner!==null){game.phase='done';session.settle({done:true});}
 else{
  const b=cue(),p=findPlacement(game.balls);
  if(p){Object.assign(b,p);game.placementValid=true;}
  else game.placementValid=false;
  game.phase='placeCue';
 }
 update();
}
function scheduleBot(){
 if(botTurns.pending||!game)return;
 const m=game.match,phase=game.phase;
 const actor=phase==='claim'?m.pendingClaim?.claimant:m.turn;
 if(actor===undefined||!botSeat(actor)||!['placeBreak','placeCue','aim','chooseGroup','claim'].includes(phase))return;
 botTurns.schedule(()=>{
  if(!game)return;
  const current=game.match,now=game.phase;
  const currentActor=now==='claim'?current.pendingClaim?.claimant:current.turn;
  if(currentActor===undefined||!botSeat(currentActor))return;
  if(now==='claim'){
   resolveClaim(current.pendingClaim.returnable[0]??null,true);return;
  }
  if(current.groupChoicePlayer===current.turn&&['aim','chooseGroup'].includes(now)){
   const choices=availableGroups(current);
   if(choices.length)chooseGroup(choices[0],true);
   return;
  }
  if(now==='placeBreak'||now==='placeCue'){
   const p=now==='placeBreak'?kitchenPoint(TABLE.width*.18,TABLE.height/2):findPlacement(game.balls);
   if(!p){say('Squatch Bot could not find a legal cue placement.');return;}
   game.placementValid=now==='placeBreak'?
    canPlaceBreakCue(game.balls,p.x,p.y):canPlace(game.balls,p.x,p.y,0);
   if(!game.placementValid){say('Squatch Bot has no legal cue placement.');return;}
   Object.assign(cue(),p);confirmPlacement(true);return;
  }
  if(now!=='aim')return;
  const targets=game.balls.filter(b=>b.id>0&&!b.pocketed).map(b=>b.id);
  const plan=planBotShot({balls:game.balls,targets,pockets,radius:TABLE.radius,table:TABLE,breakShot:session.breakShot});
  if(!plan){say('Squatch Bot has no available object-ball target.');return;}
  game.angle=plan.angle;game.power=plan.power;game.top=0;game.side=0;
  shoot(true);
 },650);
}
listen($('cut-place'),'click',()=>{if(game.phase==='placeCue')confirmPlacement();});
listen($('cut-shoot'),'click',()=>shoot());
listen($('cut-reposition'),'click',()=>{
 if(game.phase!=='aim'||!session.breakShot||botSeat(game.match.turn))return;
 game.phase='placeBreak';game.placementValid=false;update();
});
listen($('cut-new'),'click',newGame);
listen($('cut-size'),'change',newGame);
listen($('cut-players'),'change',newGame);
listen($('cut-group-confirm'),'click',()=>chooseGroup(Number($('cut-group-select').value)));
listen($('cut-claim-confirm'),'click',()=>{
 const id=$('cut-claim-select').value;
 resolveClaim(id?Number(id):null);
});
for(const [id,key] of [['cut-power','power'],['cut-top','top'],['cut-side','side']])
 listen($(id),'input',e=>{game[key]=Number(e.target.value);update();});
listen(window,'keydown',e=>{
 const tag=e.target?.tagName?.toLowerCase();
 if(!game||game.phase!=='aim'||botSeat(game.match.turn)||e.target?.isContentEditable||
  (tag&&!['body','html','canvas'].includes(tag))||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'){game.angle-=.025;e.preventDefault();}
 if(e.key==='ArrowRight'){game.angle+=.025;e.preventDefault();}
 if(e.code==='Space'){shoot();e.preventDefault();}
});
try{const saved=localStorage.getItem('squatch-table-size');if(['7','8','9'].includes(saved))$('cut-size').value=saved;}catch{}
// A telemetry exception must never prevent the table from starting.
try {
 newGame();
 draw(); // Paint immediately, even if animation frames are delayed.
 requestAnimationFrame(frame);
} catch (error) {
 console.error('Cutthroat game startup failed', error);
 const status=$('cut-status');
 if(status)status.textContent='Cutthroat table could not initialize: '+(error?.message||String(error));
}
try {
 telemetry=createGameTelemetry('cutthroat',{root});
} catch (error) {
 console.error('Cutthroat statistics startup failed', error);
 const status=$('cut-stats-status');
 if(status)status.textContent='Statistics failed to initialize; gameplay remains available.';
}
const controller={
 get isRackInProgress(){return session.isRackInProgress;},
 dispose(){
  if(disposed)return;
  disposed=true;cancelBot();cancelPointer();
  globalThis.cancelAnimationFrame?.(frameId);
  for(const cleanup of cleanups.splice(0).reverse())cleanup();
  if(mountedGames.get(root)===controller)mountedGames.delete(root);
 },
};
mountedGames.set(root,controller);
return controller;
}
