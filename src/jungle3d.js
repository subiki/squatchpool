// Experimental, opt-in Jungle 3D renderer. One canonical game state belongs to game.js.
// Three.js (MIT) is loaded only after the player requests 3D.
import {tableToWorld, worldToTable, BALL_COLORS} from './jungle-contract.js';
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

export function createJungleView({host, classic, controls, getState, onTablePoint, onStatus}) {
  let T, renderer, scene, camera, raycaster, tablePlane, ballMeshes = new Map();
  let character, head, arm, caseBag, cueLine, aimLine, current='classic';
  let introStart = null, introSeen = false, reaction = null, reactionUntil = 0, loadPromise = null;
  let lastRender = 0, disposed = false;
  const intro = document.createElement('div');
  intro.className = 'jungle-entrance';
  intro.hidden = true;
  intro.innerHTML = '<div class="entrance-card"><span class="eyebrow">THE 4T\'S PRESENTS</span><strong>SPEED SQUATCH</strong><p>"SHANE VAN BOENING!" · Too many cues, not enough patience.</p><button type="button" class="secondary skip-entrance">SKIP INTRO ➜</button></div>';
  host.append(intro);
  intro.querySelector('button').addEventListener('click', stopIntro);
  const btnClassic = controls.classic;
  const btnJungle = controls.jungle;
  const btnIntro = controls.intro;
  btnClassic.addEventListener('click', () => useClassic());
  btnJungle.addEventListener('click', () => useJungle(true));
  btnIntro.addEventListener('click', () => useJungle(true, true));

  function status(message){ if(onStatus)onStatus(message); }
  function syncButtons(){
    btnClassic.setAttribute('aria-pressed', String(current==='classic'));
    btnJungle.setAttribute('aria-pressed', String(current==='jungle'));
    btnClassic.classList.toggle('selected', current==='classic');
    btnJungle.classList.toggle('selected', current==='jungle');
  }
  function useClassic(message){
    current='classic'; host.hidden=true; classic.hidden=false; stopIntro();
    syncButtons(); if(message)status(message);
  }
  async function useJungle(playEntrance=false, force=false) {
    if(disposed)return;
    btnJungle.disabled=true;btnJungle.textContent='Loading 3D…';
    try {
      await ensureLoaded();
      if(disposed)return;
      current='jungle'; classic.hidden=true;host.hidden=false;
      resize();syncButtons();
      if(playEntrance && (force || !introSeen))startIntro();
      status('Jungle 3D is live. Aim on the table as usual; Classic returns instantly.');
    }catch(error){
      console.warn('Squatch Pool Jungle unavailable; Classic mode preserved.',error);
      useClassic('3D could not load on this device. Classic pool is still ready.');
    }finally{btnJungle.disabled=false;btnJungle.textContent='🌿 Jungle 3D';}
  }
  async function ensureLoaded(){
    if(renderer)return;
    if(!loadPromise)loadPromise=import(THREE_URL).then(mod=>{T=mod;build();}).catch(e=>{loadPromise=null;throw e;});
    return loadPromise;
  }
  function mat(color,roughness=.86){return new T.MeshStandardMaterial({color,roughness,metalness:.03});}
  function box(w,h,d,color,px=0,py=0,pz=0,parent=scene){
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));
    m.position.set(px,py,pz);parent.add(m);return m;
  }
  function sphere(r,color,x,y,z,parent=scene,segments=12){
    const m=new T.Mesh(new T.SphereGeometry(r,segments,10),mat(color));
    m.position.set(x,y,z);parent.add(m);return m;
  }
  function cylinder(radiusTop,radiusBottom,height,color,x,y,z,parent=scene,segments=8){
    const m=new T.Mesh(new T.CylinderGeometry(radiusTop,radiusBottom,height,segments),mat(color));
    m.position.set(x,y,z);parent.add(m);return m;
  }
  function build(){
    scene=new T.Scene();scene.background=new T.Color('#0a2421');scene.fog=new T.FogExp2('#0b2822',.022);
    camera=new T.PerspectiveCamera(43,2,.1,110);
    camera.position.set(0,18,23);camera.lookAt(0,0,0);
    renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label','3D Squatch pool table. Touch or drag to aim; use the Shoot button.');
    renderer.domElement.style.touchAction='none';
    host.prepend(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();useClassic('3D graphics were interrupted; back to Classic mode.');},{passive:false});
    scene.add(new T.HemisphereLight('#caf3d4','#40301d',2.2));
    const key=new T.DirectionalLight('#ffcc81',3.1);key.position.set(-9,22,8);scene.add(key);
    const lantern=new T.PointLight('#ffad55',36,32,2);lantern.position.set(7,7,9);scene.add(lantern);
    cylinder(33,33,.4,'#143e32',0,-2,0,scene,28);
    const ground=cylinder(28,28,.45,'#223b23',0,-1.8,0,scene,28);
    ground.receiveShadow=true;
    // The same 2:1 proportions are shared with the classic table.
    box(20.9,.78,10.9,'#4b2816',0,-.16,0);
    box(20.25,.12,10.25,'#126b57',0,.28,0);
    // Exposed wooden rail segments leave six independent corner/side openings.
    for(const z of [-5.22,5.22]){
      for(const [from,to] of [[-9.52,-.72],[.72,9.52]]){
        box(to-from,.48,.46,'#754223',(to+from)/2,.49,z);
        box(to-from,.05,.13,'#bd8d4f',(to+from)/2,.76,z+(z>0?-.13:.13));
      }
    }
    for(const x of [-10.21,10.21])box(.43,.48,8.75,'#754223',x,.49,0);
    for(const x of [-10,0,10])for(const z of [-5,5]){
      cylinder(.46,.39,.08,'#050d0b',x,.29,z,scene,18);
      cylinder(.51,.5,.06,'#ac7744',x,.23,z,scene,18);
    }
    // Rail diamonds go on TOP of the wooden rails, not on the felt.
    for(let i=1;i<=7;i++)for(const z of [-5.24,5.24]){
      const d=box(.10,.015,.10,'#ffebbb',-10+i*2.5,.78,z);
      d.rotation.y=Math.PI/4;
    }
    for(let i=1;i<=3;i++)for(const x of [-10.22,10.22]){
      const d=box(.10,.015,.10,'#ffebbb',x,.78,-5+i*2.5);d.rotation.y=Math.PI/4;
    }
    // Procedural jungle: lush, deliberately light on draw calls and external assets.
    let seed=1618;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<36;i++){
      const a=rand()*Math.PI*2,d=14+rand()*12,x=Math.cos(a)*d,z=Math.sin(a)*d;
      const height=3+rand()*8;
      cylinder(.2,.38,height,'#453827',x,height/2-1.4,z);
      for(let j=0;j<3;j++){
        const yy=height*.48+j*1.4,rr=1.35+j*.35;
        cylinder(0,rr,3,'#1c5d3b',x,yy-1.4,z,scene,7);
        sphere(.8,'#38814a',x+(rand()-.5)*1.5,yy-.3,z+(rand()-.5)*1.5);
      }
    }
    for(let i=0;i<28;i++){
      const a=rand()*Math.PI*2,d=12.7+rand()*4.5,x=Math.cos(a)*d,z=Math.sin(a)*d;
      const leaf=cylinder(0,.36,1.8,i%3?'#407d43':'#72a55c',x,.04,z);
      leaf.rotation.z=(rand()-.5)*1.2;
    }
    for(let i=0;i<16;i++){
      const a=rand()*Math.PI*2,x=Math.cos(a)*14,z=Math.sin(a)*14;
      sphere(.07,i%2?'#ffdc75':'#9bffd0',x,2.5+rand()*4,z);
    }
    // A hand-lettered jungle sign; generated with Canvas, no external image.
    const sign=document.createElement('canvas');sign.width=512;sign.height=190;
    const s=sign.getContext('2d');s.fillStyle='#3c2415';s.fillRect(0,0,512,190);
    s.strokeStyle='#d9a465';s.lineWidth=13;s.strokeRect(8,8,496,174);
    s.textAlign='center';s.fillStyle='#f1d1a0';s.font='bold 84px Georgia';s.fillText("THE 4T'S",256,118);
    const plane=new T.Mesh(new T.PlaneGeometry(7.7,2.85),new T.MeshBasicMaterial({map:new T.CanvasTexture(sign),side:T.DoubleSide}));
    plane.position.set(1.2,6.2,-13.7);scene.add(plane);
    buildSquatch();
    const guideGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
    aimLine=new T.Line(guideGeo,new T.LineDashedMaterial({color:'#ffdd93',dashSize:.23,gapSize:.16,linewidth:2}));scene.add(aimLine);
    cueLine=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#e5ba79'}));scene.add(cueLine);
    raycaster=new T.Raycaster();tablePlane=new T.Plane(new T.Vector3(0,1,0),-.48);
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointermove',onPointerMove);
    renderer.domElement.addEventListener('pointerup',()=>pointerDown=false);
    renderer.domElement.addEventListener('pointercancel',()=>pointerDown=false);
    window.addEventListener('resize',resize);
    resize();
  }
  function buildSquatch(){
    character=new T.Group();character.position.set(-12,0.1,5.3);scene.add(character);
    const body=sphere(1.15,'#818380',0,1.75,0,character,16);body.scale.set(.9,1.28,.68);
    head=sphere(.84,'#969893',0,3.3,.14,character,16);
    const muzzle=sphere(.39,'#a99b87',0,3.05,.78,character);muzzle.scale.set(1,.6,.5);
    for(const x of [-.33,.33]){
      const eye=sphere(.115,'#171b1d',x,3.43,.87,character);eye.scale.set(1,1,.45);
      const glasses=new T.Mesh(new T.TorusGeometry(.31,.075,7,20),mat('#d3c8a2'));
      glasses.position.set(x,3.44,.83);character.add(glasses);
    }
    box(.23,.07,.15,'#c2b491',0,3.43,.83,character);
    const crown=cylinder(.77,.79,.52,'#425b49',0,3.96,0,character,16);
    box(1.75,.11,.78,'#36493d',0,3.7,.43,character);
    arm=new T.Group();arm.position.set(-.95,2.75,0);character.add(arm);
    const forearm=cylinder(.29,.33,1.55,'#828581',-.10,-.76,.01,arm);
    forearm.rotation.z=-.19;
    const right=cylinder(.3,.37,1.62,'#777d78',1.03,1.95,.04,character);right.rotation.z=-.22;
    for(const x of [-.6,.65]) cylinder(.38,.42,1.65,'#737875',x,.65,.03,character);
    // The famously oversized cue case beside him.
    caseBag=new T.Group();caseBag.position.set(1.75,.2,1.3);character.add(caseBag);
    cylinder(.36,.39,3.15,'#543729',0,1.45,0,caseBag,14);
    cylinder(.39,.39,.24,'#d3a66a',0,2.95,0,caseBag,14);
    for(let i=0;i<5;i++)cylinder(.035,.035,3.65-i*.28,'#ddbd8a',(i-2)*.13,2.6-i*.12,.12,caseBag,6);
  }
  function labelForBall(id){
    const c=document.createElement('canvas');c.width=96;c.height=96;
    const g=c.getContext('2d');g.fillStyle='#fff7e6';g.beginPath();g.arc(48,48,43,0,2*Math.PI);g.fill();
    g.fillStyle='#161c21';g.textAlign='center';g.textBaseline='middle';g.font='bold 42px Arial';g.fillText(String(id),48,51);
    return new T.CanvasTexture(c);
  }
  function makeBall(b){
    const group=new T.Group();
    const material=mat(BALL_COLORS[b.id]||'#fafafa',.23);
    const sphereMesh=new T.Mesh(new T.SphereGeometry(.222,20,14),material);
    group.add(sphereMesh);
    if(b.id>8){
      const band=new T.Mesh(new T.SphereGeometry(.225,20,14,0,Math.PI*2,Math.PI*.31,Math.PI*.38),mat('#fff7e3',.26));
      group.add(band);
    }
    if(b.id!==0){
      const sprite=new T.Sprite(new T.SpriteMaterial({map:labelForBall(b.id),depthTest:true,transparent:true}));
      sprite.position.y=.228;sprite.scale.set(.23,.23,1);group.add(sprite);
    }
    group.userData.id=b.id;scene.add(group);ballMeshes.set(b.id,group);return group;
  }
  function syncBalls(state){
    const ids=new Set();
    for(const b of state.balls){
      ids.add(b.id);
      let mesh=ballMeshes.get(b.id);if(!mesh)mesh=makeBall(b);
      mesh.visible=!b.pocketed;
      if(!b.pocketed){const p=tableToWorld(b);mesh.position.set(p.x,.5,p.z);}
    }
    for(const [id,mesh] of ballMeshes)if(!ids.has(id)){
      scene.remove(mesh);mesh.traverse(o=>{o.geometry?.dispose();if(o.material?.map)o.material.map.dispose();o.material?.dispose();});
      ballMeshes.delete(id);
    }
  }
  function syncAim(state){
    const cb=state.balls.find(b=>b.id===0);
    const show=state.phase==='aim'&&cb&&!cb.pocketed;
    aimLine.visible=cueLine.visible=Boolean(show);
    if(!show)return;
    const p=tableToWorld(cb),dx=Math.cos(state.angle),dz=Math.sin(state.angle);
    const from=new T.Vector3(p.x,.74,p.z),to=new T.Vector3(p.x+dx*12,.74,p.z+dz*12);
    aimLine.geometry.setFromPoints([from,to]);aimLine.computeLineDistances();
    cueLine.geometry.setFromPoints([new T.Vector3(p.x-dx*.44,.62,p.z-dz*.44),new T.Vector3(p.x-dx*4,.62,p.z-dz*4)]);
  }
  function resize(){
    if(!renderer||current!=='jungle'&&host.hidden)return;
    const w=host.clientWidth||1000,h=host.clientHeight||500;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  let pointerDown=false;
  function pointerPoint(e){
    const rect=renderer.domElement.getBoundingClientRect();
    const ndc=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    raycaster.setFromCamera(ndc,camera);
    const world=new T.Vector3();
    if(!raycaster.ray.intersectPlane(tablePlane,world))return null;
    const p=worldToTable(world);return p.x>=0&&p.x<=1000&&p.y>=0&&p.y<=500?p:null;
  }
  function onPointerDown(e){
    if(introStart!==null)return;
    pointerDown=true;renderer.domElement.setPointerCapture(e.pointerId);
    const p=pointerPoint(e);if(p)onTablePoint(p,false);
  }
  function onPointerMove(e){
    if(!pointerDown||introStart!==null)return;
    const p=pointerPoint(e);if(p)onTablePoint(p,true);
  }
  function startIntro(){
    if(!character||window.matchMedia('(prefers-reduced-motion: reduce)').matches){introSeen=true;return;}
    introSeen=true;introStart=performance.now();intro.hidden=false;
  }
  function stopIntro(){introStart=null;intro.hidden=true;}
  function react(type){
    if(!renderer||current!=='jungle')return;
    reaction=type;reactionUntil=performance.now()+1300;
  }
  function render(state,now){
    if(!renderer||current!=='jungle'||document.hidden)return;
    // 3D rendering capped near 30fps for lower-end mobile devices; canonical simulation runs independently.
    if(now-lastRender<30)return;lastRender=now;
    if(!host.clientWidth)return;
    const w=host.clientWidth,h=host.clientHeight;
    if(renderer.domElement.width!==Math.round(w*renderer.getPixelRatio())||
       renderer.domElement.height!==Math.round(h*renderer.getPixelRatio()))resize();
    syncBalls(state);syncAim(state);
    let elapsed=0;
    if(introStart!==null){
      elapsed=(now-introStart)/1000;
      if(elapsed>7.5){stopIntro();elapsed=7.5;}
    }
    const angle=Math.min(elapsed/7.5,1);
    if(introStart!==null){
      camera.position.set(-13+angle*13,8+angle*10,21+angle*2);
      camera.lookAt(-7+angle*7,2.5-angle*2.3,0);
    }else{
      camera.position.set(0,18,23);camera.lookAt(0,.25,0);
    }
    if(character){
      const t=now/1000;
      const wave=introStart!==null?Math.sin(t*9)*.5:0;
      const response=now<reactionUntil?(reaction==='scratch'?-0.9:reaction==='win'?.9:.45)*Math.sin(t*12):0;
      arm.rotation.z=wave+response;
      head.rotation.z=(introStart!==null?Math.sin(t*4)*.13:Math.sin(t*.7)*.04)+response*.2;
      caseBag.rotation.z=introStart!==null?Math.sin(t*6)*.10:0;
      character.position.y=.10+Math.sin(t*2)*.035;
    }
    renderer.render(scene,camera);
  }
  function destroy(){
    disposed=true;useClassic();window.removeEventListener('resize',resize);
    renderer?.dispose();renderer?.domElement.remove();
  }
  syncButtons();
  return {useClassic,useJungle,render,react,destroy,getMode:()=>current};
}
