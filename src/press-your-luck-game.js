import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,canPlace,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {groupOf} from './rules.js';
import {newMatch,validateTargetScore} from './press-your-luck-score.js';
import {pressTurn,pressEligible} from './press-your-luck-turn.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let match,balls=[],turn=0,groups=[null,null],phase='ready',angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0,breakShot=true;
const callBall=$('call-ball'),callPocket=$('call-pocket');
function message(s){$('status').textContent=s;}
function rack(){
 setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;
 balls=fullRack();turn=match.breaker;groups=[null,null];phase='aim';breakShot=true;angle=0;events=[];acc=0;previous=0;
 $('next').hidden=true;message('Rack '+match.rack+' · Player '+(turn+1)+' breaks. Tap the felt to aim.');update();
}
function update(){
 $('score').textContent='Player 1: '+match.scores[0]+' · Player 2: '+match.scores[1]+' · Target '+match.targetScore;
 $('bonus').textContent='Provisional: '+match.bonus[0]+' · '+match.bonus[1]+' · Groups: '+(groups[0]||'open')+' / '+(groups[1]||'open');
 callBall.replaceChildren(new Option('Choose ball',''),...balls.filter(b=>!b.pocketed&&b.id).map(b=>new Option(String(b.id),String(b.id))));
 $('shoot').disabled=phase!=='aim';$('place').disabled=phase!=='place';
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
 const ids=events.filter(e=>e.type==='pocket').map(e=>e.ballId);
 const scratch=ids.includes(0);
 const called=Number(callBall.value),pocket=callPocket.value;
 const made=events.some(e=>e.type==='pocket'&&e.ballId===called&&e.pocketId===pocket);
 if(!groups[turn]&&!breakShot&&made&&groupOf(called)){groups[turn]=groupOf(called);groups[1-turn]=groups[turn]==='solids'?'stripes':'solids';}
 const eligible=pressEligible(preBalls,groups[turn]);
 const legalFirst=breakShot||(!groups[turn]?Boolean(groupOf(firstContact)):eligible?firstContact===8||groupOf(firstContact)===groups[turn]||groupOf(firstContact)===groups[1-turn]:groupOf(firstContact)===groups[turn]);
 const result=pressTurn({match,balls:preBalls,groups,shooter:turn,shotEvents:events,breakShot,legalShot:Boolean(legalFirst),eightAttempt:called===8&&!ids.includes(8),bankOrKick:$('bank').checked,calledShotMade:made});
 match=result.match;
 if(result.respotEight){const b=balls.find(b=>b.id===8);b.pocketed=false;const p=findPlacement(balls);if(p)Object.assign(b,p);}
 if(result.finish){
  const li=document.createElement('li');li.textContent='Rack '+(match.finished?match.rack:match.rack-1)+': Player '+(result.winner+1)+' wins '+match.lastRack.awarded+' points';$('history').prepend(li);
  phase='done';$('next').hidden=match.finished;
  message(match.finished?'Player '+(match.winner+1)+' wins the match!':'Rack over. Player '+(result.winner+1)+' breaks next.');update();return;
 }
 turn=result.nextPlayer;breakShot=false;
 if(scratch||result.ballInHand){cue().pocketed=false;cue().vx=cue().vy=0;const p=findPlacement(balls.filter(b=>b.id!==0));if(p)Object.assign(cue(),p);phase='place';message('Player '+(turn+1)+' has ball in hand. Tap a clear position and confirm.');}
 else{phase='aim';message('Player '+(turn+1)+' to shoot. '+(result.match.bonus[turn]?'Pressing bonus at risk.':''));}
 $('bank').checked=false;callPocket.value='';update();
}
function frame(t){
 const elapsed=previous?Math.min(.08,(t-previous)/1000):0;previous=t;
 if(phase==='moving'){acc+=elapsed;let n=0;while(acc>=1/120&&n++<12){const outcome=step(balls,1/120);events.push(...outcome.shotEvents);if(firstContact===null){const hit=outcome.shotEvents.find(e=>e.type==='contact'&& e.balls.includes(0));if(hit)firstContact=hit.balls.find(id=>id!==0);}acc-=1/120;shotElapsed+=1/120;still=stationary(balls)?still+1:0;if(still>20||shotElapsed>20){endShot();break;}}}
 draw();requestAnimationFrame(frame);
}
function aimPointer(e){if(!['aim','place'].includes(phase))return;const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*canvas.width/box.width,y=(e.clientY-box.top)*canvas.height/box.height;if(phase==='place'){if(canPlace(balls,x,y,0)){cue().x=x;cue().y=y;draw();}return;}const b=cue();const next=angleFromPointer(b,{x,y},$('invert-aim').checked,TABLE.radius);if(next!==null)angle=next;}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);aimPointer(e);});
canvas.addEventListener('pointermove',e=>{if(e.buttons)aimPointer(e);});
$('shoot').onclick=()=>{if(phase!=='aim')return;if(!breakShot&&(!callBall.value||!callPocket.value)){message('Call a ball and pocket first.');return;}preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;const b=cue(),v=shotSpeed(Number($('power').value),breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;phase='moving';$('shoot').disabled=true;};
$('place').onclick=()=>{if(phase==='place'){phase='aim';message('Player '+(turn+1)+' to shoot.');update();}};
$('next').onclick=rack;$('start').onclick=begin;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
begin();requestAnimationFrame(frame);
