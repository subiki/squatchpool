import {NIGHTMARE_PRESET,NIGHTMARE_MODS,randomMods,onCollision,onPocket,onShot,applyForces} from './chaos-mechanics.js';
// Experimental browser-local Chaos Pool. No eval, remote code or external storage.
const canvas=document.querySelector('#chaos-table');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const W=960,H=520,R=13,KEY='squatch-chaos-tables-v1';
let balls=[],bumpers=[],playing=false,shots=0,pocketed=0,drag=null,aim={x:1,y:0},snapshot=null,last=0,frame=0,stage=0,events=[],goalFinished=false,editDraft=null;
const rand=(a,b)=>a+Math.random()*(b-a);
const mods=()=>({bounce:$('mod-bounce').checked,gravity:$('mod-gravity').checked,magnet:$('mod-magnet').checked,pinball:$('mod-pinball').checked,...Object.fromEntries(NIGHTMARE_MODS.map(k=>[k,$('mod-'+k).checked]))});
const setMods=m=>{for(const [key,id] of [['bounce','mod-bounce'],['gravity','mod-gravity'],['magnet','mod-magnet'],['pinball','mod-pinball']])$(id).checked=!!m[key];for(const k of NIGHTMARE_MODS)$('mod-'+k).checked=!!m[k];};
const clone=v=>JSON.parse(JSON.stringify(v));
const ball=(x,y,c='#f6f3e7')=>({x,y,vx:0,vy:0,c});
const bounded=(x,y)=>({x:Math.max(32,Math.min(W-32,x)),y:Math.max(32,Math.min(H-32,y))});
function randomize(){
 playing=false;shots=0;pocketed=0;stage=0;events=[];goalFinished=false;editDraft=null;$('chaos-result').textContent='';$('chaos-play').textContent='▶ Play';$('chaos-events').textContent='Chaos event log';
 balls=[ball(205,260)];
 const colors=['#ffb833','#e64e50','#4ca4ef','#d66de0','#f7f1b0','#76d68d'];
 for(let i=0;i<Math.floor(rand(5,17));i++)balls.push({...ball(rand(340,850),rand(55,465),colors[i%colors.length]),eight:i===0});
 bumpers=Array.from({length:Math.floor(rand(2,9))},()=>({...bounded(rand(300,850),rand(65,455)),r:rand(18,34)}));
 setMods({bounce:Math.random()>.4,gravity:Math.random()>.6,magnet:Math.random()>.6,pinball:Math.random()>.25,...randomMods()});
 $('chaos-name').value=['Wild Pocket','Forest Frenzy','Squatch Panic','Unhinged Eight','Moss Monster'][Math.floor(rand(0,5))];
 snapshot=state();status('Random chaos ready. Drag things around or press Play.');draw();
}
function state(){return{version:1,name:$('chaos-name').value.slice(0,72),balls:clone(balls.map(({x,y,c,eight,fragment})=>({x,y,c,eight:!!eight,fragment:!!fragment}))),bumpers:clone(bumpers),mods:mods(),goal:$('chaos-goal').value,shotLimit:Number($('chaos-limit').value)};}
function load(s){
 if(!s||s.version!==1||!Array.isArray(s.balls)||!Array.isArray(s.bumpers)||s.balls.length>70||s.bumpers.length>40)return false;
 if(!s.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&typeof b.c==='string'&&/^#[0-9a-f]{6}$/i.test(b.c))||!s.bumpers.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.r)&&b.r>=10&&b.r<=45))return false;
 balls=s.balls.map(b=>{const p=bounded(b.x,b.y);return {...ball(p.x,p.y,b.c),eight:!!b.eight,fragment:!!b.fragment};});
 bumpers=s.bumpers.map(b=>({...bounded(b.x,b.y),r:b.r}));
 setMods(s.mods||{});$('chaos-goal').value=['clear','eight','shots','survive','sandbox'].includes(s.goal)?s.goal:'clear';$('chaos-limit').value=String(Math.max(1,Math.min(99,Number(s.shotLimit)||12)));$('chaos-name').value=String(s.name||'Chaos Pool').slice(0,72);
 playing=false;shots=0;pocketed=0;stage=0;events=[];goalFinished=false;$('chaos-result').textContent='';$('chaos-events').textContent='Chaos event log';$('chaos-play').textContent='▶ Play';snapshot=state();draw();return true;
}
function status(message){$('chaos-status').textContent=message;$('chaos-counter').textContent=`${shots} shots · ${pocketed} balls pocketed · stage ${stage}`;$('chaos-events').textContent=events.length?events.slice(-4).join(' · '):'Chaos event log';}
function saved(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.slice(0,30):[];}catch{return [];}}
function refreshSaved(){const select=$('chaos-load');select.replaceChildren(new Option('Choose a saved creation',''));saved().forEach((s,i)=>select.add(new Option(s.name||'Untitled',String(i))));}
function save(){const s=editDraft?{...editDraft,name:$('chaos-name').value.slice(0,72)}:state();if(!s.balls.length){status('Add at least one ball before saving.');return;}const list=saved();list.unshift(s);try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,30)));refreshSaved();status('Saved locally with all mods: '+s.name);}catch{status('Browser storage unavailable; table is still playable.');}}
const pockets=[[28,28],[W/2,22],[W-28,28],[28,H-28],[W/2,H-22],[W-28,H-28]];
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#1c5c3b';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#9dcb9d';ctx.lineWidth=2;ctx.strokeRect(24,24,W-48,H-48);
 for(const [x,y] of pockets){ctx.fillStyle='#101713';ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();}
 if(mods().magnet){ctx.strokeStyle='#d4b96b';ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(W/2,H/2,54,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 if(mods().pinball)for(const b of bumpers){ctx.fillStyle='#e9a845';ctx.strokeStyle='#fff0a8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const b of balls){if(b.eight){ctx.strokeStyle='#f4d35e';ctx.lineWidth=5;ctx.beginPath();ctx.arc(b.x,b.y,R+5,0,Math.PI*2);ctx.stroke();}ctx.fillStyle=b.c;ctx.strokeStyle='#10241b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(playing&&balls.length&&Math.hypot(balls[0].vx,balls[0].vy)<.25){const b=balls[0];ctx.strokeStyle='#fff3b0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+aim.x*95,b.y+aim.y*95);ctx.stroke();}
}
function tick(time){
 const dt=Math.min(2,(time-last)/16.67||1);last=time;
 if(playing){
 const m=mods();const world={balls,bumpers,mods:m,events,stage,shots,pockets};
 for(const b of balls){
  if(m.gravity)b.vx+=.035*dt;
  applyForces(world,b,dt);
  if(b.portalCooldown>0)b.portalCooldown-=dt;
  if(m.magnet){const dx=W/2-b.x,dy=H/2-b.y,d=Math.hypot(dx,dy)||1;b.vx+=dx/d*.05*dt;b.vy+=dy/d*.05*dt;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.988,dt);b.vy*=Math.pow(.988,dt);
  const restitution=m.bounce?1.16:.87;
  // Pocket mouths must be tested before rail collision clamping.
  if((b.portalCooldown||0)<=0 && pockets.some(([px,py])=>Math.hypot(b.x-px,b.y-py)<25))continue;
  if(b.x<R+24||b.x>W-R-24){b.x=Math.max(R+24,Math.min(W-R-24,b.x));b.vx*=-restitution;}
  if(b.y<R+24||b.y>H-R-24){b.y=Math.max(R+24,Math.min(H-R-24,b.y));b.vy*=-restitution;}
  if(m.pinball)for(const p of bumpers){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||.001;if(d<R+p.r){const nx=dx/d,ny=dy/d,impact=b.vx*nx+b.vy*ny;b.x=p.x+nx*(R+p.r);b.y=p.y+ny*(R+p.r);b.vx-=2*impact*nx;b.vy-=2*impact*ny;b.vx+=nx*2;b.vy+=ny*2;}}
 }
 const collisionCount=balls.length;
 for(let i=0;i<collisionCount;i++)for(let j=i+1;j<collisionCount;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;if(d<R*2){const nx=dx/d,ny=dy/d,over=(R*2-d)/2;a.x-=nx*over;b.x+=nx*over;a.y-=ny*over;b.y+=ny*over;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){onCollision(world,a,b);const imp=-rel*.94;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny;}}}
 for(let i=balls.length-1;i>=0;i--)if((balls[i].portalCooldown||0)<=0 && pockets.some(([x,y])=>Math.hypot(balls[i].x-x,balls[i].y-y)<22)){if(i===0){balls[0]=ball(205,260);status('Scratch! Cue ball respotted.');}else{const sunk=balls.splice(i,1)[0];pocketed++;onPocket(world,sunk,false);stage=world.stage;status('Ball pocketed!');}}
  checkGoal();
 }
 draw();frame=requestAnimationFrame(tick);
}
function checkGoal(){
 if(goalFinished)return;
 const goal=$('chaos-goal').value,limit=Math.max(1,Math.min(99,Number($('chaos-limit').value)||12));
 const moving=balls.some(b=>Math.hypot(b.vx,b.vy)>.25);
 if(shots===0)return;
 // Gravity, magnets and bouncy rails can keep a table moving forever.
 // A completed objective is recognized immediately; shot-limit failure waits for settling.
 const won=goal==='clear'?balls.every((b,i)=>i===0||b.eight):goal==='eight'?!balls.some(b=>b.eight):goal==='shots'?pocketed>=3:goal==='survive'?shots>=5:false;
 if(won){goalFinished=true;$('chaos-result').textContent='🏆 YOU WIN! Your game is playable.';status('Game complete! Return to editing or reset.');return;}
 if(!moving&&goal!=='sandbox'&&shots>=limit){goalFinished=true;$('chaos-result').textContent='💥 GAME OVER — shot limit reached.';status('Try editing your game or reset for another run.');}
}
const coords=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
canvas.addEventListener('pointerdown',e=>{
 const p=coords(e);canvas.setPointerCapture(e.pointerId);
 if(playing){drag={type:'aim',x:p.x,y:p.y};return;}
 const tool=$('chaos-tool').value;
 let i=balls.findIndex(b=>Math.hypot(b.x-p.x,b.y-p.y)<R+12);
 let j=bumpers.findIndex(b=>Math.hypot(b.x-p.x,b.y-p.y)<b.r+9);
 if(tool==='erase'){
  if(i>0)balls.splice(i,1);else if(j>=0)bumpers.splice(j,1);
  draw();return;
 }
 if(i>=0){drag={type:'ball',i};return;}
 if(j>=0){drag={type:'bumper',i:j};return;}
 if(tool==='cue'){if(balls.length){Object.assign(balls[0],bounded(p.x,p.y));drag={type:'ball',i:0};}}
 else if(tool==='bumper'&&bumpers.length<40){bumpers.push({...bounded(p.x,p.y),r:25});drag={type:'bumper',i:bumpers.length-1};}
 else if((tool==='ball'||tool==='eight')&&balls.length<70){if(tool==='eight'&&balls.some(b=>b.eight)){status('Only one special 8-ball per game.');return;}balls.push({...ball(p.x,p.y,tool==='eight'?'#202020':['#f7bb45','#ee6060','#63b1f5'][balls.length%3]),eight:tool==='eight'});drag={type:'ball',i:balls.length-1};}
 draw();
});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=coords(e);if(drag.type==='aim'&&balls.length){const b=balls[0],dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;aim={x:dx/d,y:dy/d};}else if(!playing){const b=drag.type==='ball'?balls[drag.i]:bumpers[drag.i];if(b)Object.assign(b,bounded(p.x,p.y));}draw();});
canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
$('chaos-random').addEventListener('click',randomize);
$('chaos-play').addEventListener('click',()=>{if(playing){if(editDraft){load(editDraft);editDraft=null;}else if(snapshot)load(snapshot);status('Back to editing the original layout.');return;}snapshot=state();editDraft=state();goalFinished=false;$('chaos-result').textContent='';playing=true;$('chaos-play').textContent=playing?'✎ Build':'▶ Play';status(playing?'Play mode: drag from the white ball to aim, then shoot.':'Build mode: drag objects and tap felt to add balls.');draw();});
$('chaos-reset').addEventListener('click',()=>{if(snapshot&&load(snapshot)){editDraft=null;status('Restored the starting layout, rules and mods.');}});
$('chaos-clear').addEventListener('click',()=>{playing=false;editDraft=null;goalFinished=false;balls=[ball(205,260)];bumpers=[];shots=0;pocketed=0;snapshot=state();$('chaos-play').textContent='▶ Play';status('Cleared. Tap felt to add balls.');draw();});
$('chaos-shoot').addEventListener('click',()=>{if(!playing){status('Press Play before shooting.');return;}if(goalFinished){status('Game finished. Reset to play again.');return;}if(!balls.length)return;const b=balls[0];if(Math.hypot(b.vx,b.vy)>.5){status('Wait for the balls to settle.');return;}const power=Number($('chaos-power').value)/100;b.vx=aim.x*(3+power*16);b.vy=aim.y*(3+power*16);shots++;const world={balls,bumpers,mods:mods(),events,stage,shots,pockets};onShot(world);setMods(world.mods);status('CHAOS! Shot '+shots);});
$('chaos-save').addEventListener('click',save);
$('chaos-load').addEventListener('change',e=>{const s=saved()[Number(e.target.value)];if(e.target.value!==''&&s&&load(s))status('Loaded '+s.name+' with saved mods.');});
$('chaos-nightmare').addEventListener('click',()=>{randomize();$('chaos-name').value=NIGHTMARE_PRESET.name;setMods({bounce:true,gravity:false,magnet:false,pinball:true,...NIGHTMARE_PRESET.mods});snapshot=state();status('Squatch\'s Nightmare loaded: eight wild mechanics enabled.');});
$('chaos-test').addEventListener('click',()=>{if(playing)return;editDraft=state();snapshot=state();goalFinished=false;$('chaos-result').textContent='';playing=true;$('chaos-play').textContent='✎ Build';status('Playtest started. Shoot to try your rules.');});
$('chaos-edit').addEventListener('click',()=>{if(editDraft&&load(editDraft)){editDraft=null;status('Back to editing your original design.');}else if(playing&&snapshot){load(snapshot);status('Back to editing.');}});
randomize();refreshSaved();frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
