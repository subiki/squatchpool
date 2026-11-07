import test from 'node:test';
import assert from 'node:assert/strict';
import {attachStaticNavigation} from '../src/static-navigation.js';

test('Home/Rules/Archive/Press/Tuna/Caroms/Cutthroat navigation preserves header, rack progress, history and fallback',async()=>{
 const events=new Map(),requests=[],assigned=[],history=[];
 const header={stamp:'verified',stats:'live'},doc={header};
 let tunaMounts=0,tunaDisposals=0,caromsMounts=0,caromsDisposals=0,cutMounts=0,cutDisposals=0;
 let href='https://squatch.example/rules',state={},y=450,paused=0,fail=false,pending,active=false,mounts=0,disposals=0,allowLeave=false,goTarget;
 const link=path=>({href:'https://squatch.example'+path,attributes:{},target:'',
  hasAttribute(){return false;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
 const links=[link('/rules.html'),link('/archive.html'),link('/but-wait.html'),link('/'),link('/press-your-luck.html'),link('/tuna.html'),link('/caroms.html'),link('/cutthroat.html')];
 function page(name){
  const main={name,attributes:{},querySelector:()=>null,
   querySelectorAll:()=>[{pause(){paused++;}}],
   replaceWith(next){doc.main=next;},after(footer){doc.footer=footer;},
   setAttribute(k,v){this.attributes[k]=v;},focus(){this.focused=true;}};
  const style={name,tagName:'STYLE',remove(){doc.styles=doc.styles.filter(node=>node!==this);}};
  const sheet={tagName:'LINK',getAttribute:()=>name==='home'?'/src/game-hub.css':'/src/world.css',remove(){doc.styles=doc.styles.filter(node=>node!==this);}};
  const footer=name==='rules'?{remove(){doc.footer=null;}}:null;
  return {title:name,main,style,styles:[style,sheet],footer,
   querySelector:selector=>selector==='main'?main:footer,querySelectorAll:()=>[style,sheet]};
 }
 Object.assign(doc,page('rules'));
 doc.querySelector=selector=>selector==='main'?doc.main:selector==='body > footer'?doc.footer:null;
 doc.querySelectorAll=selector=>selector==='[data-page-style]'?doc.styles:links;
 doc.head={append(...styles){doc.styles=styles;doc.style=styles[0];}};
 doc.createElement=()=>({tagName:'STYLE',setAttribute(){},remove(){doc.styles=doc.styles.filter(node=>node!==this);}});
 doc.importNode=node=>node;
 doc.getElementById=id=>id==='episode-4'?{scrollIntoView(){y=900;}}:null;
 doc.addEventListener=(name,fn)=>events.set(name,fn);
 doc.removeEventListener=name=>events.delete(name);
 const win={document:doc,scrollX:0,get scrollY(){return y;},scrollTo(x,next){y=next;},
  location:{get href(){return href;},get origin(){return new URL(href).origin;},assign(url){assigned.push(url);}},
  history:{scrollRestoration:'auto',get state(){return state;},
   replaceState(next,unused,url){state=next;href=url;},
   pushState(next,unused,url){state=next;href=url;history.push({state:next,url});}},
  confirm:()=>allowLeave,
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
  fetch:async url=>{requests.push(url);if(pending)return pending;if(fail)throw new Error('offline');return {ok:true,text:async()=>url.endsWith('.css')?'body{color:green}':url.includes('press-your-luck')?'press':url.includes('tuna')?'tuna':url.includes('caroms')?'caroms':url.includes('cutthroat')?'cutthroat':url.includes('archive')?'archive':url.includes('index')?'home':'rules'};},
  DOMParser:class{parseFromString(text){return page(text);}},
 };
 const dispose=attachStaticNavigation(win,{loadPress:async()=>({mountPressGame(root){
  assert.equal(root.name,'press');mounts++;active=false;
  return {get isRackInProgress(){return active;},dispose(){disposals++;}};
 }}),loadTuna:async()=>({mountTunaGame(root){
  assert.equal(root.name,'tuna');tunaMounts++;active=false;
  return {get isRackInProgress(){return active;},dispose(){tunaDisposals++;}};
 }}),loadCaroms:async()=>({mountCaromsGame(root){
  assert.equal(root.name,'caroms');caromsMounts++;active=false;
  return {get isRackInProgress(){return active;},dispose(){caromsDisposals++;}};
 }}),loadCutthroat:async()=>({mountCutthroatGame(root){
  assert.equal(root.name,'cutthroat');cutMounts++;active=false;
  return {get isRackInProgress(){return active;},dispose(){cutDisposals++;}};
 }})});
 win.history.go=delta=>{assert.equal(delta,1,'Back cancellation reverses exactly one history position');href=goTarget.url;state=goTarget.state;events.get('popstate')({state});};
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
 assert.equal(doc.title,'archive');assert.equal(doc.main.focused,true);assert.equal(y,0);
 assert.equal(links[1].attributes['aria-current'],'page');assert.equal(paused,1);
 assert.deepEqual(requests,['/archive.html','https://squatch.example/src/world.css'],'only page HTML/styles are fetched, never header stats or scripts');
 y=600;href='https://squatch.example/rules';events.get('popstate')({state:{squatchStatic:0}});await flush();
 assert.equal(doc.main.name,'rules');assert.equal(y,450);assert.ok(doc.footer);
 const archiveEntry=history[0];href=archiveEntry.url;events.get('popstate')({state:archiveEntry.state});await flush();
 assert.equal(doc.main.name,'archive');assert.equal(y,600);
 click(link('/archive.html#episode-4'));await flush();assert.equal(y,900,'same-view anchors scroll without a reload');
 click(links[3]);await flush();
 assert.equal(doc.main.name,'home');assert.equal(doc.header,header);
 assert.equal(links[3].attributes['aria-current'],'page');
 click(links[1]);await flush();
 assert.equal(doc.main.name,'archive');
 assert.equal(requests.filter(url=>url.endsWith('/src/world.css')).length,1,'page styles are reused on return');
 assert.equal(requests.filter(url=>url.endsWith('/src/game-hub.css')).length,1);
 click(link('/archive.html#episode-4'));await flush();
 fail=true;click(links[0]);await flush();
 assert.equal(assigned.at(-1),links[0].href,'failed fetch falls back to a normal static link');
 fail=false;let resolve;pending=new Promise(done=>{resolve=done;});
 click(links[0]);click(link('/archive.html#episode-4'));
 resolve({ok:true,text:async()=>'rules'});await flush();
 assert.equal(doc.main.name,'archive','a stale response cannot replace the chosen current view');
 pending=null;
 click(links[4]);await flush();
 assert.equal(doc.main.name,'press');assert.equal(mounts,1);assert.equal(doc.header,header);
 const pressEntry=history.at(-1),backEntry=history.at(-2);
 active=true;
 const beforeCancel=requests.length;
 click(links[0]);await flush();
 assert.equal(doc.main.name,'press');assert.equal(requests.length,beforeCancel,'cancelled leave does not fetch or dispose');
 assert.equal(disposals,0);
 goTarget=pressEntry;href=backEntry.url;state=backEntry.state;events.get('popstate')({state});await flush();
 assert.equal(href,pressEntry.url);assert.equal(doc.main.name,'press');assert.equal(disposals,0);
 allowLeave=true;href=backEntry.url;state=backEntry.state;events.get('popstate')({state});await flush();
 assert.equal(doc.main.name,'archive');assert.equal(disposals,1,'confirmed leave disposes the game once');
 href=pressEntry.url;state=pressEntry.state;events.get('popstate')({state});await flush();
 assert.equal(mounts,2,'Forward starts one fresh game');
 events.get('pagehide')();assert.equal(disposals,2);
 await events.get('pageshow')({persisted:true});
 assert.equal(mounts,3,'native cached history restore remounts one game');
 click(links[5]);await flush();
 assert.equal(doc.main.name,'tuna');assert.equal(tunaMounts,1);assert.equal(disposals,3);
 assert.equal(doc.header,header);assert.equal(links[5].attributes['aria-current'],'page');
 const tunaEntry=history.at(-1),priorEntry=history.at(-2);
 active=true;allowLeave=false;
 const beforeTunaCancel=requests.length;
 click(links[4]);await flush();
 assert.equal(requests.length,beforeTunaCancel);assert.equal(tunaDisposals,0);
 goTarget=tunaEntry;href=priorEntry.url;state=priorEntry.state;events.get('popstate')({state});await flush();
 assert.equal(href,tunaEntry.url);assert.equal(doc.main.name,'tuna');assert.equal(tunaDisposals,0);
 allowLeave=true;href=priorEntry.url;state=priorEntry.state;events.get('popstate')({state});await flush();
 assert.equal(doc.main.name,'press');assert.equal(tunaDisposals,1);
 href=tunaEntry.url;state=tunaEntry.state;events.get('popstate')({state});await flush();
 assert.equal(tunaMounts,2,'Forward remounts Tuna');
 events.get('pagehide')();assert.equal(tunaDisposals,2);
 await events.get('pageshow')({persisted:true});assert.equal(tunaMounts,3);
 click(links[6]);await flush();
 assert.equal(doc.main.name,'caroms');assert.equal(caromsMounts,1);assert.equal(tunaDisposals,3);
 assert.equal(doc.header,header);assert.equal(links[6].attributes['aria-current'],'page');
 const caromsEntry=history.at(-1),beforeCaroms=history.at(-2);
 active=true;allowLeave=false;
 const beforeCaromsCancel=requests.length;
 click(links[5]);await flush();assert.equal(requests.length,beforeCaromsCancel);assert.equal(caromsDisposals,0);
 goTarget=caromsEntry;href=beforeCaroms.url;state=beforeCaroms.state;events.get('popstate')({state});await flush();
 assert.equal(href,caromsEntry.url);assert.equal(caromsDisposals,0);
 allowLeave=true;href=beforeCaroms.url;state=beforeCaroms.state;events.get('popstate')({state});await flush();
 assert.equal(doc.main.name,'tuna');assert.equal(caromsDisposals,1);
 href=caromsEntry.url;state=caromsEntry.state;events.get('popstate')({state});await flush();
 assert.equal(caromsMounts,2,'Forward remounts Caroms');
 events.get('pagehide')();assert.equal(caromsDisposals,2);
 await events.get('pageshow')({persisted:true});assert.equal(caromsMounts,3);
 click(links[7]);await flush();
 assert.equal(doc.main.name,'cutthroat');assert.equal(cutMounts,1);assert.equal(caromsDisposals,3);
 assert.equal(doc.header,header);assert.equal(links[7].attributes['aria-current'],'page');
 const cutEntry=history.at(-1),beforeCut=history.at(-2);
 active=true;allowLeave=false;
 const beforeCutCancel=requests.length;
 click(links[6]);await flush();assert.equal(requests.length,beforeCutCancel);assert.equal(cutDisposals,0);
 goTarget=cutEntry;href=beforeCut.url;state=beforeCut.state;events.get('popstate')({state});await flush();
 assert.equal(href,cutEntry.url);assert.equal(cutDisposals,0);
 allowLeave=true;href=beforeCut.url;state=beforeCut.state;events.get('popstate')({state});await flush();
 assert.equal(doc.main.name,'caroms');assert.equal(cutDisposals,1);
 href=cutEntry.url;state=cutEntry.state;events.get('popstate')({state});await flush();
 assert.equal(cutMounts,2,'Forward remounts Cutthroat');
 events.get('pagehide')();assert.equal(cutDisposals,2);
 await events.get('pageshow')({persisted:true});assert.equal(cutMounts,3);
 dispose();assert.equal(cutDisposals,3);assert.equal(events.size,0);assert.equal(win.history.scrollRestoration,'auto');
});
