/**
 * Shared page-level shot keys for the remaining table-kit controllers.
 * Native controls keep their own Space/arrow behavior: only a focused felt
 * canvas or page background receives shortcuts. The disposer supports SPA
 * navigation without lingering listeners from another game's session.
 */
export function attachShotKeyboard(win,{getPhase,isHumanTurn,shoot,nudgeAim}){
 if(!win?.addEventListener)return ()=>{};
 const keydown=e=>{
  const tag=e.target?.tagName?.toLowerCase();
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||
     e.target?.isContentEditable||
     (tag&&!['body','html','canvas'].includes(tag)))return;
  if(!isHumanTurn())return;
  const phase=getPhase();
  if(e.code==='Space'||e.key===' '||e.key==='Spacebar'){
   // Suppress browser scrolling throughout an active stroke, including
   // repeated keydowns while the balls are already moving.
   if(phase!=='aim'&&phase!=='moving')return;
   e.preventDefault();
   if(phase==='aim'&&!e.repeat)shoot();
   return;
  }
  if(phase==='aim'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
   e.preventDefault();
   if(!e.repeat)nudgeAim(e.key==='ArrowLeft'?-.025:.025);
  }
 };
 win.addEventListener('keydown',keydown);
 return ()=>win.removeEventListener?.('keydown',keydown);
}
