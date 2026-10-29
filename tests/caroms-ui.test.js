import test from 'node:test';
import assert from 'node:assert/strict';
import {setTableSize} from '../src/table-geometry.js';

// Drive the real Caroms browser controller with a minimal DOM. Unlike a
// rules-only test this catches disconnected buttons, call controls and shot
// reset regressions without requiring a third-party browser dependency.
test('Caroms: local break, called shot, neutral controls and 7/8/9ft rerack', async()=>{
 const names=['document','window','requestAnimationFrame','Option','fetch','localStorage'];
 const saved=Object.fromEntries(names.map(n=>[n,globalThis[n]]));
 const elements=new Map(),listeners=new Map();
 let nextFrame=null,now=0;
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:()=>{};},
  set(o,k,v){o[k]=v;return true;}
 });
 function el(id){
  if(!elements.has(id)){
   const defaults={'caroms-size':'7','caroms-level-0':'advanced',
    'caroms-level-1':'advanced','caroms-power':'85',
    'caroms-top':'0','caroms-side':'0'};
   elements.set(id,{
    id,value:defaults[id]??'',options:[],children:[],style:{},
    hidden:false,disabled:false,textContent:'',attributes:{},
    addEventListener(event,fn){listeners.set(id+':'+event,fn);},
    setAttribute(name,value){this.attributes[name]=value;},
    replaceChildren(...items){this.children=items;this.options=[];},
    add(option){this.options.push(option);},
    prepend(child){this.children.unshift(child);},
    get lastElementChild(){return this.children.at(-1)??null;},
    remove(){},getContext(){return ctx;},setPointerCapture(){},
    getBoundingClientRect(){return{left:0,top:0,width:this.width||600,height:this.height||300};}
   });
  }
  return elements.get(id);
 }
 const storage=new Map();
 globalThis.document={
  getElementById:el,
  createElement(){return{textContent:'',remove(){}};}
 };
 globalThis.window={addEventListener(){}};
 globalThis.Option=class {constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={
  getItem:key=>storage.get(key)??null,
  setItem:(key,value)=>storage.set(key,String(value))
 };
 globalThis.fetch=async()=>({ok:false,status:503});
 globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};
 const click=id=>{
  const fn=listeners.get(id+':click');
  assert.ok(fn,'Missing click handler for '+id);
  fn();
 };
 const change=(id,value)=>{
  el(id).value=String(value);
  const fn=listeners.get(id+':change');
  assert.ok(fn,'Missing change handler for '+id);
  fn({target:el(id)});
 };
 const input=(id,value)=>{
  el(id).value=String(value);
  const fn=listeners.get(id+':input');
  assert.ok(fn,'Missing input handler for '+id);
  fn({target:el(id)});
 };
 const tick=()=>{
  assert.equal(typeof nextFrame,'function','animation loop must be installed');
  now+=1000/60;nextFrame(now);
 };
 try{
  await import('../src/caroms-game.js');
  assert.equal(el('caroms-turn').textContent.includes('Player 1'),true);
  assert.match(el('caroms-score').textContent,/Best of 3.*0.*0/);
  assert.ok(listeners.has('caroms-match-reset:click'),'new match control must be wired');
  assert.equal(el('caroms-shoot').disabled,false,'break is playable immediately');
  assert.equal(el('caroms-power').value,'85');
  assert.equal(el('caroms-call-controls').hidden,true,'break never requires a call');
  const width7=el('caroms-table').width,height7=el('caroms-table').height;
  assert.ok(width7>height7,'regulation table is rectangular');
  input('caroms-power',91);input('caroms-top',-40);input('caroms-side',33);
  click('caroms-shoot');
  assert.equal(el('caroms-power').value,'68','power resets at strike');
  assert.equal(el('caroms-top').value,'0','draw resets at strike');
  assert.equal(el('caroms-side').value,'0','English resets at strike');
  assert.equal(el('caroms-shoot').disabled,true,'no second shot while balls roll');
  let frames=0;
  while(el('caroms-status').textContent==='Balls rolling…'&&frames++<1800)tick();
  assert.ok(frames<1800,'break must settle or time out, never freeze');
  if(!el('caroms-option').hidden)click('caroms-leave');
  assert.equal(el('caroms-call-controls').hidden,false,
   'advanced post-break turn must require a called ball and pocket');
  assert.equal(el('caroms-shoot').disabled,true,'cannot shoot without a call');
  const target=el('caroms-call-ball').options.find(o=>o.value!=='');
  assert.ok(target,'legal target is offered after the break');
  change('caroms-call-ball',target.value);
  click('caroms-pocket-TL');
  assert.equal(el('caroms-shoot').disabled,false,'call enables a shot');
  click('caroms-undo');
  assert.equal(el('caroms-shoot').disabled,true,'undo clears shot permission');
  change('caroms-call-ball',target.value);
  click('caroms-pocket-TR');
  input('caroms-power',43);input('caroms-top',55);input('caroms-side',-65);
  click('caroms-shoot');
  assert.equal(el('caroms-power').value,'68','normal shot power resets');
  assert.equal(el('caroms-top').value,'0','normal shot follow resets');
  assert.equal(el('caroms-side').value,'0','normal shot English resets');
  assert.equal(el('caroms-undo').disabled,true,'cannot undo a fired call');
  change('caroms-size','8');
  assert.ok(el('caroms-table').width>width7);
  assert.ok(el('caroms-table').height>height7);
  assert.equal(el('caroms-power').value,'85','new break resets power');
  const width8=el('caroms-table').width;
  change('caroms-size','9');
  assert.ok(el('caroms-table').width>width8);
  assert.equal(el('caroms-call-controls').hidden,true);
  assert.equal(el('caroms-shoot').disabled,false);
  assert.equal(storage.get('squatch-table-size'),'9');
  click('caroms-new');
  assert.equal(el('caroms-turn').textContent.includes('Player 1'),true);
  click('caroms-match-reset');
  assert.match(el('caroms-score').textContent,/Best of 3.*0.*0/);
 }finally{
  setTableSize(9);
  for(const [name,value] of Object.entries(saved)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});
