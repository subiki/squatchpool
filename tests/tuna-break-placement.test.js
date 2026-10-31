import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,headStringX} from '../src/physics.js';

// Exercise the real Tuna controller with a minimal DOM, not a copied placement helper.
test('Tuna requires a legal kitchen break placement on all three tables and permits reposition',async()=>{
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
 try{
  await import('../src/tuna-game.js');
  assert.match(readFileSync(new URL('../tuna.html',import.meta.url),'utf8'),/id="break-reposition"/);
  for(const size of [7,8,9]){
   node('size').value=String(size);
   node('reset-match').onclick();
   assert.equal(node('table').width,TABLE.width);
   assert.equal(node('shoot').disabled,true,'break is locked before confirmation');
   assert.equal(node('start').disabled,true,'next rack is unavailable during active play');
   assert.equal(node('place').hidden,false,'placement control is visible');
   assert.equal(node('place').disabled,true,'cannot confirm an untouched break cue');
   assert.match(node('status').textContent,/kitchen/);
   tap(headStringX()+TABLE.radius*2,TABLE.height/2);
   assert.equal(node('place').disabled,true,'cannot confirm outside the kitchen');
   tap(headStringX()*.55,TABLE.height/2);
   assert.equal(node('place').disabled,false,'legal kitchen touch enables confirmation, size '+size+' status '+node('status').textContent+' head '+headStringX()+' width '+TABLE.width+' radius '+TABLE.radius);
   node('place').onclick();
   assert.equal(node('shoot').disabled,false,'confirmed placement unlocks BREAK');
   assert.equal(node('shoot').textContent,'BREAK');
   assert.equal(node('break-reposition').hidden,false,'reposition stays available in table kit');
   node('break-reposition').onclick();
   assert.equal(node('shoot').disabled,true,'reposition locks BREAK again');
   tap(headStringX()*.45,TABLE.height/2+TABLE.radius*2);
   assert.equal(node('place').disabled,false);
   node('place').onclick();
   assert.equal(node('shoot').disabled,false);
  }
 }finally{
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});
