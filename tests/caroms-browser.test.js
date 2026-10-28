import test from 'node:test';
import assert from 'node:assert/strict';
import {setTableSize} from '../src/table-geometry.js';

// Exercise the real Caroms browser module and event handlers with a small DOM
// surface. No duplicate game logic or external browser dependency in CI.
test('Caroms browser: break, reset, advanced call, and regulation table rerack',async()=>{
 const originals=Object.fromEntries(
  ['document','window','Option','fetch','requestAnimationFrame'].map(k=>[k,globalThis[k]]));
 const elements=new Map(),listeners=new Map();
 const ctx=new Proxy({},{get:(obj,key)=>key in obj?obj[key]:()=>{},
  set:(obj,key,value)=>{obj[key]=value;return true;}});
 let frame=()=>{},now=0;
 function el(id){
  if(!elements.has(id)){
   const defaults={
    'caroms-size':'7','caroms-level-0':'beginner','caroms-level-1':'beginner',
    'caroms-power':'85','caroms-top':'0','caroms-side':'0'
   };
   const node={id,value:defaults[id]??'',hidden:false,disabled:false,
    textContent:'',children:[],options:[],style:{},width:0,height:0,
    addEventListener(type,fn){listeners.set(id+':'+type,fn);},
    replaceChildren(...items){this.children=items;this.options=[];},
    add(option){this.options.push(option);},
    prepend(child){this.children.unshift(child);},
    get lastElementChild(){return this.children.at(-1)??null;},
    getContext(){return ctx;},
    setPointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,
      width:this.width||1,height:this.height||1};}
   };
   elements.set(id,node);
  }
  return elements.get(id);
 }
 const click=id=>{
  const handler=listeners.get(id+':click');
  assert.equal(typeof handler,'function',id+' click listener');
  handler();
 };
 const change=(id,value,type='change')=>{
  const node=el(id);node.value=String(value);
  const handler=listeners.get(id+':'+type);
  assert.equal(typeof handler,'function',id+' '+type+' listener');
  handler({target:node});
 };
 const tick=()=>{now+=1000/120;frame(now);};
 globalThis.document={getElementById:el,
  createElement:tag=>({tagName:tag,textContent:'',remove(){}})};
 globalThis.window={addEventListener(){}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.requestAnimationFrame=fn=>{frame=fn;};
 globalThis.fetch=async()=>({ok:false,status:503});
 try{
  await import('../src/caroms-game.js');
  assert.equal(el('caroms-shoot').disabled,false,'1-ball break ready');
  assert.equal(el('caroms-striker').value,'1','break striker is 1');
  assert.equal(el('caroms-power').value,'85','break power starts at 85%');
  assert.equal(el('caroms-call-controls').hidden,true,'no break call');
  const w7=el('caroms-table').width,h7=el('caroms-table').height;
  assert.ok(w7>h7&&w7>0,'rectangular table');
  change('caroms-power',94,'input');
  change('caroms-top',-35,'input');
  change('caroms-side',50,'input');
  click('caroms-shoot');
  assert.equal(el('caroms-power').value,'68','break power reset at strike');
  assert.equal(el('caroms-top').value,'0','draw reset at strike');
  assert.equal(el('caroms-side').value,'0','English reset at strike');
  assert.equal(el('caroms-shoot').disabled,true,'cannot double strike');
  let frames=0;
  while(el('caroms-status').textContent==='Balls rolling…'&&frames++<2600)tick();
  assert.ok(frames<2600,'real physics break must finish within 20 seconds');
  if(!el('caroms-option').hidden)click('caroms-leave');
  assert.match(el('caroms-turn').textContent,/Player [12]/);
  assert.equal(el('caroms-power').value,'68','normal shot starts at 68%');
  change('caroms-level-0','advanced');
  change('caroms-level-1','advanced');
  assert.equal(el('caroms-call-controls').hidden,false,'advanced calls visible');
  assert.equal(el('caroms-shoot').disabled,true,'cannot shoot without a call');
  const called=el('caroms-call-ball').options.find(o=>o.value!=='');
  assert.ok(called,'a target ball remains available');
  change('caroms-call-ball',called.value);
  assert.equal(el('caroms-shoot').disabled,true,'ball alone is not a call');
  change('caroms-call-pocket','TL');
  assert.equal(el('caroms-shoot').disabled,false,'complete call enables shoot');
  change('caroms-power',47,'input');
  change('caroms-top',60,'input');
  change('caroms-side',-40,'input');
  click('caroms-shoot');
  assert.equal(el('caroms-power').value,'68','normal power reset');
  assert.equal(el('caroms-top').value,'0','normal follow reset');
  assert.equal(el('caroms-side').value,'0','normal English reset');
  assert.equal(el('caroms-shoot').disabled,true,'call locked while rolling');
  change('caroms-size','8');
  const w8=el('caroms-table').width,h8=el('caroms-table').height;
  assert.ok(w8>w7&&h8>h7,'8-foot bed larger than 7-foot');
  assert.equal(el('caroms-power').value,'85','size change starts new break');
  assert.equal(el('caroms-call-controls').hidden,true,'new rack needs no call');
  change('caroms-size','9');
  assert.ok(el('caroms-table').width>w8&&el('caroms-table').height>h8);
  change('caroms-size','7');
  assert.equal(el('caroms-table').width,w7);
  assert.equal(el('caroms-table').height,h7);
  assert.equal(el('caroms-shoot').disabled,false,'new rack can break');
 }finally{
  setTableSize(9);
  for(const [key,value] of Object.entries(originals)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});
