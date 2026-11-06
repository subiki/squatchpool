// Keep native navigation, but let the browser confirm loss of a struck rack.
// The disposer is for a future controller unmount; this does not install a router.
export function attachMatchExitGuard(session,target=globalThis.window){
 if(!target?.addEventListener)return ()=>{};
 const beforeUnload=event=>{
  if(!session.isRackInProgress)return;
  event.preventDefault();
  event.returnValue='';
 };
 target.addEventListener('beforeunload',beforeUnload);
 return ()=>target.removeEventListener?.('beforeunload',beforeUnload);
}
