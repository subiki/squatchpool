// Only script-free information views share a document. Games keep native links
// until their controller mount/unmount lifecycle is proven.
const route=url=>url.pathname.replace(/\/+$/,'').replace(/\.html$/,'');
const supported=url=>['/rules','/archive'].includes(route(url));

export function attachStaticNavigation(win=globalThis.window){
 if(!win?.document)return ()=>{};
 const doc=win.document;
 let current=new URL(win.location.href),entry=0,currentEntry=0,pending=0;
 if(!supported(current))return ()=>{};
 const positions=new Map();
 const previousRestoration=win.history.scrollRestoration;
 win.history.scrollRestoration='manual';
 win.history.replaceState({...win.history.state,squatchStatic:0},'',current.href);

 async function navigate(url,{pop=false,id}={}){
  const ticket=++pending;
  positions.set(currentEntry,{x:win.scrollX,y:win.scrollY});
  try{
   if(route(url)!==route(current)||url.search!==current.search){
    // Request the precached static file even on extensionless production URLs.
    const response=await win.fetch(route(url)+'.html'+url.search);
    if(!response.ok)throw new Error('Page unavailable');
    const next=new win.DOMParser().parseFromString(await response.text(),'text/html');
    if(ticket!==pending)return;
    const main=next.querySelector('main'),style=next.querySelector('style[data-page-style]');
    if(!main||!style||main.querySelector('script'))throw new Error('Unsupported page');
    const oldMain=doc.querySelector('main');
    oldMain.querySelectorAll('audio,video').forEach(media=>media.pause());
    const mounted=doc.importNode(main,true);
    oldMain.replaceWith(mounted);
    doc.querySelector('style[data-page-style]').replaceWith(doc.importNode(style,true));
    doc.querySelector('body > footer')?.remove();
    const footer=next.querySelector('body > footer');
    if(footer)mounted.after(doc.importNode(footer,true));
    doc.title=next.title;
   }
   if(pop)currentEntry=id??++entry;
   else{
    currentEntry=++entry;
    win.history.pushState({squatchStatic:currentEntry},'',url.href);
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
   if(ticket===pending)win.location.assign(url.href);
  }
 }
 function click(event){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const url=new URL(link.href,win.location.href);
  if(url.origin!==win.location.origin||!supported(url))return;
  event.preventDefault();
  if(url.href!==current.href)void navigate(url);
  else pending++; // Choosing the current view cancels a pending destination.
 }
 function pop(event){
  const url=new URL(win.location.href);
  if(!supported(url)){win.location.assign(url.href);return;}
  void navigate(url,{pop:true,id:event.state?.squatchStatic});
 }
 doc.addEventListener('click',click);
 win.addEventListener('popstate',pop);
 return ()=>{
  pending++;
  doc.removeEventListener('click',click);win.removeEventListener('popstate',pop);
  win.history.scrollRestoration=previousRestoration;
 };
}

attachStaticNavigation();
