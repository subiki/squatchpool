// Experimental browser-local Chaos Pool. No eval, remote code or external storage.
const canvas=document.querySelector('#chaos-table');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const W=960,H=520,R=13,KEY='squatch-chaos-tables-v1';
let balls=[],bumpers=[],playing=false,shots=0,pocketed=0,drag=null,aim={x:1,y:0},snapshot=null,last=0,frame=0;
const rand=(a,b)=>a+Math.random()*(b-a);
const mods=()=>({bounce:$('mod-bounce').checked,gravity:$('mod-gravity').checked,magnet:$('mod-magnet').checked,pinball:$('mod-pinball').checked});
const setMods=m=>{for(const [key,id] of [['bounce','mod-bounce'],['gravity','mod-gravity'],['magnet','mod-magnet'],['pinball','mod-pinball']])$(id).checked=!!m[key];};
const clone=v=>JSON.parse(JSON.stringify(v));
const ball=(x,y,c='#f6f3e7')=>({x,y,vx:0,vy:0,c});
const bounded=(x,y)=>({x:Math.max(32,Math.min(W-32,x)),y:Math.max(32,Math.min(H-32,y))});
function randomize(){
 playing=false;shots=0;pocketed=0;
 balls=[ball(205,260)];
 const colors=['#ffb833','#e64e50','#4ca4ef','#d66de0','#f7f1b0','#76d68d'];
 for(let i=0;i<Math.floor(rand(5,17));i++)balls.push(ball(rand(340,850),rand(55,465),colors[i%colors.length]));
 bumpers=Array.from({length:Math.floor(rand(2,9))},()=>({...bounded(rand(300,850),rand(65,455)),r:rand(18,34)}));
 setMods({bounce:Math.random()>.4,gravity:Math.random()>.6,magnet:Math.random()>.6,pinball:Math.random()>.25});
 $('chaos-name').value=['Wild Pocket','Forest Frenzy','Squatch Panic','Unhinged Eight','Moss Monster'][Math.floor(rand(0,5))];
 snapshot=state();status('Random chaos ready. Drag things around or press Play.');draw();
}
function state(){return{version:1,name:$('chaos-name').value.slice(0,72),balls:clone(balls.map(({x,y,c})=>({x,y,c}))),bumpers:clone(bumpers),mods:mods()};}
function load(s){
 if(!s||s.version!==1||!Array.isArray(s.balls)||!Array.isArray(s.bumpers)||s.balls.length>70||s.bumpers.length>40)return false;
 if(!s.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&typeof b.c==='string'&&/^#[0-9a-f]{6}$/i.test(b.c))||!s.bumpers.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.r)&&b.r>=10&&b.r<=45))return false;
 balls=s.balls.map(b=>{const p=bounded(b.x,b.y);return ball(p.x,p.y,b.c);});
 bumpers=s.bumpers.map(b=>({...bounded(b.x,b.y),r:b.r}));
 setMods(s.mods||{});$('chaos-name').value=String(s.name||'Chaos Pool').slice(0,72);
 playing=false;shots=0;pocketed=0;$('chaos-play').textContent='▶ Play';snapshot=state();draw();return true;
}
function status(message){$('chaos-status').textContent=message;$('chaos-counter').textContent=`${shots} shots · ${pocketed} balls pocketed`;}
function saved(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.slice(0,30):[];}catch{return [];}}
function refreshSaved(){const select=$('chaos-load');select.replaceChildren(new Option('Choose a saved creation',''));saved().forEach((s,i)=>select.add(new Option(s.name||'Untitled',String(i))));}
function save(){const s=state();if(!s.balls.length){status('Add at least one ball before saving.');return;}const list=saved();list.unshift(s);try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,30)));refreshSaved();status('Saved locally with all mods: '+s.name);}catch{status('Browser storage unavailable; table is still playable.');}}
const pockets=[[28,28],[W/2,22],[W-28,28],[28,H-28],[W/2,H-22],[W-28,H-28]];
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#1c5c3b';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#9dcb9d';ctx.lineWidth=2;ctx.strokeRect(24,24,W-48,H-48);
 for(const [x,y] of pockets){ctx.fillStyle='#101713';ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();}
 if(mods().magnet){ctx.strokeStyle='#d4b96b';ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(W/2,H/2,54,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 if(mods().pinball)for(const b of bumpers){ctx.fillStyle='#e9a845';ctx.strokeStyle='#fff0a8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const b of balls){ctx.fillStyle=b.c;ctx.strokeStyle='#10241b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(playing&&balls.length&&Math.hypot(balls[0].vx,balls[0].vy)<.25){const b=balls[0];ctx.strokeStyle='#fff3b0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+aim.x*95,b.y+aim.y*95);ctx.stroke();}
}
function tick(time){
 const dt=Math.min(2,(time-last)/16.67||1);last=time;
 if(playing){
 const m=mods();
 for(const b of balls){
  if(m.gravity)b.vx+=.035*dt;
  if(m.magnet){const dx=W/2-b.x,dy=H/2-b.y,d=Math.hypot(dx,dy)||1;b.vx+=dx/d*.05*dt;b.vy+=dy/d*.05*dt;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.988,dt);b.vy*=Math.pow(.988,dt);
  const restitution=m.bounce?1.16:.87;
  if(b.x<R+24||b.x>W-R-24){b.x=Math.max(R+24,Math.min(W-R-24,b.x));b.vx*=-restitution;}
  if(b.y<R+24||b.y>H-R-24){b.y=Math.max(R+24,Math.min(H-R-24,b.y));b.vy*=-restitution;}
  if(m.pinball)for(const p of bumpers){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||.001;if(d<R+p.r){const nx=dx/d,ny=dy/d,impact=b.vx*nx+b.vy*ny;b.x=p.x+nx*(R+p.r);b.y=p.y+ny*(R+p.r);b.vx-=2*impact*nx;b.vy-=2*impact*ny;b.vx+=nx*2;b.vy+=ny*2;}}
 }
 for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;if(d<R*2){const nx=dx/d,ny=dy/d,over=(R*2-d)/2;a.x-=nx*over;b.x+=nx*over;a.y-=ny*over;b.y+=ny*over;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const imp=-rel*.94;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny;}}}
 for(let i=balls.length-1;i>=0;i--)if(pockets.some(([x,y])=>Math.hypot(balls[i].x-x,balls[i].y-y)<22)){if(i===0){balls[0]=ball(205,260);status('Scratch! Cue ball respotted.');}else{balls.splice(i,1);pocketed++;status('Ball pocketed!');}}
 }
 draw();frame=requestAnimationFrame(tick);
}
const coords=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
canvas.addEventListener('pointerdown',e=>{const p=coords(e);canvas.setPointerCapture(e.pointerId);if(playing){drag={type:'aim',x:p.x,y:p.y};return;}let i=balls.findIndex(b=>Math.hypot(b.x-p.x,b.y-p.y)<R+12);if(i>=0){drag={type:'ball',i};return;}i=bumpers.findIndex(b=>Math.hypot(b.x-p.x,b.y-p.y)<b.r+9);if(i>=0){drag={type:'bumper',i};return;}if(balls.length<70){balls.push(ball(p.x,p.y,['#f7bb45','#ee6060','#63b1f5'][balls.length%3]));drag={type:'ball',i:balls.length-1};draw();}});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=coords(e);if(drag.type==='aim'&&balls.length){const b=balls[0],dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;aim={x:dx/d,y:dy/d};}else if(!playing){const b=drag.type==='ball'?balls[drag.i]:bumpers[drag.i];if(b)Object.assign(b,bounded(p.x,p.y));}draw();});
canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
$('chaos-random').addEventListener('click',randomize);
$('chaos-play').addEventListener('click',()=>{if(!playing)snapshot=state();playing=!playing;$('chaos-play').textContent=playing?'✎ Build':'▶ Play';status(playing?'Play mode: drag from the white ball to aim, then shoot.':'Build mode: drag objects and tap felt to add balls.');draw();});
$('chaos-reset').addEventListener('click',()=>{if(snapshot&&load(snapshot))status('Restored the starting layout and mods.');});
$('chaos-clear').addEventListener('click',()=>{playing=false;balls=[ball(205,260)];bumpers=[];shots=0;pocketed=0;snapshot=state();$('chaos-play').textContent='▶ Play';status('Cleared. Tap felt to add balls.');draw();});
$('chaos-shoot').addEventListener('click',()=>{if(!playing){status('Press Play before shooting.');return;}if(!balls.length)return;const b=balls[0];if(Math.hypot(b.vx,b.vy)>.5){status('Wait for the balls to settle.');return;}const power=Number($('chaos-power').value)/100;b.vx=aim.x*(3+power*16);b.vy=aim.y*(3+power*16);shots++;status('CHAOS! Shot '+shots);});
$('chaos-save').addEventListener('click',save);
$('chaos-load').addEventListener('change',e=>{const s=saved()[Number(e.target.value)];if(e.target.value!==''&&s&&load(s))status('Loaded '+s.name+' with saved mods.');});
randomize();refreshSaved();frame=requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
