import * as THREE from 'three';
import {makePreview,changeView,shootPreview,advancePreview,toWorld,toTable} from './scene-state.js';

const $=id=>document.getElementById(id);
const host=$('stage'),model=makePreview(),ballMeshes=new Map();
const colorMap=['#f9f7e9','#e5ba20','#3268cf','#dd4e40','#6d479b','#ef9d3a','#31774c','#6e2734','#22212a','#e5ba20','#3268cf','#dd4e40','#6d479b','#ef9d3a','#31774c','#6e2734'];
const scene=new THREE.Scene();scene.background=new THREE.Color('#0c281d');scene.fog=new THREE.FogExp2('#0b2b22',.027);
const movingLights=[],arms=[],fireflies=[];
const camera=new THREE.PerspectiveCamera(53,1,.1,250);
const topCamera=new THREE.OrthographicCamera(-7.6,7.6,5,-5,.1,100);
let renderer,mode='cinematic',intro=true,introStart=0,now=0,last=0,acc=0,drag=false;
let hero,hat,gear,aimLine;
const TABLE_HEIGHT=1.51;
let seed=2771;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function material(color,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness});}
function mesh(parent,geometry,paint,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,paint);m.position.set(x,y,z);parent.add(m);return m;}
function cube(parent,w,h,d,color,x,y,z){const m=mesh(parent,new THREE.BoxGeometry(w,h,d),material(color),x,y,z);m.receiveShadow=true;return m;}
function ballShape(parent,r,color,x,y,z,scale=[1,1,1]){
 const m=mesh(parent,new THREE.SphereGeometry(r,16,12),color?.isMaterial?color:material(color,.48),x,y,z);
 m.scale.set(...scale);return m;
}
function cylinder(parent,up,down,height,color,x,y,z,segments=9){
 return mesh(parent,new THREE.CylinderGeometry(up,down,height,segments),material(color),x,y,z);
}
function writeSign(text,subtitle){
 const c=document.createElement('canvas');c.width=1024;c.height=392;
 const g=c.getContext('2d');g.fillStyle='#3a2418';g.fillRect(0,0,1024,392);
 g.strokeStyle='#b8844c';g.lineWidth=17;g.strokeRect(12,12,1000,367);
 for(let j=0;j<8;j++){g.strokeStyle='rgba(233,184,113,.08)';g.lineWidth=4;g.beginPath();g.moveTo(10,28+j*42);g.lineTo(1010,28+j*42);g.stroke();}
 g.textAlign='center';g.fillStyle='#f7d9a1';g.font='bold 128px Georgia';g.fillText(text,512,192);
 g.fillStyle='#b6d29c';g.font='bold 37px system-ui';g.fillText(subtitle,512,275);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function buildEnvironment(){
 scene.add(new THREE.HemisphereLight('#d9f5d3','#102c20',2.5));
 const sun=new THREE.DirectionalLight('#ffd59a',3.8);sun.position.set(-8,13,7);scene.add(sun);
 cube(scene,200,.3,200,'#183429',0,-.28,0);
 cylinder(scene,13,14,.09,'#38543a',0,-.05,0,32);
 // A timber shelter deep inside an improbably overgrown Pacific Northwest jungle.
 for(const x of [-8.7,8.7])for(const z of [-8,3.5])cylinder(scene,.21,.29,5.65,'#62432b',x,2.8,z);
 // Keep the canopy open above the table so neither overhead nor cinematic camera is blocked.
 cube(scene,18.9,.42,.42,'#513925',0,5.62,-8.2);
 for(const x of [-8.9,8.9])cube(scene,.42,.35,11.7,'#513925',x,5.6,-2.2);
 for(let i=0;i<8;i++)cube(scene,2.2,.13,.55,i%2?'#64462e':'#4f3828',-7.7+i*2.2,5.85,-7.65);
 const sign=mesh(scene,new THREE.PlaneGeometry(7.7,2.95),new THREE.MeshBasicMaterial({
  map:writeSign("THE 4T'S","NO REFUNDS. JUST REMATCHES."),side:THREE.DoubleSide
 }),0,3.75,-7.85);
 sign.rotation.x=-.03;
 // Ferns, spruce-like canopies, vines and warm drifting fireflies.
 for(let i=0;i<54;i++){
  const angle=rand()*Math.PI*2,d=10+rand()*22,x=Math.cos(angle)*d,z=Math.sin(angle)*d;
  const s=.7+rand()*.75;
  cylinder(scene,.22*s,.4*s,4*s,'#513a29',x,2*s,z);
  for(let j=0;j<3;j++){const leaf=mesh(scene,new THREE.ConeGeometry((1.25-j*.19)*s,(2.2-j*.13)*s,7),
    material(j===0?'#1c533d':j===1?'#276345':'#36784c'),x,(3.0+j*.74)*s,z);leaf.rotation.y=rand()*6.28;}
 }
 for(let i=0;i<68;i++){
  const a=rand()*Math.PI*2,dist=7+rand()*12,x=Math.cos(a)*dist,z=Math.sin(a)*dist;
  const fern=new THREE.Group();fern.position.set(x,.05,z);scene.add(fern);
  for(let k=0;k<8;k++){
   const phi=k*Math.PI/4,le=.5+rand()*.8;
   const leaf=mesh(fern,new THREE.ConeGeometry(.12*le,le,4),material(k%2?'#49944b':'#296a42'),
     Math.cos(phi)*le*.35,le*.33,Math.sin(phi)*le*.35);
   leaf.rotation.z=Math.cos(phi)*1.15;leaf.rotation.x=Math.sin(phi)*1.15;
  }
 }
 for(let i=0;i<54;i++){
  const phi=rand()*Math.PI*2,r=3+rand()*15;
  const glow=ballShape(scene,.028+rand()*.045,new THREE.MeshStandardMaterial({color:'#ffc878',emissive:'#edb765',emissiveIntensity:3}),
   Math.cos(phi)*r,.9+rand()*3.8,Math.sin(phi)*r);
  fireflies.push({mesh:glow,phase:rand()*6.3,speed:.6+rand()*1.6});
 }
 const lamp=new THREE.PointLight('#ffd3a0',58,22);lamp.position.set(0,5.3,0);scene.add(lamp);
 for(const x of [-3.7,0,3.7]){
  cylinder(scene,.22,.22,.13,'#96724a',x,5.37,-.1);
  ballShape(scene,.22,'#e2ba74',x,5.19,-.1,[1,.3,1]);
 }
}
function buildTable(){
 for(const x of [-4.3,4.3])for(const z of [-2.05,2.05])cube(scene,.48,1.3,.48,'#4d2d20',x,.65,z);
 cube(scene,10.9,.55,5.95,'#623e29',0,1.19,0);
 cube(scene,10.4,.15,5.45,'#9e6939',0,1.42,0);
 cube(scene,10,.06,5,'#105f50',0,1.50,0);
 for(const z of [-2.61,2.61]){
  cube(scene,10.75,.27,.22,'#69391f',0,1.64,z);
  cube(scene,10.05,.085,.07,'#27543f',0,1.56,z*.977);
 }
 for(const x of [-5.39,5.39]){
  cube(scene,.22,.27,5.8,'#69391f',x,1.64,0);
  cube(scene,.07,.085,5,'#27543f',x*.95,1.56,0);
 }
 const pocket=new THREE.MeshBasicMaterial({color:'#050c09'});
 for(const [x,z] of [[-5,-2.5],[0,-2.5],[5,-2.5],[-5,2.5],[0,2.5],[5,2.5]]){
  const radius=x===0?.23:.205;
  cylinder(scene,radius,radius,.03,'#0b1110',x,1.55,z,24);
  const rim=mesh(scene,new THREE.TorusGeometry(radius+.012,.02,6,24),material('#c49b62'),x,1.57,z);
  rim.rotation.x=-Math.PI/2;
 }
 for(let i=1;i<8;i++)for(const z of [-2.67,2.67]){
  const diamond=mesh(scene,new THREE.OctahedronGeometry(.057),material('#e2bb7a'),-5+i*1.25,1.81,z);
  diamond.scale.set(.8,.35,1);
 }
}
function createBigfoot(){
 const h=new THREE.Group();h.position.set(10,0,-4);scene.add(h);
 const fur='#8b8f94',dark='#596169',nose='#39383b',face='#a7a29b';
 ballShape(h,.83,fur,0,1.67,0,[1.15,1.46,.77]);
 ballShape(h,.63,fur,0,2.95,.09,[1.05,1.04,.9]);
 ballShape(h,.38,face,0,2.76,.54,[1.17,.7,.52]);
 ballShape(h,.20,nose,0,2.67,.86,[1.1,.6,.65]);
 for(const x of [-.28,.28]){
  ballShape(h,.09,'#f7edd9',x,3.01,.60);
  ballShape(h,.04,'#1f1a19',x,3.01,.68);
  const ring=mesh(h,new THREE.TorusGeometry(.20,.039,8,24),material('#242527',.46),x,3.02,.62);
  ring.scale.y=.83;
 }
 cube(h,.27,.07,.10,'#282a2b',0,3.02,.67);
 hat=cylinder(h,.62,.62,.40,'#2e4b58',0,3.52,0,16);
 cylinder(h,.62,.66,.07,'#a7b9a3',0,3.72,0,16);
 cube(h,1.34,.08,.48,'#2b4050',0,3.36,.42);
 for(const x of [-.48,.48]){
  const arm=new THREE.Group();arm.position.set(x,2.24,0);h.add(arm);
  ballShape(arm,.28,fur,x>0?.27:-.27,-.44,0,[.87,2.1,.8]);
  ballShape(arm,.22,face,x>0?.43:-.43,-.93,.02,[1.2,.9,1]);
  arms.push(arm);
 }
 for(const x of [-.36,.36]){
  ballShape(h,.34,dark,x,.64,0,[.96,1.25,.9]);
  ballShape(h,.4,dark,x,.25,.3,[1.15,.40,1.5]);
 }
 gear=new THREE.Group();gear.position.set(-1.15,1.25,-.45);h.add(gear);
 const bag=cylinder(gear,.36,.4,1.55,'#6e422c',0,0,0,12);bag.rotation.z=-.12;
 cube(gear,.67,.18,.71,'#36261e',0,-.65,0);
 for(let i=0;i<6;i++){
  const stick=cylinder(gear,.019,.035,2.0,i%2?'#e0b070':'#aac3ad',-.21+i*.085,.9,.07);
  stick.rotation.z=(i-3)*.027;
 }
 return h;
}
function ballTexture(id){
 const c=document.createElement('canvas');c.width=256;c.height=128;
 const p=c.getContext('2d');p.fillStyle=colorMap[id];p.fillRect(0,0,256,128);
 if(id>8){p.fillStyle='#eeeadd';p.fillRect(0,42,256,45);}
 if(id!==0){
  p.beginPath();p.fillStyle='#fdfbf1';p.arc(126,65,26,0,Math.PI*2);p.fill();
  p.fillStyle='#17191b';p.textAlign='center';p.textBaseline='middle';p.font='bold 31px Arial';p.fillText(String(id),126,66);
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function syncBalls(){
 for(const b of model.balls){
  let obj=ballMeshes.get(b.id);
  if(!obj){obj=mesh(scene,new THREE.SphereGeometry(.11,22,18),new THREE.MeshStandardMaterial({
   map:ballTexture(b.id),roughness:.19,metalness:.02
  }));ballMeshes.set(b.id,obj);}
  const w=toWorld(b);obj.position.set(w.x,w.y+.08,w.z);obj.visible=!b.pocketed;
 }
 for(const [id,obj] of ballMeshes)if(!model.balls.some(b=>b.id===id))obj.visible=false;
}
function cueLine(){
 if(aimLine){scene.remove(aimLine);aimLine.geometry.dispose();aimLine.material.dispose();aimLine=null;}
 const b=model.balls.find(v=>v.id===0);
 if(!b||b.pocketed||intro||model.phase!=='aim')return;
 const c=toWorld(b),a=model.angle;
 const from=new THREE.Vector3(c.x,c.y+.10,c.z);
 const to=new THREE.Vector3(c.x+Math.cos(a)*3,c.y+.10,c.z+Math.sin(a)*3);
 const geom=new THREE.BufferGeometry().setFromPoints([from,to]);
 aimLine=new THREE.Line(geom,new THREE.LineDashedMaterial({color:'#ffdf96',dashSize:.17,gapSize:.10,transparent:true,opacity:.95}));
 aimLine.computeLineDistances();scene.add(aimLine);
}
function resize(){
 const w=host.clientWidth||600,h=host.clientHeight||420;renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.updateProjectionMatrix();
 const aspect=w/h,size=aspect<1?7.5:6.8;
 topCamera.left=-size*aspect;topCamera.right=size*aspect;
 topCamera.top=size;topCamera.bottom=-size;topCamera.updateProjectionMatrix();
}
function showView(next){
 mode=next;changeView(model,mode);
 $('camera').textContent=mode==='overhead'?'◉ CINEMATIC VIEW':'◎ OVERHEAD VIEW';
 $('camera').setAttribute('aria-pressed',String(mode==='overhead'));
 if(mode==='overhead'){
  topCamera.position.set(0,20,.001);topCamera.up.set(0,0,-1);topCamera.lookAt(0,TABLE_HEIGHT,0);
 }else{
  camera.position.set(0,8.3,12.3);camera.lookAt(0,1.53,0);
 }
 cueLine();
}
function updateStatus(){
 const text=model.phase==='moving'?'Balls rolling…':model.lastPots.length?
  'Nice! Pocketed '+model.lastPots.filter(x=>x!==0).join(', ')+(model.lastPots.includes(0)?' — scratch!':'')+'.':'Tap or drag on the table to aim.';
 $('status').textContent=text;
 $('shoot').disabled=intro||model.phase!=='aim';
 $('power').disabled=intro||model.phase!=='aim';
}
function endIntro(){
 if(!intro)return;intro=false;
 $('intro').hidden=true;$('game-hud').hidden=false;
 $('camera').disabled=false;
 showView(mode);updateStatus();
}
function startIntro(){
 intro=true;introStart=performance.now();
 $('intro').hidden=false;$('game-hud').hidden=true;
 $('camera').disabled=true;camera.position.set(13,4.2,17);
 $('chapter').textContent='DEEP IN THE WOODS';
 $('intro-title').textContent='Somewhere, a cue ball drops.';
 $('intro-copy').textContent="Follow the noise. The 4T's are expecting company.";
}
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.62);
function aimFromPointer(ev){
 if(intro||model.phase!=='aim')return;
 const rect=renderer.domElement.getBoundingClientRect();
 const coord=new THREE.Vector2((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);
 ray.setFromCamera(coord,mode==='overhead'?topCamera:camera);
 const world=new THREE.Vector3();
 if(!ray.ray.intersectPlane(plane,world))return;
 const p=toTable(world),cue=model.balls.find(b=>b.id===0);
 const dx=p.x-cue.x,dy=p.y-cue.y;if(Math.hypot(dx,dy)<22)return;
 model.angle=Math.atan2(dy,dx);cueLine();
}
function tick(time){
 requestAnimationFrame(tick);
 const dt=Math.min((time-last)/1000||0,.05);last=time;now+=dt;
 if(intro){
  const elapsed=(time-introStart)/1000,less=$('reduced').checked||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(less||elapsed>=8.5)endIntro();
  else{
   const k=Math.max(0,Math.min(elapsed/8.5,1)),sm=k*k*(3-2*k);
   camera.position.set(13*(1-sm),4.0+4.3*sm,17-4.7*sm);
   camera.lookAt(0,2.1-sm*.54,-4+4*sm);
   if(elapsed>2.0&&elapsed<5.0){
    $('chapter').textContent="SPEED SQUATCH ARRIVES";
    $('intro-title').textContent='One bag. Six cues. No chill.';
    $('intro-copy').textContent='He only needs one stick. He brought six.';
   }else if(elapsed>=5.0){
    $('chapter').textContent="THE 4T'S / TABLE NO. 1";
    $('intro-title').textContent='SQUATCH VAN BOENING!';
    $('intro-copy').textContent='An unnecessarily dramatic break is now imminent.';
   }
  }
 }
 if(hero){
  const k=intro?Math.max(0,Math.min(1,((time-introStart)/1000-1)/3)):1;
  hero.position.x=10-k*3.45;
  hero.position.y=Math.sin(now*6)*.045*(intro?1:.24);
  hero.rotation.y=-.55+Math.sin(now*2.2)*.08;
  arms[0].rotation.z=Math.sin(now*4)*(.24+.45*(intro?1:.15));
  arms[1].rotation.z=Math.sin(now*5+1)*(.12+.38*(intro?1:.15));
  gear.rotation.z=Math.sin(now*4.5)*.12;
  hat.rotation.z=Math.sin(now*4)*.025;
 }
 for(const f of fireflies){
  f.mesh.position.y+=Math.sin(now*f.speed+f.phase)*.0009;
  f.mesh.material.emissiveIntensity=2.5+Math.sin(now*f.speed*2+f.phase)*1.6;
 }
 if(model.phase==='moving'){
  acc+=dt;
  let n=0;
  while(acc>=1/120&&n<14){
   const result=advancePreview(model,1/120);acc-=1/120;n++;
   if(result.done){acc=0;updateStatus();cueLine();break;}
  }
  if(n>=14)acc=0;
  syncBalls();
 }
 renderer.render(scene,mode==='overhead'&&!intro?topCamera:camera);
}
function fail(error){
 console.error('Jungle stage could not start:',error);
 $('loading').hidden=true;$('unsupported').hidden=false;
}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 host.append(renderer.domElement);
 buildEnvironment();buildTable();hero=createBigfoot();syncBalls();
 resize();window.addEventListener('resize',resize);
 $('loading').hidden=true;
 $('replay').disabled=false;$('reset').disabled=false;
 $('skip').addEventListener('click',endIntro);
 $('replay').addEventListener('click',startIntro);
 $('camera').addEventListener('click',()=>showView(mode==='overhead'?'cinematic':'overhead'));
 $('power').addEventListener('input',e=>{$('power-label').textContent=e.target.value+'%';model.power=Number(e.target.value);});
 $('shoot').addEventListener('click',()=>{if(!intro&&shootPreview(model)){updateStatus();cueLine();}});
 $('reset').addEventListener('click',()=>{
  const fresh=makePreview();Object.assign(model,fresh);changeView(model,mode);
  syncBalls();cueLine();updateStatus();$('status').textContent='Fresh rack. The jungle is watching.';
 });
 $('reduced').addEventListener('change',()=>{if(intro&&$('reduced').checked)endIntro();});
 renderer.domElement.addEventListener('pointerdown',e=>{
  if(intro)return;drag=true;renderer.domElement.setPointerCapture(e.pointerId);aimFromPointer(e);
 });
 renderer.domElement.addEventListener('pointermove',e=>{if(drag)aimFromPointer(e);});
 renderer.domElement.addEventListener('pointerup',()=>drag=false);
 renderer.domElement.addEventListener('pointercancel',()=>drag=false);
 renderer.domElement.addEventListener('webglcontextlost',e=>{
  e.preventDefault();fail(new Error('WebGL context lost; the classic game remains available.'));
 });
 $('stage').addEventListener('keydown',e=>{
  if(intro||model.phase!=='aim')return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   e.preventDefault();model.angle+=(e.key==='ArrowLeft'?-1:1)*.018;cueLine();
  }
  if(e.code==='Space'){e.preventDefault();shootPreview(model);updateStatus();}
 });
 startIntro();requestAnimationFrame(tick);
}catch(error){fail(error);}
