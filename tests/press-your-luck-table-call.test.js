import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,headStringX} from '../src/physics.js';
import {pockets} from '../src/table-geometry.js';
import {readFileSync} from 'node:fs';

// Drive the real Press Your Luck controller: the call drawer must not be
// required for touch play, and the cue must wait until the call is complete.
test('Press Your Luck: table ball/pocket call, undo and drag-to-aim on 7/8/9 ft',async()=>{
 const originals={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,Option:globalThis.Option,localStorage:globalThis.localStorage};
 const nodes=new Map(),listeners=new Map(),positions=new Map();
 const panel={open:false,removeAttribute(name){if(name==='open')this.open=false;},setAttribute(name){if(name==='open')this.open=true;}};
 let nextFrame=()=>{},time=0,cueDraws=0,frames=0,cancelled=0;
 const ctx=new Proxy({
  fillRect(x,y,w,h){if(x===0&&y===0&&w===TABLE.width&&h===TABLE.height)positions.clear();},
  fillText(value,x,y){if(/^\d+$/.test(String(value)))positions.set(String(value),{x,y});},
  stroke(){if(this.strokeStyle==='#d6aa70')cueDraws++;}
 },{get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:id==='size'?'7':id==='target'?'15':'',checked:false,disabled:false,hidden:false,textContent:'',
   clientLeft:0,clientTop:0,
   get clientWidth(){return this.width;},get clientHeight(){return this.height;},
   getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};},
   getContext(){return ctx;},setPointerCapture(){},
   addEventListener(event,fn){listeners.set(id+':'+event,fn);},
   setAttribute(name,value){this[name]=value;},
   removeEventListener(event,fn){if(listeners.get(id+':'+event)===fn)listeners.delete(id+':'+event);},
   replaceChildren(...children){this.children=children;if(id==='call-ball')this.value=children[0]?.value??'';},
   prepend(){},
  });
  return nodes.get(id);
 }
 const root={getElementById:node,querySelector:s=>s==='.kit-more'?panel:null,setAttribute(){},focus(){}};
 globalThis.document={getElementById:node,querySelector:s=>s==='main'?root:s==='.kit-more'?panel:null,querySelectorAll:()=>[],createElement:()=>({textContent:''}),
  addEventListener:(event,fn)=>listeners.set('document:'+event,fn),removeEventListener:event=>listeners.delete('document:'+event)};
 root.ownerDocument=globalThis.document;
 globalThis.window={document:globalThis.document,location:{href:'https://squatch.example/press-your-luck',origin:'https://squatch.example'},
  history:{state:null,scrollRestoration:'auto',replaceState(state){this.state=state;}},scrollTo(){},confirm:()=>false,
  addEventListener:(event,fn)=>listeners.set('window:'+event,fn),removeEventListener:(event,fn)=>{if(listeners.get('window:'+event)===fn)listeners.delete('window:'+event);}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.requestAnimationFrame=callback=>{nextFrame=callback;return ++frames;};
 globalThis.cancelAnimationFrame=()=>{cancelled++;};
 const tap=(x,y)=>listeners.get('table:pointerdown')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const drag=(x,y)=>listeners.get('table:pointermove')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const release=()=>listeners.get('table:pointerup')({pointerId:1,buttons:0});
 const tick=()=>{time+=1000/60;nextFrame(time);};
 const pressSpace=(tagName='BODY',extra={})=>{
  const event={code:'Space',key:' ',repeat:false,
   target:{tagName,isContentEditable:false},prevented:false,
   preventDefault(){this.prevented=true;},...extra};
  const listener=listeners.get('window:keydown');
  assert.equal(typeof listener,'function','active match registers shot key listener');
  listener(event);return event.prevented;
 };
 try{
  await import('../src/press-your-luck-entry.js');
  for(const size of [7,8,9]){
   node('size').value=String(size);node('size').onchange();
   assert.equal(TABLE.size,size,'size change rebuilds the regulation geometry immediately');
   assert.equal(node('table').width,TABLE.width);
   assert.equal(node('table').height,TABLE.height);
   const exiting={preventDefault(){this.prevented=true;}};
   listeners.get('window:beforeunload')(exiting);
   assert.equal(exiting.prevented,undefined,'untouched rack may be left without a warning');
   assert.equal(node('shoot').disabled,false,'legal default cue is immediately ready to BREAK');
   assert.match(node('score').textContent,/Rack \d+ · Race to 15/);
   assert.equal(node('press-banked-0').textContent,'0');
   assert.equal(node('press-own-0').textContent,'0');
   assert.equal(node('press-press-0').textContent,'0');
   assert.equal(node('press-projected-0').textContent,'2','projection includes legal 8 points');
   assert.match(node('bonus').textContent,/bonus at risk/);
   assert.equal(node('press-score-player-0')['data-active'],'true');

   tap(headStringX()*.55,TABLE.height/2);release();
   assert.equal(node('shoot').disabled,false,'dragging break cue needs no confirmation');
   tap(headStringX()*.55,TABLE.height/2);
   listeners.get('table:lostpointercapture')?.({pointerId:2});
   node('status').textContent='Owner still dragging';
   release();
   assert.match(node('status').textContent,/Cue positioned/,'another pointer losing capture must not release the owner');
   tap(headStringX()*.55,TABLE.height/2);
   listeners.get('table:lostpointercapture')?.({pointerId:1});
   node('status').textContent='Capture lost';
   listeners.get('table:pointerdown')({clientX:headStringX()*.45,clientY:TABLE.height/2,pointerId:3,buttons:1});
   listeners.get('table:pointerup')({pointerId:3});
   assert.match(node('status').textContent,/Cue positioned/,'capture loss must allow a fresh pointer to place the cue');
   assert.match(node('table-call-hint').textContent,/No call needed/);
   assert.equal(pressSpace('BUTTON'),false,'focused button keeps native Space activation');
   assert.equal(node('shoot').disabled,false,'break is ready before keyboard strike');
   assert.equal(pressSpace('BODY'),true,'Space on page fires BREAK instead of scrolling');
   assert.equal(node('shoot').disabled,true,'Space started the physics simulation');
   assert.equal(pressSpace('BODY',{repeat:true}),true,'held Space cannot scroll during ball motion');
   listeners.get('window:beforeunload')(exiting);
   assert.equal(exiting.prevented,true,'actual break protects the unfinished rack from document exit');
   const navigation={button:0,target:{closest:()=>({href:'https://squatch.example/',hasAttribute:()=>false,target:''})},preventDefault(){this.prevented=true;}};
   listeners.get('document:click')(navigation);
   assert.equal(navigation.prevented,true);
   assert.equal(listeners.has('table:pointerdown'),true,'cancelled in-shell leave preserves the actual controller');
   let frames=0;
   while(!/Tap a ball/.test(node('table-call-hint').textContent)&&frames++<2700)tick();
   assert.ok(frames<2700,'break must settle and expose table call on '+size+' ft');
   assert.equal(node('shoot').disabled,true,'cannot shoot before call');
   assert.equal(panel.open,false,'do not expand controls to call on the felt');
   const cueBefore=cueDraws;tick();
   assert.equal(cueDraws,cueBefore,'cue hidden before call');
   const available=[...positions.entries()].filter(([id])=>Number(id)>0);
   assert.ok(available.length>1,'balls visible after break');
   const [id,point]=available[0];
   const [otherId,otherPoint]=available[1];
   tap(point.x,point.y);
   assert.equal(node('call-ball').value,id,'touch selects the visible ball');
   assert.equal(node('call-pocket').value,'');
   assert.equal(node('shoot').disabled,true,'ball alone cannot unlock shot');
   assert.match(node('table-call-hint').textContent,/glowing pocket/);
   const target=pockets.map(p=>({p,d:Math.min(...available.map(([,b])=>Math.hypot(p.x-b.x,p.y-b.y)))})).sort((a,b)=>b.d-a.d)[0].p;
   tap(target.x,target.y);
   assert.equal(node('call-pocket').value,target.id,'touch selects a table pocket');
   // On a narrow phone, the ball hit radius overlaps the pocket marker.
   // The pocket drawn on the canvas must take priority over any nearby ball.
   const markerX=target.kind==='side'?target.x:target.x+target.sx*TABLE.radius*1.65;
   const markerY=target.y+target.sy*TABLE.radius*1.65;
   Object.defineProperty(node('table'),'clientWidth',{get:()=>24,configurable:true});
   tap(markerX*24/TABLE.width,markerY);
   assert.equal(node('call-ball').value,id,'pocket tap cannot change the called ball');
   assert.equal(node('call-pocket').value,target.id,'glowing pocket wins overlapping ball hit zone');
   Object.defineProperty(node('table'),'clientWidth',{get(){return this.width;},configurable:true});
   assert.equal(node('shoot').disabled,false,'completed call unlocks shoot');
   tick();assert.ok(cueDraws>cueBefore,'cue appears only after both selections');
   drag(otherPoint.x,otherPoint.y);
   assert.equal(node('call-ball').value,id,'drag must not change called ball');
   assert.equal(node('call-pocket').value,target.id,'drag must not clear pocket');
   node('undo-call').onclick();
   assert.equal(node('call-ball').value,'');
   assert.equal(node('call-pocket').value,'');
   assert.equal(node('shoot').disabled,true,'undo locks the shot');
   const afterUndo=cueDraws;tick();assert.equal(cueDraws,afterUndo,'undo hides cue');
   tap(otherPoint.x,otherPoint.y);
   assert.equal(node('call-ball').value,otherId,'touch can choose another ball');
   // Accessible dropdowns remain a fallback without losing the table-first UX.
   node('call-ball').value=id;listeners.get('call-ball:change')();
   node('call-pocket').value='BR';listeners.get('call-pocket:change')();
   assert.equal(node('shoot').disabled,false);
   assert.equal(pressSpace('CANVAS'),true,'Space on focused felt fires called shot');
   assert.equal(node('shoot').disabled,true,'called shot begins moving');
   assert.match(node('table-call-hint').textContent,/Shot in progress/,'call guidance must leave the aiming phase immediately');
   assert.equal(node('undo-call').disabled,true,'Undo cannot be offered during motion');
   assert.equal(node('power').value,'68','power resets after the shot');
  }
  const staleFrame=nextFrame,staleClick=node('shoot').onclick;
  const atExit=frames;
  listeners.get('window:pagehide')();
  assert.equal(listeners.has('table:pointerdown'),false,'unmount removes canvas input');
  assert.equal(listeners.has('window:beforeunload'),false,'unmount removes navigation guard');
  assert.equal(listeners.has('window:online'),false,'unmount removes telemetry retry listener');
  assert.equal(listeners.has('window:keydown'),false,'unmount removes shortcut listener');
  assert.equal(node('shoot').onclick,undefined,'unmount restores control properties');
  staleFrame(time+1000);staleClick();
  assert.equal(frames,atExit,'stale callbacks cannot restart physics');
  assert.ok(cancelled>0,'outgoing RAF is cancelled');
  await listeners.get('window:pageshow')({persisted:true});
  assert.equal(frames,atExit+1,'history restore starts exactly one frame loop');
  assert.equal(node('shoot').textContent,'BREAK');
  assert.equal(node('power').value,'85','history restore starts one fresh match');
  listeners.get('window:pagehide')();
 }finally{
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});

test('Press Your Luck scoreboard labels are clear on mobile and inside fullscreen table',()=>{
 const html=readFileSync(new URL('../press-your-luck.html',import.meta.url),'utf8');
 for(const id of ['score','bonus','press-score-player-0','press-score-player-1',
 'press-banked-0','press-banked-1','press-own-0','press-own-1',
 'press-press-0','press-press-1','press-projected-0','press-projected-1']){
  assert.match(html,new RegExp('id="'+id+'"'),id+' missing');
 }
 assert.match(html,/Banked/);
 assert.match(html,/Own balls/);
 assert.match(html,/Press <span>\(at risk\)<\/span>/);
 assert.match(html,/If legal 8/);
 assert.match(html,/grid-template-columns:1fr/,'small screens need stacked scorecards');
 assert.ok(html.indexOf('class="press-scoreboard"')<html.indexOf('<canvas id="table"'),
  'scoreboard stays above table within fullscreen stage');
});
