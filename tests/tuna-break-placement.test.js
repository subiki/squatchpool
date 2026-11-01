import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,headStringX} from '../src/physics.js';

// Exercise the real Tuna controller with a minimal DOM, not a copied placement helper.
test('Tuna starts ready to break and supports kitchen dragging without confirmation on all table sizes',async()=>{
 const originals={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,Option:globalThis.Option,localStorage:globalThis.localStorage};
 const nodes=new Map(),listeners=new Map(),panel={open:false};
 const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:id==='size'?'7':'',disabled:false,hidden:false,textContent:'',
   clientLeft:0,clientTop:0,
   get clientWidth(){return this.width;},
   get clientHeight(){return this.height;},
   getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};},
   getContext(){return ctx;},
   setPointerCapture(){},
   addEventListener(event,fn){listeners.set(id+':'+event,fn);},
   replaceChildren(...children){this.children=children;},
   prepend(){},
  });
  return nodes.get(id);
 }
 globalThis.document={getElementById:node,querySelector:selector=>selector==='.kit-more'?panel:null,createElement:()=>({textContent:''})};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.requestAnimationFrame=()=>{};
 const tap=(x,y)=>listeners.get('table:pointerdown')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const drag=(x,y)=>listeners.get('table:pointermove')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const release=()=>listeners.get('table:pointerup')();
 try{
  await import('../src/tuna-game.js');
  assert.match(readFileSync(new URL('../tuna.html',import.meta.url),'utf8'),/id="break-reposition"/);
  for(const size of [7,8,9]){
   node('size').value=String(size);
   node('reset-match').onclick();
   assert.equal(node('table').width,TABLE.width);
   assert.equal(node('shoot').disabled,false,'legal default cue placement permits immediate BREAK');
   assert.equal(node('shoot').textContent,'BREAK');
   assert.equal(node('start').disabled,true,'cannot advance active rack');
   assert.equal(node('place').hidden,true,'no break confirmation control');
   assert.equal(node('break-reposition').hidden,true,'dragging replaces separate reposition control');
   assert.match(node('status').textContent,/kitchen/);
   assert.match(node('table-call-hint').textContent,/No call needed/);
   tap(headStringX()+TABLE.radius*3,TABLE.height/2);
   release();
   assert.equal(node('shoot').disabled,false,'tapping beyond kitchen does not lock BREAK');
   tap(headStringX()*.55,TABLE.height/2);
   drag(headStringX()*.45,TABLE.height/2+TABLE.radius*2);
   release();
   assert.equal(node('shoot').disabled,false,'drag release keeps BREAK enabled');
   assert.equal(node('place').hidden,true,'drag does not reveal confirmation');
   node('shoot').onclick();
   assert.equal(node('shoot').disabled,true,'BREAK immediately starts a physical shot without a call');
   assert.equal(node('power').value,'68','break consumes power and resets controls');

  }
 }finally{
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});
