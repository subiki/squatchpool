import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE} from '../src/physics.js';

const html=readFileSync(new URL('../press-your-luck.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');
test('Press Your Luck page exposes match, cue placement, 8 call/undo, spin and scoring',()=>{
 for(const id of ['pyl-table','pyl-target','pyl-size','pyl-new-match','pyl-next',
  'pyl-turn','pyl-score','pyl-status','pyl-place','pyl-reposition','pyl-shoot',
  'pyl-eight-panel','pyl-pockets','pyl-undo','pyl-bank',
  'pyl-power','pyl-top','pyl-side','pyl-log','pyl-stats-game'])
  assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 for(const id of ['TL','TM','TR','BL','BM','BR'])
  assert.match(html,new RegExp('data-pocket="'+id+'"'));
 assert.match(source,/pressTurn\(/);
 assert.match(source,/fullRack\(/);
 assert.match(source,/step\(game\.balls,1\/120\)/);
 assert.match(source,/game\.power=68;game\.top=0;game\.side=0/);
 assert.match(source,/game\.phase='placeBreak'/);
});
test('real controller initializes and allows a human break only after legal kitchen placement',async()=>{
 const nodes=new Map();
 const make=id=>{
  const handlers={};
  const node={id,handlers,textContent:'',value:'',disabled:false,hidden:false,checked:false,
   style:{},dataset:{},children:[],
   addEventListener(name,handler){handlers[name]=handler;},
   setAttribute(name,value){this[name]=value;},
   setCustomValidity(value){this.validity=value;},reportValidity(){},
   replaceChildren(...children){this.children=children;},
   prepend(child){this.children.unshift(child);},
   get lastElementChild(){return this.children.at(-1);},
   remove(){this.removed=true;}
  };
  nodes.set(id,node);return node;
 };
 const $=id=>nodes.get(id)||make(id);
 $('pyl-target').value='15';$('pyl-size').value='7';
 const pockets=['TL','TM','TR','BL','BM','BR'].map(id=>Object.assign(make('pocket-'+id),{dataset:{pocket:id}}));
 const ctx=new Proxy({},{get:(target,key)=>key in target?target[key]:()=>{}});
 const canvas=$('pyl-table');
 canvas.getContext=()=>ctx;
 canvas.getBoundingClientRect=()=>({left:0,top:0,width:TABLE.width,height:TABLE.height});
 canvas.setPointerCapture=()=>{};
 globalThis.document={
  getElementById:$,
  createElement:tag=>make('created-'+tag),
  querySelector:selector=>selector.startsWith('#')?$(selector.slice(1)):null,
  querySelectorAll:selector=>selector==='#pyl-pockets button'?pockets:[]
 };
 globalThis.window={addEventListener(){}};
 globalThis.requestAnimationFrame=()=>1;
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.fetch=async()=>({ok:false,status:503});
 await import('../src/press-your-luck-game.js?browser-smoke=1');
 assert.match($('pyl-status').textContent,/kitchen/);
 assert.equal($('pyl-shoot').disabled,true);
 assert.equal($('pyl-place').disabled,true);
 const pointer={clientX:100,clientY:TABLE.height/2,pointerId:1};
 canvas.handlers.pointerdown(pointer);
 assert.equal($('pyl-place').disabled,false);
 $('pyl-place').handlers.click();
 assert.equal($('pyl-shoot').disabled,false);
 $('pyl-shoot').handlers.click();
 assert.equal($('pyl-shoot').disabled,true,'cannot fire twice during physics');
 assert.equal($('pyl-power').value,'68');
 assert.equal($('pyl-top').value,'0');
 assert.equal($('pyl-side').value,'0');
});
