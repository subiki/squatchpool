import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,headStringX} from '../src/physics.js';
import {pockets} from '../src/table-geometry.js';

// Drive the real Press Your Luck controller: the call drawer must not be
// required for touch play, and the cue must wait until the call is complete.
test('Press Your Luck: table ball/pocket call, undo and drag-to-aim on 7/8/9 ft',async()=>{
 const originals={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,Option:globalThis.Option,localStorage:globalThis.localStorage};
 const nodes=new Map(),listeners=new Map(),positions=new Map();
 const panel={open:false,removeAttribute(name){if(name==='open')this.open=false;},setAttribute(name){if(name==='open')this.open=true;}};
 let nextFrame=()=>{},time=0,cueDraws=0;
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
   replaceChildren(...children){this.children=children;if(id==='call-ball')this.value=children[0]?.value??'';},
   prepend(){},
  });
  return nodes.get(id);
 }
 globalThis.document={getElementById:node,querySelector:s=>s==='.kit-more'?panel:null,createElement:()=>({textContent:''})};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.requestAnimationFrame=callback=>{nextFrame=callback;};
 const tap=(x,y)=>listeners.get('table:pointerdown')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const drag=(x,y)=>listeners.get('table:pointermove')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const tick=()=>{time+=1000/60;nextFrame(time);};
 try{
  await import('../src/press-your-luck-game.js');
  for(const size of [7,8,9]){
   node('size').value=String(size);node('start').onclick();
   assert.equal(node('shoot').disabled,true,'break requires cue placement');
   tap(headStringX()*.55,TABLE.height/2);node('place').onclick();
   assert.equal(node('shoot').disabled,false,'break needs no called shot');
   assert.match(node('table-call-hint').textContent,/No call needed/);
   node('shoot').onclick();
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
   node('shoot').onclick();
   assert.equal(node('shoot').disabled,true,'called shot begins moving');
   assert.equal(node('power').value,'68','power resets after the shot');
  }
 }finally{
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});
