import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,fullRack,headStringX} from '../src/physics.js';
import {pockets} from '../src/table-geometry.js';

// Exercise the real Tuna controller with a minimal canvas/DOM. The selects
// remain accessible fallbacks, but finger taps must work without opening them.
test('Tuna calls a ball then pocket on the felt on 7/8/9-foot tables',async()=>{
 const originals={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,Option:globalThis.Option,localStorage:globalThis.localStorage};
 const nodes=new Map(),listeners=new Map(),panel={open:false};
 const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:id==='size'?'7':'',disabled:false,hidden:false,textContent:'',
   clientLeft:0,clientTop:0,
   get clientWidth(){return this.width;},get clientHeight(){return this.height;},
   getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};},
   getContext(){return ctx;},setPointerCapture(){},
   addEventListener(event,fn){listeners.set(id+':'+event,fn);},
   replaceChildren(...children){this.children=children;},prepend(){},
  });
  return nodes.get(id);
 }
 globalThis.document={getElementById:node,querySelector:s=>s==='.kit-more'?panel:null,createElement:()=>({textContent:''})};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.requestAnimationFrame=()=>{};
 const tap=(x,y)=>listeners.get('table:pointerdown')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const drag=(x,y)=>listeners.get('table:pointermove')({clientX:x,clientY:y,pointerId:1,buttons:1});
 try{
  await import('../src/tuna-game.js');
  for(const size of [7,8,9]){
   node('size').value=String(size);node('reset-match').onclick();
   assert.equal(node('start').disabled,true,'cannot skip an active rack');
   tap(headStringX()*.55,TABLE.height/2);node('place').onclick();
   assert.equal(node('shoot').disabled,false);
   assert.equal(panel.open,false,'calling a shot should not require opening the drawer');
   assert.equal(node('undo-call').hidden,true,'Undo stays hidden until a call starts');
   assert.match(node('table-call-hint').textContent,/Tap a ball/);
   const first=fullRack()[1];
   tap(first.x,first.y);
   assert.equal(node('call-ball').value,'1','ball selected by touch');
   assert.equal(node('call-pocket').value,'');
   assert.match(node('table-call-hint').textContent,/glowing pocket/);
   const target=pockets.find(p=>p.id==='TM');
   tap(target.x,target.y);
   assert.equal(node('call-pocket').value,'TM','pocket selected by touch');
   assert.match(node('table-call-hint').textContent,/Top middle/);
   // A second ball tap changes the call, clears the stale pocket and keeps
   // the cue hidden until a new pocket is chosen.
   const second=fullRack()[2];
   drag(second.x,second.y);
   assert.equal(node('call-ball').value,'1','drag-to-aim must not change called ball');
   assert.equal(node('call-pocket').value,'TM','drag-to-aim must not clear called pocket');
   tap(second.x,second.y);
   assert.equal(node('call-ball').value,'2');
   assert.equal(node('call-pocket').value,'');
   assert.equal(node('undo-call').hidden,false,'Undo is available for incomplete calls');
   node('undo-call').onclick();
   assert.equal(node('call-ball').value,'','Undo clears ball');
   assert.equal(node('call-pocket').value,'','Undo clears pocket');
   assert.equal(node('undo-call').hidden,true,'Undo hides after clearing');
   assert.match(node('table-call-hint').textContent,/Tap a ball/);
   // Accessible dropdowns still work as a fallback.
   node('call-ball').value='1';listeners.get('call-ball:change')();
   assert.equal(node('call-pocket').value,'');
   node('call-pocket').value='BR';listeners.get('call-pocket:change')();
   assert.match(node('table-call-hint').textContent,/Bottom right/);
   node('shoot').onclick();
   assert.equal(node('shoot').disabled,true,'called BREAK begins shot');
   assert.equal(node('power').value,'68');
  }
 }finally{
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});
