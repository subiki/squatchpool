import test from 'node:test';
import assert from 'node:assert/strict';
import {attachStaticNavigation} from '../src/static-navigation.js';

test('Rules/Archive navigation preserves header identity, restores history and falls back safely',async()=>{
 const events=new Map(),requests=[],assigned=[],history=[];
 const header={stamp:'verified',stats:'live'},doc={header};
 let href='https://squatch.example/rules',state={},y=450,paused=0,fail=false,pending;
 const link=path=>({href:'https://squatch.example'+path,attributes:{},target:'',
  hasAttribute(){return false;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
 const links=[link('/rules.html'),link('/archive.html'),link('/but-wait.html')];
 function page(name){
  const main={name,attributes:{},querySelector:()=>null,
   querySelectorAll:()=>[{pause(){paused++;}}],
   replaceWith(next){doc.main=next;},after(footer){doc.footer=footer;},
   setAttribute(k,v){this.attributes[k]=v;},focus(){this.focused=true;}};
  const style={name,replaceWith(next){doc.style=next;}};
  const footer=name==='rules'?{remove(){doc.footer=null;}}:null;
  return {title:name==='rules'?'Rules':'Archive',main,style,footer,
   querySelector:selector=>selector==='main'?main:selector==='style[data-page-style]'?style:footer};
 }
 Object.assign(doc,page('rules'));
 doc.querySelector=selector=>selector==='main'?doc.main:selector==='style[data-page-style]'?doc.style:doc.footer;
 doc.querySelectorAll=()=>links;
 doc.importNode=node=>node;
 doc.getElementById=id=>id==='episode-4'?{scrollIntoView(){y=900;}}:null;
 doc.addEventListener=(name,fn)=>events.set(name,fn);
 doc.removeEventListener=name=>events.delete(name);
 const win={document:doc,scrollX:0,get scrollY(){return y;},scrollTo(x,next){y=next;},
  location:{get href(){return href;},get origin(){return new URL(href).origin;},assign(url){assigned.push(url);}},
  history:{scrollRestoration:'auto',get state(){return state;},
   replaceState(next,unused,url){state=next;href=url;},
   pushState(next,unused,url){state=next;href=url;history.push({state:next,url});}},
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
  fetch:async url=>{requests.push(url);if(pending)return pending;if(fail)throw new Error('offline');return {ok:true,text:async()=>url.includes('archive')?'archive':'rules'};},
  DOMParser:class{parseFromString(text){return page(text);}},
 };
 const dispose=attachStaticNavigation(win);
 const click=(target,extra={})=>{
  const event={button:0,target:{closest:()=>target},preventDefault(){this.prevented=true;},...extra};
  events.get('click')(event);return event;
 };
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 assert.equal(click(links[2]).prevented,undefined,'games retain native document navigation');
 assert.equal(click(links[1],{ctrlKey:true}).prevented,undefined,'new-tab gestures remain native');
 assert.equal(click(links[1]).prevented,true);await flush();
 assert.equal(doc.header,header);assert.deepEqual(header,{stamp:'verified',stats:'live'});
 assert.equal(doc.main.name,'archive');assert.equal(doc.style.name,'archive');assert.equal(doc.footer,null);
 assert.equal(doc.title,'Archive');assert.equal(doc.main.focused,true);assert.equal(y,0);
 assert.equal(links[1].attributes['aria-current'],'page');assert.equal(paused,1);
 assert.deepEqual(requests,['/archive.html'],'only page HTML is fetched, never header stats or scripts');
 y=600;href='https://squatch.example/rules';events.get('popstate')({state:{squatchStatic:0}});await flush();
 assert.equal(doc.main.name,'rules');assert.equal(y,450);assert.ok(doc.footer);
 const archiveEntry=history[0];href=archiveEntry.url;events.get('popstate')({state:archiveEntry.state});await flush();
 assert.equal(doc.main.name,'archive');assert.equal(y,600);
 click(link('/archive.html#episode-4'));await flush();assert.equal(y,900,'same-view anchors scroll without a reload');
 fail=true;click(links[0]);await flush();
 assert.equal(assigned.at(-1),links[0].href,'failed fetch falls back to a normal static link');
 fail=false;let resolve;pending=new Promise(done=>{resolve=done;});
 click(links[0]);click(link('/archive.html#episode-4'));
 resolve({ok:true,text:async()=>'rules'});await flush();
 assert.equal(doc.main.name,'archive','a stale response cannot replace the chosen current view');
 dispose();assert.equal(events.size,0);assert.equal(win.history.scrollRestoration,'auto');
});
