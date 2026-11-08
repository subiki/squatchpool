import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBotShowtime} from '../src/bot-showtime.js';

function fakeNode(tag){
 return {
  tag,attributes:{},listeners:{},dataset:{},children:[],hidden:false,
  setAttribute(k,v){this.attributes[k]=v;},
  addEventListener(k,v){this.listeners[k]=v;},
  append(...children){this.children.push(...children);},
  prepend(...children){this.children.unshift(...children);},
  remove(){this.removed=true;},
 };
}
test('bot spectator gives real Pause, Resume and Step Shot with a clean cancel',()=>{
 const kit=fakeNode('div'),doc={createElement:fakeNode,location:{pathname:'/tuna.html'}};
 const stage={ownerDocument:doc,dataset:{},querySelector:s=>s==='.table-kit'?kit:null};
 const root={querySelector:s=>s==='#table-stage'?stage:s==='main'?{dataset:{squatchGameShell:'tuna'}}:null};
 const showtime=createBotShowtime(root);
 showtime.setSpectator(true);
 const panel=kit.children[0],pause=panel.children[1],step=panel.children[2];
 assert.equal(panel.hidden,false);
 let strokes=0;
 showtime.show({label:'Squatch Bot 1 · calls 8 to top-left',shoot:()=>strokes++,delay:60000});
 assert.equal(showtime.pending,true);
 assert.equal(stage.dataset.squatchBotPlanning,'true');
 assert.equal(step.disabled,false);
 pause.listeners.click();
 assert.equal(showtime.paused,true);
 assert.equal(pause.attributes['aria-pressed'],'true');
 step.listeners.click();
 assert.equal(strokes,1);
 assert.equal(showtime.pending,false);
 assert.equal(stage.dataset.squatchBotPlanning,undefined);
 showtime.show({label:'Another shot',shoot:()=>strokes++,delay:60000});
 showtime.cancel();
 assert.equal(showtime.pending,false);
 assert.equal(strokes,1);
 showtime.dispose();
 assert.equal(panel.removed,true);
});
test('all playable games expose a zero-human Squatch mode without removing human play',()=>{
 const dir=new URL('../',import.meta.url);
 for(const [file,id,value] of [
  ['but-wait.html','mode','bots'],['caroms.html','caroms-mode','bots'],
  ['cutthroat.html','cut-players','0'],['press-your-luck.html','opponent','bots'],
  ['tuna.html','opponent','bots'],['arcade.html','arcade-seat','bot']
 ]){
  const html=readFileSync(new URL(file,dir),'utf8');
  assert.ok(html.includes('id="'+id+'"'),file+' has a seat selector');
  assert.ok(html.includes('value="'+value+'"'),file+' supports hands-free bot mode');
 }
});
