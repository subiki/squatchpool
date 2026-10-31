import {readInvertAim,angleFromPointer} from './aim-preference.js';
import {TABLE,pockets,cushions,fullRack,step,stationary,shotSpeed,canPlace,findPlacement} from './physics.js';
import {setTableSize,renderPocket} from './table-geometry.js';
import {tunaTargets,tunaRackOrder,tunaJudgeShot} from './tuna-rules.js';
const $=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d');
let balls=[],turn=0,money=[0,0],phase='ready',angle=0,events=[],firstContact=null,preBalls=[],shotElapsed=0,still=0,previous=0,acc=0,breakShot=true,shotCall=0,shotPocket='';
const cue=()=>balls.find(b=>b.id===0);
function message(s){$('status').textContent=s;}
function rack(){setTableSize(Number($('size').value));canvas.width=TABLE.width;canvas.height=TABLE.height;balls=fullRack();const order=tunaRackOrder();balls.filter(b=>b.id>0).forEach((b,i)=>b.id=order[i]);turn=0;money=[0,0];phase='aim';breakShot=true;angle=0;events=[];previous=0;acc=0;$('history').replaceChildren();message('Player 1 breaks. Tap the felt to aim.');update();}
function update(){
 $('turn').textContent='Player '+(turn+1)+' to '+(phase==='place'?'place cue ball':phase==='done'?'celebrate':'shoot');
 $('money').textContent='Player 1: $'+money[0]+' · Player 2: $'+money[1];
 $('targets').textContent='Legal first contact: '+tunaTargets(balls).join(' or ');
 $('call-ball').replaceChildren(new Option('Choose ball',''),...balls.filter(b=>b.id>0&&!b.pocketed).map(b=>new Option(String(b.id),String(b.id))));
 $('shoot').disabled=phase!=='aim';$('place').disabled=phase!=='place';
}
function draw(){const {width:w,height:h,radius:r}=TABLE;ctx.fillStyle='#155f49';ctx.fillRect(0,0,w,h);ctx.fillStyle='#76563a';ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);for(const p of pockets)renderPocket(ctx,p);ctx.strokeStyle='#c59a61';ctx.lineWidth=2;ctx.beginPath();for(const c of cushions){ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);}ctx.stroke();for(const b of balls){if(b.pocketed)continue;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fillStyle=b.id===0?'#fff':b.id===8?'#111':b.id<=7?'#ddac4b':'#477fc0';ctx.fill();ctx.strokeStyle='#ffffff99';ctx.stroke();if(b.id){ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(b.id,b.x,b.y);}}if(phase==='aim'){const b=cue(),dx=Math.cos(angle),dy=Math.sin(angle);ctx.strokeStyle='#f4e1a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+dx*r,b.y+dy*r);ctx.lineTo(b.x+dx*240,b.y+dy*240);ctx.stroke();ctx.strokeStyle='#d6aa70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-dx*(r+15),b.y-dy*(r+15));ctx.lineTo(b.x-dx*(r+140),b.y-dy*(r+140));ctx.stroke();}}
function spot(id){const b=balls.find(b=>b.id===id);if(!b)return;const p=findPlacement(balls.filter(other=>other.id!==id),{x:TABLE.width*.7,y:TABLE.height/2});if(p)Object.assign(b,p,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});}
function endShot(){
 const pocketEvents=events.filter(e=>e.type==='pocket'),pocketed=pocketEvents.map(e=>e.ballId),scratch=pocketed.includes(0);
 const result=tunaJudgeShot({balls:preBalls,firstContact,pocketed,calledBall:shotCall,calledPocket:shotPocket,pocketEvents,scratch});
 for(const id of result.spotted)spot(id);
 money[turn]+=result.payout;
 const li=document.createElement('li');li.textContent='Player '+(turn+1)+': '+(result.foul?'Foul':result.winning?'Wins the rack':result.credited.length?'Made '+result.credited.join(', '):'Miss')+(result.payout?' · $'+result.payout:'');$('history').prepend(li);
 breakShot=false;
 if(result.winning){phase='done';message('Player '+(turn+1)+' wins Big Tuna Casserole! Start a new rack to play again.');update();return;}
 if(!result.keepTurn)turn=1-turn;
 if(result.ballInHand){const b=cue();Object.assign(b,{pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});const p=findPlacement(balls.filter(other=>other.id!==0));if(p)Object.assign(b,p);phase='place';message('Foul. Player '+(turn+1)+' has ball in hand. Tap a clear position, then confirm.');}
 else{phase='aim';message(result.keepTurn?'Good shot. Keep shooting.':'Player '+(turn+1)+' to shoot.');}
 $('call-pocket').value='';$('power').value='65';update();
}
function frame(t){const elapsed=previous?Math.min(.08,(t-previous)/1000):0;previous=t;if(phase==='moving'){acc+=elapsed;let n=0;while(acc>=1/120&&n++<12){const outcome=step(balls,1/120);events.push(...outcome.shotEvents);if(firstContact===null){const hit=outcome.shotEvents.find(e=>e.type==='contact'&&e.balls.includes(0));if(hit)firstContact=hit.balls.find(id=>id!==0);}acc-=1/120;shotElapsed+=1/120;still=stationary(balls)?still+1:0;if(still>20||shotElapsed>20){endShot();break;}}}draw();requestAnimationFrame(frame);}
function pointer(e){if(!['aim','place'].includes(phase))return;const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth,y=(e.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight;if(phase==='place'){if(canPlace(balls,x,y,0)){cue().x=x;cue().y=y;message('Valid cue position. Confirm placement.');}else message('Choose a clear cue position.');return;}const a=angleFromPointer(cue(),{x,y},$('invert-aim').checked,TABLE.radius);if(a!==null)angle=a;}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(e.buttons)pointer(e);});
$('shoot').onclick=()=>{if(phase!=='aim')return;if(!$('call-ball').value||!$('call-pocket').value){message('Call a ball and pocket first.');return;}shotCall=Number($('call-ball').value);shotPocket=$('call-pocket').value;preBalls=balls.map(b=>({...b}));events=[];firstContact=null;shotElapsed=still=acc=0;const b=cue(),v=shotSpeed(Number($('power').value),breakShot);b.vx=Math.cos(angle)*v;b.vy=Math.sin(angle)*v;phase='moving';$('shoot').disabled=true;};
$('place').onclick=()=>{if(phase==='place'){phase='aim';message('Player '+(turn+1)+' to shoot.');update();}};
$('start').onclick=rack;
try{$('invert-aim').checked=readInvertAim();$('size').value=localStorage.getItem('squatch-table-size')||'7';}catch{}
$('invert-aim').onchange=()=>{try{localStorage.setItem('squatch-invert-aim',String($('invert-aim').checked));}catch{}};
$('size').onchange=()=>{try{localStorage.setItem('squatch-table-size',$('size').value);}catch{}};
rack();requestAnimationFrame(frame);
