import test from 'node:test';
import assert from 'node:assert/strict';
import {setTableSize} from '../src/table-geometry.js';

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
 const sizeButtons=['7','8','9'].map(size=>({
  dataset:{size},pressed:false,attributes:{},
  classList:{toggle(){}},
  setAttribute(name,value){this.attributes[name]=value;},
  addEventListener(event,fn){events.set('size-'+size+':'+event,fn);}
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
   getBoundingClientRect(){return {left:0,top:0,width:this.width||1000,height:this.height||500};},
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
  querySelectorAll(selector){return selector==='.pocket-pick'?markers:selector==='.table-size-pick'?sizeButtons:[];},
  createElement:makeElement,
 };
 globalThis.window={addEventListener(){}};
 globalThis.requestAnimationFrame=callback=>{nextFrame=callback;};
 const tick=()=>{time+=1000/120;nextFrame(time);};
 const click=(id)=>{assert.ok(events.has(id+':click'),id+' listener');events.get(id+':click')();};
 try{
  await import('../src/game.js');
  assert.equal(element('#shoot').disabled,true,'place cue ball before break');
  assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  assert.equal(element('#move-cue').hidden,false,'placement guidance visible');
  assert.equal(element('#move-cue').disabled,true,'already placing cue ball');
  // Tap outside the kitchen: should not bypass placement restriction.
  events.get('#table:pointerdown')({clientX:450,clientY:130,pointerId:1});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,true,'cannot break from wrong side of head string');
  // Drag the ball to a legal position and release to enable aiming.
  events.get('#table:pointerdown')({clientX:90,clientY:120,pointerId:2});
  events.get('#table:pointermove')({clientX:110,clientY:140,pointerId:2});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'break enabled after placement');
  assert.equal(element('#move-cue').disabled,false,'can change position before strike');
  click('#move-cue');
  assert.equal(element('#shoot').disabled,true,'reposition disables the break until released');
  events.get('#table:pointerdown')({clientX:120,clientY:170,pointerId:3});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'repositioned cue can break');

  assert.equal(sizeButtons[0].attributes['aria-pressed'],'true');
  assert.match(element('#table-dimensions').textContent,/7 FT.*78.*39/);
  const width7=element('#table').width,height7=element('#table').height;
  assert.ok(width7<800&&height7<420,'default is the compact 7 foot bar box');
  assert.equal(element('#pocket-targets').hidden,true);
  tick();tick();assert.ok(cueDraws>0,'cue appears after legal break placement');
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
  assert.equal(element('#shoot').disabled,true,'new rack requires break cue placement');
  assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  events.get('#table:pointerdown')({clientX:100,clientY:170,pointerId:4});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'new rack can place and break');
  assert.equal(element('#undo-call').disabled,true);
  events.get('size-8:click')();
  assert.equal(sizeButtons[1].attributes['aria-pressed'],'true');
  assert.equal(sizeButtons[0].attributes['aria-pressed'],'false');
  assert.match(element('#table-dimensions').textContent,/8 FT.*88.*44/);
  assert.ok(element('#table').width>width7&&element('#table').height>height7);
  assert.equal(element('#shoot').disabled,true,'size change starts cue-placement phase');
  events.get('#table:pointerdown')({clientX:120,clientY:170,pointerId:5});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'size 8 accepts head-quarter placement');
  assert.equal(element('#pocket-targets').hidden,true);
  const width8=element('#table').width,height8=element('#table').height;
  events.get('size-9:click')();
  assert.equal(sizeButtons[2].attributes['aria-pressed'],'true');
  assert.match(element('#table-dimensions').textContent,/9 FT.*100.*50/);
  assert.ok(element('#table').width>width8&&element('#table').height>height8);
  assert.equal(element('#shoot').disabled,true,'size 9 requires cue placement');
  events.get('#table:pointerdown')({clientX:145,clientY:215,pointerId:6});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'size 9 accepts legal placement');
  events.get('size-7:click')();
  assert.equal(sizeButtons[0].attributes['aria-pressed'],'true');
  assert.equal(element('#table').width,width7);
  assert.equal(element('#table').height,height7);
  assert.equal(element('#shoot').disabled,true,'switching back reracks and requires cue placement');
  events.get('#table:pointerdown')({clientX:110,clientY:165,pointerId:7});
  events.get('#table:pointerup')();
  assert.equal(element('#shoot').disabled,false,'switching back permits cue placement');
 }finally{
  setTableSize(9); // keep shared mutable geometry clean for other tests
  for(const [key,v] of Object.entries(original)){
   if(v===undefined)delete globalThis[key];else globalThis[key]=v;
  }
 }
});
