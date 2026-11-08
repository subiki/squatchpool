import test from 'node:test';
import assert from 'node:assert/strict';
import {attachStaticNavigation} from '../src/static-navigation.js';

// The remaining shell handles Home and the five mountable game routes.
// Arcade keeps ordinary document navigation until it has a lifecycle mount.
test('internal SPA navigation preserves the header, updates games, and guards unfinished racks',async()=>{
 const events=new Map(),requests=[],redirects=[],history=[],navLinks=[];
 let href='https://squatch.example/',state={},y=100,busy=false,allowLeave=false;
 let pressMounts=0,pressDisposals=0,tunaMounts=0;
 const link=path=>({href:path.startsWith('https://')?path:'https://squatch.example'+path,attributes:{},target:'',
  hasAttribute(){return false;},setAttribute(k,v){this.attributes[k]=v;},
  removeAttribute(k){delete this.attributes[k];}});
 for(const path of ['/','/but-wait.html','/caroms.html','/cutthroat.html',
                    '/press-your-luck.html','/tuna.html','/arcade.html'])navLinks.push(link(path));
 const doc={header:{name:'shared'},styles:[],main:null,title:'home'};
 function page(name){
  const main={name,focused:false,
   querySelector(){return null;},querySelectorAll(){return [];},
   replaceWith(next){doc.main=next;},after(){},
   setAttribute(){},focus(){this.focused=true;}};
  const sheet={tagName:'LINK',
   getAttribute(){return name==='home'?'/src/game-hub.css':'/src/game-page-layout.css';},
   remove(){doc.styles=doc.styles.filter(x=>x!==this);}};
  return {title:name,main,querySelector:k=>k==='main'?main:null,
   querySelectorAll:()=>[sheet]};
 }
 doc.main=page('home').main;
 doc.querySelector=k=>k==='main'?doc.main:null;
 doc.querySelectorAll=k=>k==='[data-page-style]'?doc.styles:navLinks;
 const sharedEntry={name:'canonical-shared-styles'};
 const insertions=[];
 doc.head={
  querySelector(selector){return selector==='link[data-squatch-shared-styles]'?sharedEntry:null;},
  insertBefore(style,before){assert.equal(before,sharedEntry);
   doc.styles.push(style);insertions.push(style);},
  append(){assert.fail('Route CSS must never be appended after the shared/optional Rock skin');}
 };
 doc.createElement=()=>({tagName:'STYLE',setAttribute(){},
  remove(){doc.styles=doc.styles.filter(x=>x!==this);}});
 doc.importNode=x=>x;
 doc.getElementById=k=>k==='game-caroms'?{scrollIntoView(){y=250;}}:null;
 doc.addEventListener=(k,fn)=>events.set('doc:'+k,fn);
 doc.removeEventListener=k=>events.delete('doc:'+k);
 const win={document:doc,scrollX:0,get scrollY(){return y;},scrollTo(x,v){y=v;},
  location:{get href(){return href;},get origin(){return 'https://squatch.example';},
   assign(url){redirects.push(url);}},
  history:{scrollRestoration:'auto',get state(){return state;},
   replaceState(next,unused,url){state=next;href=url;},
   pushState(next,unused,url){state=next;href=url;history.push({state:next,url});}},
  confirm:()=>allowLeave,
  addEventListener:(k,fn)=>events.set('win:'+k,fn),
  removeEventListener:k=>events.delete('win:'+k),
  fetch:async url=>{
   requests.push(url);
   return {ok:true,text:async()=>url.endsWith('.css')?'body{color:#fff}':
    url.includes('press-your-luck')?'press':url.includes('tuna')?'tuna':
    url.includes('caroms')?'caroms':url.includes('cutthroat')?'cutthroat':
    url.includes('but-wait')?'but-wait':'home'};
  },
  DOMParser:class{parseFromString(content){return page(content);}}
 };
 const stop=attachStaticNavigation(win,{
  initialView:{dispose(){}},
  loadPress:async()=>({mountPressGame(root){assert.equal(root.name,'press');pressMounts++;
   return {get isRackInProgress(){return busy;},dispose(){pressDisposals++;}};}}),
  loadTuna:async()=>({mountTunaGame(root){assert.equal(root.name,'tuna');tunaMounts++;
   return {get isRackInProgress(){return busy;},dispose(){}};}}),
  loadCaroms:async()=>({mountCaromsGame(root){
   assert.equal(root.name,'caroms');return {dispose(){}};}}),
  loadCutthroat:async()=>({mountCutthroatGame(root){
   assert.equal(root.name,'cutthroat');return {dispose(){}};}}),
  loadButWait:async()=>({mountButWaitGame(root){
   assert.equal(root.name,'but-wait');return {dispose(){}};}})
 });
 const click=(linkNode,extra={})=>{
  const ev={button:0,target:{closest:()=>linkNode},preventDefault(){this.prevented=true;},...extra};
  events.get('doc:click')(ev);return ev;
 };
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 assert.equal(click(link('/rules.html')).prevented,undefined,'retired Rules is not a soft-nav route');
 assert.equal(click(link('/archive.html')).prevented,undefined,'retired Field Notes is not a soft-nav route');
 assert.equal(click(link('/arcade.html')).prevented,undefined,'Arcade retains native navigation');
 assert.equal(click(link('/press-your-luck.html'),{ctrlKey:true}).prevented,undefined);
 assert.equal(click(link('https://outside.example/')).prevented,undefined,'external URLs are not intercepted');
 assert.equal(click(navLinks[4]).prevented,true);await flush();
 assert.equal(doc.main.name,'press');assert.equal(pressMounts,1);
 assert.equal(doc.header.name,'shared');assert.equal(navLinks[4].attributes['aria-current'],'page');
 busy=true;
 const count=requests.length;
 assert.equal(click(navLinks[0]).prevented,true);await flush();
 assert.equal(doc.main.name,'press');assert.equal(requests.length,count);
 allowLeave=true;
 click(navLinks[0]);await flush();
 assert.equal(doc.main.name,'home');assert.equal(pressDisposals,1);
 assert.equal(navLinks[0].attributes['aria-current'],'page');
 assert.equal(doc.header.name,'shared');
 busy=false;
 click(navLinks[5]);await flush();assert.equal(doc.main.name,'tuna');
 assert.equal(tunaMounts,1);
 click(navLinks[2]);await flush();assert.equal(doc.main.name,'caroms');
 click(navLinks[3]);await flush();assert.equal(doc.main.name,'cutthroat');
 click(navLinks[1]);await flush();assert.equal(doc.main.name,'but-wait');
 click(navLinks[0]);await flush();assert.equal(doc.main.name,'home');
 const countBefore=requests.length;
 click(link('/#game-caroms'));await flush();
 assert.equal(y,250,'homepage game cards offer working internal anchors');
 assert.equal(requests.length,countBefore,'anchor does not reload home');
 assert.equal(redirects.length,0);
 assert.ok(insertions.length>=5,'soft navigation reused the shared CSS order');
 stop();
 assert.equal(events.size,0);
 assert.equal(win.history.scrollRestoration,'auto');
});
