import {mountGameHub} from './game-hub.js';
// Only views with a proven mount/dispose lifecycle share this document.
const PRESS='/press-your-luck',TUNA='/tuna',CAROMS='/caroms',CUTTHROAT='/cutthroat',BUT_WAIT='/but-wait';
const route=url=>{
 const path=url.pathname.replace(/\/+$/,'').replace(/\.html$/,'');
 return !path||path==='/index'?'/':path;
};
const supported=url=>['/',PRESS,TUNA,CAROMS,CUTTHROAT,BUT_WAIT].includes(route(url));

export function attachStaticNavigation(win=globalThis.window,{initialView,loadPress=()=>import('./press-your-luck-game.js'),loadTuna=()=>import('./tuna-game.js'),loadCaroms=()=>import('./caroms-game.js'),loadCutthroat=()=>import('./cutthroat-game.js'),loadButWait=()=>import('./game.js')}={}){
 if(!win?.document)return ()=>{};
 const doc=win.document;
 const loadGame=async url=>route(url)===PRESS?(await loadPress()).mountPressGame:
  route(url)===TUNA?(await loadTuna()).mountTunaGame:
  route(url)===CAROMS?(await loadCaroms()).mountCaromsGame:
  route(url)===CUTTHROAT?(await loadCutthroat()).mountCutthroatGame:
  route(url)===BUT_WAIT?(await loadButWait()).mountButWaitGame:null;
 let current=new URL(win.location.href),entry=0,currentEntry=0,currentIndex=0,pending=0,reverting=false;
 if(!supported(current))return ()=>{};
 let view=initialView||{dispose:route(current)==='/'?mountGameHub(doc):()=>{}};
 const replacing=url=>route(url)!==route(current)||url.search!==current.search;
 const canLeave=()=>!view?.isRackInProgress||win.confirm('Leave this unfinished rack? Its progress will be lost.');
 const sheets=new Map();
 const positions=new Map();
 const previousRestoration=win.history.scrollRestoration;
 win.history.scrollRestoration='manual';
 win.history.replaceState({...win.history.state,squatchStatic:0,squatchIndex:0},'',current.href);

 async function navigate(url,{pop=false,id,index}={}){
  const ticket=++pending;
  positions.set(currentEntry,{x:win.scrollX,y:win.scrollY});
  try{
   if(replacing(url)){
    // Request the precached static file even on extensionless production URLs.
    const pagePath=route(url)==='/'?'/index.html':route(url)+'.html';
    const response=await win.fetch(pagePath+url.search);
    if(!response.ok)throw new Error('Page unavailable');
    const next=new win.DOMParser().parseFromString(await response.text(),'text/html');
    if(ticket!==pending)return;
    const main=next.querySelector('main'),sources=[...next.querySelectorAll('[data-page-style]')];
    if(!main||!sources.length||main.querySelector('script'))throw new Error('Unsupported page');
    const styles=await Promise.all(sources.map(async source=>{
     if(source.tagName!=='LINK')return doc.importNode(source,true);
     const href=new URL(source.getAttribute('href'),new URL(pagePath,url));
     if(href.origin!==url.origin)throw new Error('Unsupported stylesheet');
     if(!sheets.has(href.href))sheets.set(href.href,win.fetch(href.href).then(async response=>{
      if(!response.ok)throw new Error('Styles unavailable');
      const css=await response.text();
      // These page sheets are self-contained. New asset-relative sheets
      // retain normal document navigation rather than changing URL resolution.
      if(/url\s*\(|@import/i.test(css.replace(/url\(\s*(['"])data:[\s\S]*?\1\s*\)/gi,'')))throw new Error('Unsupported stylesheet');
      return css;
     }).catch(error=>{sheets.delete(href.href);throw error;}));
     const style=doc.createElement('style');style.setAttribute('data-page-style','');
     style.textContent=await sheets.get(href.href);return style;
    }));
    const mountGame=await loadGame(url);
    if(ticket!==pending)return;
    const oldMain=doc.querySelector('main');
    oldMain.querySelectorAll('audio,video').forEach(media=>media.pause());
    const mounted=doc.importNode(main,true);
    view?.dispose();view=null;
    oldMain.replaceWith(mounted);
    doc.querySelectorAll('[data-page-style]').forEach(style=>style.remove());
    // Match direct-page CSS order on soft navigation. Page-only styles MUST
    // precede the canonical shared skin/layout; appending them after Rock or
    // the shared shell made the same page look different based on entry route.
    const sharedStyles=doc.head.querySelector?.('link[data-squatch-shared-styles]');
    if(sharedStyles){
      for(const style of styles)doc.head.insertBefore(style,sharedStyles);
    }else{
      // Older shells in tests / offline cached editions can still navigate.
      doc.head.append(...styles);
    }
    doc.querySelector('body > footer')?.remove();
    const footer=next.querySelector('body > footer');
    if(footer)mounted.after(doc.importNode(footer,true));
    doc.title=next.title;
    view=mountGame?mountGame(mounted):{dispose:route(url)==='/'?mountGameHub(doc):()=>{}};
   }else if(!view){
    const mountGame=await loadGame(url);
    if(ticket!==pending)return;
    view=mountGame?mountGame(doc.querySelector('main')):{dispose:route(url)==='/'?mountGameHub(doc):()=>{}};
   }
   if(pop){currentEntry=id??++entry;currentIndex=index??id??currentIndex;}
   else{
    currentEntry=++entry;
    currentIndex++;
    win.history.pushState({squatchStatic:currentEntry,squatchIndex:currentIndex},'',url.href);
   }
   current=url;
   for(const link of doc.querySelectorAll('.squatch-header-nav a')){
    if(route(new URL(link.href))===route(url))link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
   }
   const main=doc.querySelector('main');
   main.setAttribute('tabindex','-1');main.focus({preventScroll:true});
   const saved=pop&&positions.get(currentEntry);
   const anchor=url.hash&&doc.getElementById(decodeURIComponent(url.hash.slice(1)));
   if(saved)win.scrollTo(saved.x,saved.y);
   else if(anchor)anchor.scrollIntoView();
   else win.scrollTo(0,0);
  }catch{
   if(ticket===pending){view?.dispose();view=null;win.location.assign(url.href);}
  }
 }
 function click(event){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const url=new URL(link.href,win.location.href);
  if(url.origin!==win.location.origin||!supported(url))return;
  event.preventDefault();
  if(replacing(url)&&!canLeave()){pending++;return;}
  if(url.href!==current.href)void navigate(url);
  else pending++; // Choosing the current view cancels a pending destination.
 }
 function pop(event){
  if(reverting){reverting=false;return;}
  const url=new URL(win.location.href);
  if(!supported(url)){win.location.assign(url.href);return;}
  if(replacing(url)&&!canLeave()){
   pending++;
   const delta=currentIndex-(event.state?.squatchIndex??event.state?.squatchStatic??currentIndex);
   if(delta){reverting=true;win.history.go(delta);}
   else win.history.replaceState({...win.history.state,squatchStatic:currentEntry,squatchIndex:currentIndex},'',current.href);
   return;
  }
  void navigate(url,{pop:true,id:event.state?.squatchStatic,index:event.state?.squatchIndex});
 }
 const hide=()=>{pending++;view?.dispose();view=null;};
 const show=event=>{if(event.persisted)return navigate(new URL(win.location.href),{pop:true,id:win.history.state?.squatchStatic,index:win.history.state?.squatchIndex});};
 doc.addEventListener('click',click);
 win.addEventListener('popstate',pop);
 win.addEventListener('pagehide',hide);win.addEventListener('pageshow',show);
 return ()=>{
  pending++;
  view?.dispose();view=null;
  doc.removeEventListener('click',click);win.removeEventListener('popstate',pop);
  win.removeEventListener('pagehide',hide);win.removeEventListener('pageshow',show);
  win.history.scrollRestoration=previousRestoration;
 };
}

// Direct game pages seed the shell from their standalone controller entry.
if(globalThis.window?.location?.href&&![PRESS,TUNA,CAROMS,CUTTHROAT,BUT_WAIT].includes(route(new URL(window.location.href))))attachStaticNavigation();
