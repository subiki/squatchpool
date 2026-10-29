import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,setTableSize} from '../src/table-geometry.js';

// QA lane: test the integrated Caroms release candidate controller, not a second bot implementation.
// Fake only DOM, animation clock and timers; physics/rules are the real modules.
test('Caroms solo bot takes the next turn and stale turns cannot survive restart',async()=>{
 const keys=['document','window','Option','fetch','requestAnimationFrame',
  'localStorage','setTimeout','clearTimeout'];
 const originals=Object.fromEntries(keys.map(k=>[k,
  Object.getOwnPropertyDescriptor(globalThis,k)]));
 const elements=new Map(),listeners=new Map(),timers=new Map();
 let frame=()=>{},now=0,timerId=0;
 const ctx=new Proxy({},{
  get:(obj,key)=>key in obj?obj[key]:()=>{},
  set:(obj,key,value)=>{obj[key]=value;return true;}
 });
 function el(id){
  if(!elements.has(id)){
   const defaults={'caroms-mode':'bot','caroms-size':'7',
    'caroms-level-0':'beginner','caroms-level-1':'beginner',
    'caroms-power':'85','caroms-top':'0','caroms-side':'0'};
   elements.set(id,{id,value:defaults[id]??'',hidden:false,disabled:false,
    textContent:'',children:[],options:[],style:{},width:0,height:0,
    addEventListener(type,fn){listeners.set(id+':'+type,fn);},
    setAttribute(name,value){this[name]=String(value);},
    replaceChildren(...items){this.children=items;this.options=[];},
    add(option){this.options.push(option);},
    prepend(child){this.children.unshift(child);},
    get lastElementChild(){return this.children.at(-1)??null;},
    getContext(){return ctx;},setPointerCapture(){},
    getBoundingClientRect(){return{left:0,top:0,
     width:this.width||1,height:this.height||1};}
   });
  }
  return elements.get(id);
 }
 const click=id=>{
  const fn=listeners.get(id+':click');
  assert.equal(typeof fn,'function',id+' click listener');
  fn();
 };
 const change=(id,value)=>{
  const node=el(id);node.value=String(value);
  const fn=listeners.get(id+':change');
  assert.equal(typeof fn,'function',id+' change listener');
  fn({target:node});
 };
 const tick=()=>{now+=1000/120;frame(now);};
 const settle=()=>{
  let frames=0;
  while(el('caroms-status').textContent==='Balls rolling…'&&frames++<2800)tick();
  assert.ok(frames<2800,'physics stroke finishes within the safety limit');
 };
 const fireTimer=()=>{
  assert.equal(timers.size,1,'exactly one bot action is queued');
  const [id,fn]=timers.entries().next().value;
  timers.delete(id);fn();
 };
 const breakAwayFromCue=()=>{
  // Shoot vertically away from the white ball: a leftward bank can
  // rebound into the cue ball and accidentally become a legal break.
  const x=TABLE.radius+TABLE.width*.11,y=TABLE.height/2-65;
  listeners.get('caroms-table:pointerdown')({
   clientX:x,clientY:y,pointerId:3,pointerType:'mouse'});
  listeners.get('caroms-table:pointerup')({
   clientX:x,clientY:y,pointerId:3,pointerType:'mouse'});
  click('caroms-shoot');
  settle();
 };
 globalThis.document={getElementById:el,
  createElement:tag=>({tagName:tag,textContent:'',remove(){}})};
 globalThis.window={addEventListener(){}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.requestAnimationFrame=fn=>{frame=fn;};
 globalThis.fetch=async()=>({ok:false,status:503});
 const saved=new Map();
 globalThis.localStorage={getItem:key=>saved.get(key)??null,
  setItem:(key,value)=>saved.set(key,String(value))};
 globalThis.setTimeout=fn=>{const id=++timerId;timers.set(id,fn);return id;};
 globalThis.clearTimeout=id=>{timers.delete(id);};
 try{
  await import('../src/caroms-game.js');
  assert.equal(el('caroms-mode').value,'bot');
  assert.equal(el('caroms-shoot').disabled,false,'human may break');
  change('caroms-level-1','advanced');
  breakAwayFromCue();
  assert.match(el('caroms-turn').textContent,/Squatch Bot/,
   'missed 1-ball break hands off to the solo opponent');
  assert.equal(el('caroms-shoot').disabled,true,
   'human shoot button locked during the bot turn');
  assert.equal(timers.size,1,'bot turn is scheduled once');
  assert.equal(el('caroms-option').hidden,false,
   'a missed Caroms break offers the incoming bot a foul decision');
  assert.equal(el('caroms-leave').disabled,true,
   'human cannot choose a foul option for Squatch Bot');
  assert.equal(el('caroms-center').disabled,true);
  click('caroms-leave'); // Deliberately invoke even though disabled.
  assert.equal(el('caroms-option').hidden,false,
   'the handler must also reject programmatic human clicks');
  assert.equal(timers.size,1,'human click did not replace the bot timer');
  const staleSameRack=timers.values().next().value;
  fireTimer(); // Bot resolves its incoming foul option.
  assert.equal(el('caroms-option').hidden,true);
  const scheduledShot=timers.values().next().value;
  staleSameRack(); // Simulate the old timer racing after the phase changed.
  assert.equal(timers.size,1,'stale callback must not clear the new timer');
  assert.equal(timers.values().next().value,scheduledShot,
   'the current bot shot remains queued');
  assert.notEqual(el('caroms-status').textContent,'Balls rolling…',
   'stale option callback must not shoot prematurely');
  fireTimer(); // Bot selects an eligible object ball, calls and strikes.
  assert.equal(el('caroms-status').textContent,'Balls rolling…',
   'bot fires a real physics stroke');
  assert.equal(el('caroms-power').value,'68','bot power resets at strike');
  assert.equal(el('caroms-top').value,'0','bot draw resets at strike');
  assert.equal(el('caroms-side').value,'0','bot English resets at strike');
  settle();
  // Start another rack while the bot is about to act. A stale timer must
  // never shoot after switching to a human opponent.
  click('caroms-match-reset');
  assert.equal(timers.size,0,'new match cancels bot work and resets the breaker');
  breakAwayFromCue();
  assert.match(el('caroms-turn').textContent,/Squatch Bot/);
  assert.equal(timers.size,1,'new rack schedules its own bot turn');
  const stale=timers.values().next().value;
  change('caroms-mode','local');
  assert.equal(timers.size,0,'mode switch cancels queued bot turn');
  stale(); // Simulate a callback racing with clearTimeout.
  assert.equal(el('caroms-status').textContent==='Balls rolling…',false,
   'stale callback cannot fire a shot in the replacement rack');
  assert.match(el('caroms-turn').textContent,/Player 1/,
   'local mode begins a fresh human-controlled rack');
  assert.equal(el('caroms-shoot').disabled,false);
 }finally{
  setTableSize(9);
  for(const [key,descriptor] of Object.entries(originals)){
   if(descriptor)Object.defineProperty(globalThis,key,descriptor);
   else delete globalThis[key];
  }
 }
});
