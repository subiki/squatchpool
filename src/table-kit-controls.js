export function mountTableKit(root=globalThis.document){
 const doc=root?.ownerDocument||root;
 const find=id=>root?.getElementById?.(id)||root?.querySelector?.('#'+id);
 const stage=find('table-stage'),button=find('kit-fullscreen');
 if(!stage||!button||!doc.addEventListener)return ()=>{};
 let disposed=false;
 const refresh=()=>{
  if(disposed)return;
  const active=doc.fullscreenElement===stage;
  button.textContent=active?'⛶ Exit fullscreen':'⛶ Fullscreen';
  button.setAttribute('aria-pressed',String(active));
 };
 const click=async()=>{
  if(disposed)return;
  try{if(doc.fullscreenElement===stage)await doc.exitFullscreen();else await stage.requestFullscreen();}
  catch{if(!disposed)button.textContent='Fullscreen unavailable';}
 };
 button.addEventListener('click',click);doc.addEventListener('fullscreenchange',refresh);refresh();
 return ()=>{disposed=true;button.removeEventListener('click',click);doc.removeEventListener('fullscreenchange',refresh);};
}
