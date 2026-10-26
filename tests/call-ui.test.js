import test from 'node:test';
import assert from 'node:assert/strict';

// Fake only the browser surface, not the physics or gameplay. This regression
// loads the actual game module, drives its real pointer/click handlers, and
// simulates a rack. No DOM/browser dependencies required for CI.
test('tap-to-call: break, select ball, choose pocket, reveal cue, undo, shoot', async () => {
 const original = {
  document:globalThis.document,window:globalThis.window,
  requestAnimationFrame:globalThis.requestAnimationFrame,
 };
 const elements=new Map(),events=new Map();
 const markers=['TL','TM','TR','BL','BM','BR'].map(id=>({
  dataset:{pocket:id},addEventListener(event,fn){events.set('pocket-'+id+':'+event,fn);}
 }));
 const grad={addColorStop(){}};
 let cueDraws=0,nextFrame=()=>{},time=0,lastTranslate={x:0,y:0};
 const objectBallPositions=new Map();
 const ctx=new Proxy({
  createRadialGradient(){return grad;},
  createLinearGradient(){return grad;},
  stroke(){if(this.strokeStyle==='#d4a76c')cueDraws++;},
  translate(x,y){lastTranslate={x,y};},
  fillText(value){if(typeof value==='string'&&value.length<=2&&Number.isInteger(Number(value)))objectBallPositions.set(value,lastTranslate);}
 },{get(o,key){return key in o?o[key]:()=>{};},set(o,key,v){o[key]=v;return true;}});
 function element(id){
  if(!elements.has(id))elements.set(id,{
   id,value:id==='#mode'?'local':id==='#power'?'68':'',
   hidden:false,disabled:false,textContent:'',children:[],
   classList:{toggle(){}},
   addEventListener(event,fn){events.set(id+':'+event,fn);},
   prepend(child){this.children.unshift(child);},
   replaceChildren(...items){this.children=items;},
   get lastElementChild(){return this.children.at(-1)??{remove(){}};},
   remove(){},getContext(){return ctx;},setPointerCapture(){},
   getBoundingClientRect(){return {left:0,top:0,width:1000,height:500};},
  });
  return elements.get(id);
 }
 const makeElement=()=>({
  textContent:'',value:'',listeners:new Map(),
  addEventListener(n,fn){this.listeners.set(n,fn);},
  setAttribute(name,v){this[name]=v;},
 });
 globalThis.document={
  querySelector:element,
  querySelectorAll(selector){return selector==='.pocket-pick'?markers:[];},
  createElement:makeElement,
 };
 globalThis.window={addEventListener(){}};
 globalThis.requestAnimationFrame=callback=>{nextFrame=callback;};
 const tick=()=>{time+=1000/120;nextFrame(time);};
 const click=(id)=>{assert.ok(events.has(id+':click'),id+' listener');events.get(id+':click')();};
 try{
  await import('../src/game.js');
  assert.equal(element('#shoot').disabled,false,'break does not need a call');
  assert.equal(element('#pocket-targets').hidden,true);
  tick();tick();assert.ok(cueDraws>0,'cue appears for break');
  click('#shoot');
  let frames=0;
  while(element('#table-status').textContent!=='PICK A BALL'&&frames++<2000)tick();
  assert.ok(frames<2000,'break ends and waits for called ball');
  assert.equal(element('#shoot').disabled,true,'no uncaught shot allowed');
  assert.ok(element('#ball-picks').children.length>=1,'ball number buttons are visible');
  const initiallyDrawn=cueDraws;tick();
  assert.equal(cueDraws,initiallyDrawn,'cue hidden before call');
  const ballButton=element('#ball-picks').children[0];
  const ballPosition=objectBallPositions.get(ballButton.textContent);
  assert.ok(ballPosition,'target ball rendered for direct pointer selection');
  events.get('#table:pointerdown')({clientX:ballPosition.x,clientY:ballPosition.y,pointerId:1});
  assert.equal(element('#call-ball-status').textContent,'Ball: '+ballButton.textContent,'ball tapped on canvas');
  assert.equal(element('#table-status').textContent,'PICK A POCKET');
  assert.equal(element('#pocket-targets').hidden,false,'six pocket targets shown');
  assert.equal(element('#undo-call').disabled,false);
  assert.equal(element('#shoot').disabled,true);
  const waitingForPocket=cueDraws;tick();
  assert.equal(cueDraws,waitingForPocket,'stick hidden until called pocket');
  events.get('pocket-TM:click')();
  assert.equal(element('#pocket-targets').hidden,true);
  assert.equal(element('#table-status').textContent,'AIM & SHOOT');
  assert.equal(element('#shoot').disabled,false);
  tick();assert.ok(cueDraws>waitingForPocket,'cue appears after complete call');
  click('#undo-call');
  assert.equal(element('#table-status').textContent,'PICK A BALL');
  assert.equal(element('#shoot').disabled,true);
  const afterUndo=cueDraws;tick();
  assert.equal(cueDraws,afterUndo,'undo hides cue');
  element('#ball-picks').children[0].listeners.get('click')();
  events.get('pocket-BR:click')();
  assert.equal(element('#shoot').disabled,false);
  click('#shoot');
  assert.equal(element('#shoot').disabled,true,'fired call locks controls');
  assert.equal(element('#undo-call').disabled,true,'cannot change fired shot');
  click('#new-game');
  assert.equal(element('#pocket-targets').hidden,true);
  assert.equal(element('#shoot').disabled,false,'new rack returns to break');
  assert.equal(element('#undo-call').disabled,true);
 }finally{
  for(const [key,v] of Object.entries(original)){
   if(v===undefined)delete globalThis[key];else globalThis[key]=v;
  }
 }
});
