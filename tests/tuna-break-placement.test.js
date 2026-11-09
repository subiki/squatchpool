import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,headStringX} from '../src/physics.js';

// Exercise the real Tuna controller with a minimal DOM, not a copied placement helper.
test('Tuna starts ready to break and supports kitchen dragging without confirmation on all table sizes',async()=>{
 const originals={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,Option:globalThis.Option,localStorage:globalThis.localStorage};
 let controller;
 const nodes=new Map(),listeners=new Map(),panel={open:false,setAttribute(){this.open=true;}};
 const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:id==='size'?'7':'',disabled:false,hidden:false,textContent:'',
   clientLeft:0,clientTop:0,
   get clientWidth(){return this.width;},
   get clientHeight(){return this.height;},
   getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};},
   getContext(){return ctx;},
   setPointerCapture(){},focus(){},
   setAttribute(name,value){this[name]=value;},
   addEventListener(event,fn){listeners.set(id+':'+event,fn);},
   removeEventListener(event,fn){if(listeners.get(id+':'+event)===fn)listeners.delete(id+':'+event);},
   replaceChildren(...children){this.children=children;},
   prepend(){},
  });
  return nodes.get(id);
 }
 globalThis.document={getElementById:node,querySelector:selector=>selector==='.kit-more'?panel:null,createElement:()=>({textContent:''})};
 globalThis.window={addEventListener(event,fn){listeners.set('window:'+event,fn);},removeEventListener(event,fn){if(listeners.get('window:'+event)===fn)listeners.delete('window:'+event);}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 let queuedFrame,frames=0,cancellations=0;
 globalThis.requestAnimationFrame=fn=>{queuedFrame=fn;return ++frames;};
 globalThis.cancelAnimationFrame=()=>{cancellations++;};
 const tap=(x,y)=>listeners.get('table:pointerdown')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const drag=(x,y)=>listeners.get('table:pointermove')({clientX:x,clientY:y,pointerId:1,buttons:1});
 const release=()=>listeners.get('table:pointerup')({pointerId:1});
 try{
  const {mountTunaGame}=await import('../src/tuna-game.js');
  controller=mountTunaGame(document);
  assert.match(readFileSync(new URL('../tuna.html',import.meta.url),'utf8'),/id="break-reposition"/);
  for(const size of [7,8,9]){
   node('size').value=String(size);
   node('size').onchange();
   assert.equal(TABLE.size,size,'size change rebuilds the regulation geometry immediately');
   assert.equal(controller.isRackInProgress,false,'size change starts an untouched rack');
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
   const beforeSecondary=node('status').textContent;
   listeners.get('table:pointerdown')({clientX:headStringX()*.35,clientY:TABLE.height/2,pointerId:2,buttons:1});
   listeners.get('table:pointermove')({clientX:headStringX()*.30,clientY:TABLE.height/2,pointerId:2,buttons:1});
   listeners.get('table:pointerup')({pointerId:2});
   assert.equal(node('status').textContent,beforeSecondary,'second finger cannot release the first finger drag');
   release();
   assert.match(node('status').textContent,/Cue positioned/,'only the initiating finger releases cue placement');
   assert.equal(node('shoot').disabled,false,'drag release keeps BREAK enabled');
   assert.equal(node('place').hidden,true,'drag does not reveal confirmation');
   tap(headStringX()*.55,TABLE.height/2);
   listeners.get('table:lostpointercapture')?.({pointerId:2});
   node('status').textContent='Owner still dragging';
   release();
   assert.match(node('status').textContent,/Cue positioned/,'another pointer losing capture must not release the owner');
   tap(headStringX()*.55,TABLE.height/2);
   listeners.get('table:lostpointercapture')?.({pointerId:1});
   node('status').textContent='Capture lost';
   listeners.get('table:pointerdown')({clientX:headStringX()*.45,clientY:TABLE.height/2,pointerId:3,buttons:1});
   listeners.get('table:pointerup')({pointerId:3});
   assert.match(node('status').textContent,/Cue positioned/,'capture loss must allow a fresh pointer to place the cue');
   node('shoot').onclick();
   const statusAtStrike=node('status').textContent;
   listeners.get('table:pointermove')({clientX:headStringX()*.25,clientY:TABLE.height/2,pointerId:1,buttons:1});
   listeners.get('table:pointerup')({pointerId:1});
   assert.equal(node('status').textContent,statusAtStrike,'stale held-finger input cannot re-enter cue placement during a shot');
   assert.equal(node('shoot').disabled,true,'BREAK immediately starts a physical shot without a call');
   assert.equal(node('power').value,'68','break consumes power and resets controls');
   let time=1000,settled=false;
   for(let i=0;i<3000;i++){
    time+=1000/120;queuedFrame(time);
    if(/Tap a ball|Place and confirm/.test(node('table-call-hint').textContent)){settled=true;break;}
   }
   assert.equal(settled,true,'physical break must settle and keep the frame loop alive');
   if(!node('place').hidden)node('place').onclick();
   assert.equal(node('shoot').disabled,true,'ordinary shot requires a complete call');
   node('shoot').onclick();
   assert.match(node('status').textContent,/before shooting/,'missing call blocks an ordinary strike');
   node('call-ball').value='1';listeners.get('call-ball:change')();
   assert.equal(node('shoot').disabled,true,'ball alone cannot enable Shoot');
   node('call-pocket').value='TM';
   listeners.get('call-pocket:change')();
   assert.equal(node('shoot').disabled,false,'complete dropdown call enables Shoot immediately');
   node('undo-call').onclick();
   assert.equal(node('shoot').disabled,true,'Undo blocks the cleared shot');
   node('call-ball').value='1';node('call-pocket').value='TM';listeners.get('call-pocket:change')();
   queuedFrame(time+1000/120);
   node('shoot').onclick();
   assert.equal(node('shoot').disabled,true,'complete call permits the next physical shot');
   assert.equal(node('status').textContent,'Balls rolling…','moving shot replaces stale aiming guidance');
   assert.match(node('table-call-hint').textContent,/Shot in progress/,'call guidance must leave the aiming phase immediately');
   assert.equal(node('undo-call').disabled,true,'Undo cannot be offered during motion');
   assert.equal(node('undo-call').hidden,true,'completed call controls hide during the shot');
   queuedFrame(time+2000/120);


  }
  assert.equal(controller.isRackInProgress,true,'struck rack is exposed to navigation');
  const staleFrame=queuedFrame,staleShoot=node('shoot').onclick;
  controller.dispose();controller.dispose();
  assert.equal(cancellations,1,'dispose is idempotent');
  assert.equal(listeners.has('table:pointerdown'),false,'input listener is removed');
  assert.equal(listeners.has('window:beforeunload'),false,'exit guard is removed');
  assert.equal(listeners.has('window:online'),false,'telemetry listener is removed');
  assert.equal(node('shoot').onclick,undefined,'button handler is restored');
  const frameCount=frames,status=node('status').textContent;
  staleFrame(1000);staleShoot();
  assert.equal(frames,frameCount,'stale callback cannot restart physics');
  assert.equal(node('status').textContent,status,'stale button cannot mutate disposed view');
  controller=mountTunaGame(document);
  assert.equal(controller.isRackInProgress,false,'remount starts a fresh rack');
  assert.equal(node('power').value,'85');
  assert.match(node('money').textContent,/Player 1: \$0/,'fresh match resets money');
  const first=controller;
  controller=mountTunaGame(document);
  assert.equal(cancellations,2,'mount replaces an existing controller on the same root');
  first.dispose();
  assert.equal(node('shoot').textContent,'BREAK');
 }finally{
  controller?.dispose();
  for(const [name,value] of Object.entries(originals)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
 }
});
