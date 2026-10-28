import test from 'node:test';
import assert from 'node:assert/strict';
import {TABLE,setTableSize} from '../src/table-geometry.js';

// Exercise the real Caroms browser module and event handlers with a small DOM
// surface. No duplicate game logic or external browser dependency in CI.
test('Caroms browser: break, reset, advanced call, and regulation table rerack',async()=>{
 const originals=Object.fromEntries(
  ['document','window','Option','fetch','requestAnimationFrame','localStorage'].map(k=>[k,globalThis[k]]));
 const elements=new Map(),listeners=new Map();
 let aimLineEnd=null;
 const ctx=new Proxy({lineTo(x,y){if(this.strokeStyle==='#fce2a8')aimLineEnd={x,y};}},
  {get:(obj,key)=>key in obj?obj[key]:()=>{},
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
    setAttribute(name,value){this[name]=String(value);},
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
 const saved=new Map([['squatch-table-size','8']]);
 globalThis.localStorage={getItem:key=>saved.get(key)??null,
  setItem:(key,value)=>saved.set(key,String(value))};
 try{
  await import('../src/caroms-game.js');
  assert.equal(el('caroms-size').value,'8','restores size chosen in But Wait');
  assert.equal(el('caroms-shoot').disabled,false,'1-ball break ready');
  assert.equal(el('caroms-striker').value,'1','break striker is 1');
  assert.equal(el('caroms-power').value,'85','break power starts at 85%');
  assert.equal(el('caroms-call-controls').hidden,true,'no break call');
  assert.equal(el('caroms-undo').disabled,true,'undo disabled on no-call break');
  assert.equal(el('caroms-pocket-TL').disabled,true,'no pocket quick calls on break');
  const w8=el('caroms-table').width,h8=el('caroms-table').height;
  assert.ok(w8>h8&&w8>0,'rectangular table');
  // Touch gesture: start ON the object ball and drag to aim, without a
  // separate tap elsewhere. The real controller must capture that pointer.
  const ballX=TABLE.radius+TABLE.width*.11,ballY=TABLE.height/2;
  const down=listeners.get('caroms-table:pointerdown');
  const move=listeners.get('caroms-table:pointermove');
  const up=listeners.get('caroms-table:pointerup');
  assert.ok(down&&move&&up,'table pointer handlers installed');
  let captured=null;
  el('caroms-table').setPointerCapture=id=>{captured=id;};
  down({clientX:ballX,clientY:ballY,pointerId:7});
  assert.equal(captured,7,'press on striker captures pointer for one-gesture aim');
  move({clientX:ballX+80,clientY:ballY+120,pointerId:7});
  up({clientX:ballX+80,clientY:ballY+120,pointerId:7});
  tick();
  assert.ok(aimLineEnd?.y>ballY+100,'dragging from ball aims below the striker');
  // On a narrow phone the 2.25-inch ball is less than 10 CSS pixels wide.
  // A finger 18px off center must still select the ball rather than aim at
  // nearby felt. Releasing on its center should preserve the previous aim.
  const table=el('caroms-table'),originalRect=table.getBoundingClientRect;
  const cssWidth=320,scale=cssWidth/TABLE.width;
  table.getBoundingClientRect=()=>({left:0,top:0,width:cssWidth,
   height:TABLE.height*scale});
  down({clientX:(ballX+50)*scale,clientY:ballY*scale,pointerId:9,pointerType:'touch'});
  up({clientX:ballX*scale,clientY:ballY*scale,pointerId:9,pointerType:'touch'});
  tick();
  assert.ok(aimLineEnd?.y>ballY+100,
   'near-ball phone tap must not redirect aim to adjacent felt');
  table.getBoundingClientRect=originalRect;
  // Return to the original straight break direction for the physics test.
  down({clientX:ballX+80,clientY:ballY,pointerId:8});
  up({clientX:ballX+80,clientY:ballY,pointerId:8});
  tick();
  assert.ok(Math.abs(aimLineEnd.y-ballY)<3,'tap on felt restores straight aim');
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
  assert.equal(el('caroms-call-ball').options.some(o=>o.value==='8'),false,
   'the 8 cannot be called on an open table');
  assert.equal(el('caroms-shoot').disabled,true,'cannot shoot without a call');
  aimLineEnd=null;tick();
  assert.equal(aimLineEnd,null,'no aim guide or cue stick before an advanced call');
  const called=el('caroms-call-ball').options.find(o=>o.value!=='');
  assert.ok(called,'a target ball remains available');
  change('caroms-call-ball',called.value);
  assert.equal(el('caroms-shoot').disabled,true,'ball alone is not a call');
  aimLineEnd=null;tick();
  assert.equal(aimLineEnd,null,'called ball alone must not reveal aiming guide');
  click('caroms-pocket-TL');
  assert.equal(el('caroms-call-pocket').value,'TL','pocket tap updates accessible selector');
  assert.equal(el('caroms-pocket-TL')['aria-pressed'],'true','called pocket announced as selected');
  assert.equal(el('caroms-shoot').disabled,false,'complete call enables shoot');
  aimLineEnd=null;tick();
  assert.ok(aimLineEnd,'complete ball and pocket call reveals the aiming guide');
  assert.equal(el('caroms-undo').disabled,false,'pre-strike call can be undone');
  click('caroms-undo');
  assert.equal(el('caroms-call-ball').value,'','undo clears called ball');
  assert.equal(el('caroms-call-pocket').value,'','undo clears called pocket');
  assert.equal(el('caroms-pocket-TL')['aria-pressed'],'false','undo clears pocket button state');
  assert.equal(el('caroms-shoot').disabled,true,'undo locks shot until new call');
  aimLineEnd=null;tick();
  assert.equal(aimLineEnd,null,'Undo call hides aiming guide again');
  assert.equal(el('caroms-undo').disabled,true,'no call remains to undo');
  change('caroms-call-ball',called.value);
  click('caroms-pocket-BR');
  assert.equal(el('caroms-call-pocket').value,'BR','second pocket tap changes the call');
  change('caroms-call-pocket','TL');
  assert.equal(el('caroms-pocket-TL')['aria-pressed'],'true','selector and buttons stay synchronized');
  assert.equal(el('caroms-shoot').disabled,false,'calling again enables shot');
  change('caroms-power',47,'input');
  change('caroms-top',60,'input');
  change('caroms-side',-40,'input');
  click('caroms-shoot');
  assert.equal(el('caroms-power').value,'68','normal power reset');
  assert.equal(el('caroms-top').value,'0','normal follow reset');
  assert.equal(el('caroms-side').value,'0','normal English reset');
  assert.equal(el('caroms-shoot').disabled,true,'call locked while rolling');
  assert.equal(el('caroms-undo').disabled,true,'undo blocked after strike');
  change('caroms-size','7');
  const w7=el('caroms-table').width,h7=el('caroms-table').height;
  assert.ok(w8>w7&&h8>h7,'7-foot bed smaller than restored 8-foot');
  assert.equal(saved.get('squatch-table-size'),'7','7-foot choice persists for But Wait');
  assert.equal(el('caroms-power').value,'85','size change starts new break');
  assert.equal(el('caroms-call-controls').hidden,true,'new rack needs no call');
  change('caroms-size','9');
  assert.ok(el('caroms-table').width>w8&&el('caroms-table').height>h8);
  assert.equal(saved.get('squatch-table-size'),'9','9-foot choice persists');
  change('caroms-size','8');
  assert.equal(el('caroms-table').width,w8);
  assert.equal(el('caroms-table').height,h8);
  assert.equal(saved.get('squatch-table-size'),'8','restored size can be selected again');
  assert.equal(el('caroms-shoot').disabled,false,'new rack can break');
  globalThis.localStorage={getItem(){throw Error('Storage blocked');},
   setItem(){throw Error('Storage blocked');}};
  change('caroms-size','7');
  assert.equal(el('caroms-table').width,w7,'storage denial cannot block a new rack');
 }finally{
  setTableSize(9);
  for(const [key,value] of Object.entries(originals)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});
