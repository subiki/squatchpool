import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,headStringX} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';

test('Cutthroat disposes real input, physics and pending bot work before fresh remount',async()=>{
 const keys=['document','window','Option','localStorage','fetch','requestAnimationFrame','cancelAnimationFrame','setTimeout','clearTimeout'];
 const saved=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
 const nodes=new Map(),listeners=new Map(),timers=new Map();
 let frame,frames=0,cancelled=0,timerId=0,controller;
 const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
 const node=id=>{
  if(!nodes.has(id))nodes.set(id,{value:id==='cut-size'?'7':id==='cut-players'?'3':'',style:{},children:[],textContent:'',
   addEventListener(event,fn){listeners.set(id+':'+event,fn);},
   removeEventListener(event,fn){if(listeners.get(id+':'+event)===fn)listeners.delete(id+':'+event);},
   setAttribute(name,value){this[name]=value;},
   replaceChildren(...items){this.children=items;},prepend(item){this.children.unshift(item);},
   get lastElementChild(){return this.children.at(-1);},
   getContext:()=>ctx,setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};}});
  return nodes.get(id);
 };
 globalThis.document={getElementById:node,createElement:()=>({textContent:'',remove(){}})};
 globalThis.window={addEventListener(event,fn){listeners.set('window:'+event,fn);},removeEventListener(event,fn){if(listeners.get('window:'+event)===fn)listeners.delete('window:'+event);}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.fetch=async()=>({ok:false,status:503});
 globalThis.requestAnimationFrame=fn=>{frame=fn;return ++frames;};
 globalThis.cancelAnimationFrame=()=>cancelled++;
 globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};
 globalThis.clearTimeout=id=>timers.delete(id);
 const click=id=>listeners.get(id+':click')();
 try{
  const {mountCutthroatGame}=await import('../src/cutthroat-game.js');
  controller=mountCutthroatGame(document);
  for(const size of [7,8,9]){
   node('cut-size').value=String(size);listeners.get('cut-size:change')();
   assert.equal(node('cut-table').width,Math.round(TABLE.width));
   listeners.get('cut-table:pointerdown')({clientX:headStringX()*.5,clientY:TABLE.height/2,pointerId:1});
   listeners.get('cut-table:pointerup')({clientX:headStringX()*.5,clientY:TABLE.height/2,pointerId:1});
   click('cut-place');assert.equal(node('cut-shoot').disabled,false);
   click('cut-shoot');assert.equal(controller.isRackInProgress,true);assert.equal(node('cut-power').value,'68');
  }
  const staleFrame=frame,staleShoot=listeners.get('cut-shoot:click'),staleAim=listeners.get('invert-aim:click');
  controller.dispose();controller.dispose();assert.equal(cancelled,1);
  for(const key of ['cut-table:pointerdown','cut-shoot:click','window:keydown','window:storage','window:online','window:beforeunload'])assert.equal(listeners.has(key),false,key);
  const count=frames,status=node('cut-status').textContent;staleFrame(1000);staleShoot();staleAim();
  assert.equal(frames,count);assert.equal(node('cut-status').textContent,status);
  controller=mountCutthroatGame(document);assert.equal(controller.isRackInProgress,false);assert.equal(node('cut-power').value,'85');
  // Let a real solo break settle and leave the next bot action pending.
  node('cut-players').value='1';listeners.get('cut-players:change')();
  listeners.get('cut-table:pointerdown')({clientX:headStringX()*.5,clientY:TABLE.height/2,pointerId:1});
  click('cut-place');click('cut-shoot');
  let time=0;
  for(let i=0;i<3000&&!timers.size;i++){time+=1000/120;frame(time);}
  assert.ok(timers.size,'missed break schedules a bot turn');
  const staleBot=timers.values().next().value;controller.dispose();assert.equal(timers.size,0);
  const stopped=node('cut-status').textContent;staleBot();assert.equal(node('cut-status').textContent,stopped);
  controller=mountCutthroatGame(document);const previous=controller;controller=mountCutthroatGame(document);previous.dispose();
  assert.equal(node('cut-power').value,'85');
 }finally{
  controller?.dispose();setTableSize(9);
  for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
 }
});
