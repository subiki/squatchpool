import test from 'node:test';
import assert from 'node:assert/strict';
import {setTableSize} from '../src/table-geometry.js';

// Fake only the browser surface, not the physics or gameplay. This regression
// loads the actual game module, drives its real pointer/click handlers, and
// simulates a rack. No DOM/browser dependencies required for CI.
test('tap-to-call: break, select ball, choose pocket, reveal cue, undo, shoot', async () => {
 const original = {
  document:globalThis.document,window:globalThis.window,
  requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,
 };
 let controller,lastPointer;
 const elements=new Map(),events=new Map();
 const markers=['TL','TM','TR','BL','BM','BR'].map(id=>({
  dataset:{pocket:id},attributes:{},
  setAttribute(name,value){this.attributes[name]=String(value);},
  addEventListener(event,fn){events.set('pocket-'+id+':'+event,fn);}
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
   id,value:id==='#mode'?'local':id==='#power'?'68':id==='#size'?'7':'',
   hidden:false,disabled:false,textContent:'',children:[],
   classList:{toggle(){}},
   attributes:{},
   setAttribute(name,value){this.attributes[name]=String(value);},
   addEventListener(event,fn){events.set(id+':'+event,fn);},
   removeEventListener(event,fn){if(events.get(id+':'+event)===fn)events.delete(id+':'+event);},
   prepend(child){this.children.unshift(child);},
   replaceChildren(...items){this.children=items;},
   get lastElementChild(){return this.children.at(-1)??{remove(){}};},
   remove(){},getContext(){return ctx;},setPointerCapture(id){lastPointer=id;},
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
  querySelectorAll(selector){return selector==='.pocket-pick'?markers:[];},
  createElement:makeElement,
 };
 const root={querySelector:element,querySelectorAll:document.querySelectorAll,ownerDocument:document,setAttribute(){},focus(){}};
 document.querySelector=selector=>selector==='main'?root:element(selector);
 document.addEventListener=(event,fn)=>events.set('document:'+event,fn);
 document.removeEventListener=event=>events.delete('document:'+event);
 globalThis.window={document,location:{href:'https://squatch.example/but-wait',origin:'https://squatch.example'},
  history:{state:null,scrollRestoration:'auto',replaceState(state){this.state=state;}},scrollTo(){},confirm:()=>false,
  addEventListener(event,fn){events.set('window:'+event,fn);},removeEventListener(event,fn){if(events.get('window:'+event)===fn)events.delete('window:'+event);}};
 let scheduled=0,cancelled=0,timerId=0;const timers=new Map();
 globalThis.requestAnimationFrame=callback=>{nextFrame=callback;return ++scheduled;};
 globalThis.cancelAnimationFrame=()=>cancelled++;
 globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};
 globalThis.clearTimeout=id=>timers.delete(id);
 const tick=()=>{time+=1000/120;nextFrame(time);};
 const click=(id)=>{assert.ok(events.has(id+':click'),id+' listener');events.get(id+':click')();};
 const setSlider=(id,value)=>{
  element(id).value=String(value);
  events.get(id+':input')({target:element(id)});
 };
 try{
  await import('../src/but-wait-entry.js');
  events.get('#table:pointerdown')({clientX:110,clientY:140,pointerId:10});events.get('#table:pointerup')({pointerId:lastPointer});click('#shoot');
  const beforeLeave=events.get('#shoot:click');
  const navigation={button:0,target:{closest:()=>({href:'https://squatch.example/',target:'',hasAttribute:()=>false})},preventDefault(){this.prevented=true;}};
  events.get('document:click')(navigation);assert.equal(navigation.prevented,true);
  assert.equal(events.get('#shoot:click'),beforeLeave,'cancelled leave preserves live But Wait');
  const beforeRestore=scheduled,oldFrame=nextFrame;events.get('window:pagehide')();oldFrame(1000);assert.equal(scheduled,beforeRestore);
  await events.get('window:pageshow')({persisted:true});assert.equal(scheduled,beforeRestore+1);
  assert.equal(element('#power').value,'85');assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  events.get('window:pagehide')();cancelled=0;
  const {mountButWaitGame}=await import('../src/game.js');
  controller=mountButWaitGame(document);
  assert.equal(element('#size').value,'7','native table select shows the active size');
  element('#size').value='8';
  events.get('#size:change')({target:element('#size')});
  assert.equal(element('#size').value,'8','native selection persists after rack reset');
  element('#size').value='7';
  events.get('#size:change')({target:element('#size')});
  assert.equal(element('#size').value,'7','size control can return to the bar table');
  events.get('#table:pointerdown')({clientX:90,clientY:120,pointerId:31});
  events.get('#table:pointerdown')({clientX:130,clientY:150,pointerId:32});
  events.get('#table:pointermove')({clientX:140,clientY:160,pointerId:32});
  events.get('#table:lostpointercapture')({pointerId:32});
  events.get('#table:pointerup')({pointerId:32});
  assert.equal(element('#shoot').disabled,true,'secondary finger cannot finish break placement');
  events.get('#table:pointerup')({pointerId:31});
  assert.equal(element('#shoot').disabled,false,'initiating finger finishes placement');
  click('#new-game');
  events.get('#table:pointerdown')({clientX:100,clientY:130,pointerId:33});
  events.get('#table:lostpointercapture')({pointerId:33});
  events.get('#table:pointerdown')({clientX:110,clientY:140,pointerId:34});
  events.get('#table:pointerup')({pointerId:34});assert.equal(element('#shoot').disabled,false,'fresh pointer works after capture loss');
  events.get('#table:pointerdown')({clientX:100,clientY:130,pointerId:35});click('#new-game');
  events.get('#table:pointerup')({pointerId:35});
  assert.equal(element('#shoot').disabled,true,'stale owner cannot place a new rack');
  assert.equal(element('#shoot').disabled,true,'place cue ball before break');
  assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  assert.equal(element('#move-cue').hidden,false,'placement guidance visible');
  assert.equal(element('#move-cue').disabled,true,'already placing cue ball');
  // Tap outside the kitchen: should not bypass placement restriction.
  events.get('#table:pointerdown')({clientX:450,clientY:130,pointerId:1});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,true,'cannot break from wrong side of head string');
  // Drag the ball to a legal position and release to enable aiming.
  events.get('#table:pointerdown')({clientX:90,clientY:120,pointerId:2});
  events.get('#table:pointermove')({clientX:110,clientY:140,pointerId:2});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'break enabled after placement');
  assert.equal(element('#move-cue').disabled,false,'can change position before strike');
  assert.equal(element('#power').value,'85','break begins with powerful but adjustable default');
  // Direct re-placement near the cushion edge, without pressing Reposition.
  events.get('#table:pointerdown')({clientX:0,clientY:0,pointerId:34});
  events.get('#table:pointermove')({clientX:23,clientY:24,pointerId:34});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'near-rail kitchen re-placement is legal');

  click('#move-cue');
  assert.equal(element('#shoot').disabled,true,'reposition disables the break until released');
  events.get('#table:pointerdown')({clientX:120,clientY:170,pointerId:3});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'repositioned cue can break');

  assert.equal(element('#size').value,'7','native select reflects selected table');
  assert.match(element('#table-dimensions').textContent,/7 FT.*78.*39/);
  const width7=element('#table').width,height7=element('#table').height;
  assert.ok(width7<800&&height7<420,'default is the compact 7 foot bar box');
  assert.equal(element('#pocket-targets').hidden,true);
  tick();tick();assert.ok(cueDraws>0,'cue appears after legal break placement');
  setSlider('#power',92);
  setSlider('#spin-top',-54);
  setSlider('#spin-side',35);
  assert.equal(element('#spin-top-value').textContent,'Draw 54%');
  assert.equal(element('#spin-side-value').textContent,'Right 35%');
  click('#shoot');
  assert.equal(element('#power').value,'68','break power resets immediately after shot');
  assert.equal(element('#spin-top').value,'0','draw resets immediately after break');
  assert.equal(element('#spin-side').value,'0','English resets immediately after break');
  assert.equal(element('#spin-top-value').textContent,'Center');
  assert.equal(element('#spin-side-value').textContent,'Center');
  let frames=0;
  while(element('#table-status').textContent!=='PICK A BALL'&&frames++<2000)tick();
  assert.ok(frames<2000,'break ends and waits for called ball');
  assert.equal(element('#power').value,'68','post-break shots return to normal power default');
  assert.equal(element('#shoot').disabled,true,'no uncaught shot allowed');
  assert.equal(element('#but-wait-more').open,true,'mandatory call drawer opens after break');
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
  assert.equal(element('#pocket-targets').hidden,false,'pocket targets stay visible until shot');
  assert.equal(markers[1].attributes['aria-pressed'],'true','called pocket is selected');
  events.get('pocket-BR:click')();
  assert.equal(element('#call-pocket-status').textContent.includes('Pocket: '),true);
  assert.equal(markers[1].attributes['aria-pressed'],'false','previous pocket is deselected');
  assert.equal(markers[5].attributes['aria-pressed'],'true','new pocket is selected');
  assert.equal(element('#table-status').textContent,'AIM & SHOOT');
  assert.equal(element('#shoot').disabled,false);
  tick();assert.ok(cueDraws>waitingForPocket,'cue appears after complete call');
  click('#undo-call');
  assert.equal(element('#table-status').textContent,'PICK A BALL');
  assert.equal(element('#shoot').disabled,true);
  assert.equal(element('#but-wait-more').open,true,'undo keeps call controls discoverable');
  const afterUndo=cueDraws;tick();
  assert.equal(cueDraws,afterUndo,'undo hides cue');
  element('#ball-picks').children[0].listeners.get('click')();
  events.get('pocket-BR:click')();
  assert.equal(element('#shoot').disabled,false);
  assert.match(element('#call-hint').textContent,/3\. Aim from the white ball/, 'complete call advances to aiming guidance');
  setSlider('#power',43);
  setSlider('#spin-top',62);
  setSlider('#spin-side',-78);
  assert.equal(element('#spin-top-value').textContent,'Follow 62%');
  assert.equal(element('#spin-side-value').textContent,'Left 78%');
  click('#shoot');
  assert.equal(element('#power').value,'68','normal shot resets power');
  assert.equal(element('#spin-top').value,'0','normal shot resets draw/follow');
  assert.equal(element('#spin-side').value,'0','normal shot resets English');
  assert.equal(element('#power-value').textContent,'68%');
  assert.equal(element('#spin-top-value').textContent,'Center');
  assert.equal(element('#spin-side-value').textContent,'Center');
  assert.equal(element('#shoot').disabled,true,'fired call locks controls');
  assert.equal(element('#undo-call').disabled,true,'cannot change fired shot');
  click('#new-game');
  assert.equal(element('#pocket-targets').hidden,true);
  assert.equal(element('#shoot').disabled,true,'new rack requires break cue placement');
  assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  events.get('#table:pointerdown')({clientX:100,clientY:170,pointerId:4});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'new rack can place and break');
  assert.equal(element('#undo-call').disabled,true);
  element('#size').value='8';events.get('#size:change')({target:element('#size')});
  assert.equal(element('#size').value,'8');
  assert.match(element('#table-dimensions').textContent,/8 FT.*88.*44/);
  assert.ok(element('#table').width>width7&&element('#table').height>height7);
  assert.equal(element('#shoot').disabled,true,'size change starts cue-placement phase');
  events.get('#table:pointerdown')({clientX:120,clientY:170,pointerId:5});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'size 8 accepts head-quarter placement');
  assert.equal(element('#pocket-targets').hidden,true);
  const width8=element('#table').width,height8=element('#table').height;
  element('#size').value='9';events.get('#size:change')({target:element('#size')});
  assert.equal(element('#size').value,'9');
  assert.match(element('#table-dimensions').textContent,/9 FT.*100.*50/);
  assert.ok(element('#table').width>width8&&element('#table').height>height8);
  assert.equal(element('#shoot').disabled,true,'size 9 requires cue placement');
  events.get('#table:pointerdown')({clientX:145,clientY:215,pointerId:6});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'size 9 accepts legal placement');
  element('#size').value='7';events.get('#size:change')({target:element('#size')});
  assert.equal(element('#size').value,'7');
  assert.equal(element('#table').width,width7);
  assert.equal(element('#table').height,height7);
  assert.equal(element('#shoot').disabled,true,'switching back reracks and requires cue placement');
  events.get('#table:pointerdown')({clientX:110,clientY:165,pointerId:7});
  events.get('#table:pointerup')({pointerId:lastPointer});
  assert.equal(element('#shoot').disabled,false,'switching back permits cue placement');
  element('#mode').value='bot';events.get('#mode:change')();
  events.get('#table:pointerdown')({clientX:110,clientY:165,pointerId:8});events.get('#table:pointerup')({pointerId:lastPointer});
  events.get('#table:pointerdown')({clientX:element('#table').width*.5,clientY:0,pointerId:9});events.get('#table:pointerup')({pointerId:lastPointer});
  click('#shoot');assert.equal(controller.isRackInProgress,true);
  for(let i=0;i<3000&&!timers.size;i++)tick();
  if(!timers.size){
   element('#ball-picks').children[0].listeners.get('click')();events.get('pocket-BR:click')();
   setSlider('#power',1);click('#shoot');
   for(let i=0;i<3000&&!timers.size;i++)tick();
  }
  assert.ok(timers.size,'settled solo shot schedules bot work: '+element('#announcer-text').textContent+' / '+element('#table-status').textContent);
  const staleBot=timers.values().next().value,staleFrame=nextFrame,staleShoot=events.get('#shoot:click'),staleAim=events.get('#invert-aim:click');
  controller.dispose();controller.dispose();assert.equal(cancelled,1);assert.equal(timers.size,0);
  for(const key of ['#table:pointerdown','#shoot:click','window:keydown','window:storage','window:online','window:beforeunload'])assert.equal(events.has(key),false,key);
  const atExit=scheduled,status=element('#announcer-text').textContent,invert=element('#invert-aim').textContent;
  staleBot();staleFrame(time+1000);staleShoot();staleAim();
  assert.equal(scheduled,atExit);assert.equal(element('#announcer-text').textContent,status);assert.equal(element('#invert-aim').textContent,invert);
  controller=mountButWaitGame(document);assert.equal(controller.isRackInProgress,false);
  assert.equal(element('#power').value,'85');assert.equal(element('#table-status').textContent,'PLACE BREAK CUE');
  const previous=controller;controller=mountButWaitGame(document);previous.dispose();assert.equal(cancelled,2);
 }finally{
  controller?.dispose();
  setTableSize(9); // keep shared mutable geometry clean for other tests
  for(const [key,v] of Object.entries(original)){
   if(v===undefined)delete globalThis[key];else globalThis[key]=v;
  }
 }
});
