/** One cancellable, non-overlapping delayed action per bot controller. */
export function createBotTurnScheduler(){
 let timer=null,generation=0;
 return {
  get pending(){return timer!==null;},
  cancel(){
   generation++;
   if(timer!==null)clearTimeout(timer);
   timer=null;
  },
  schedule(action,delay=650){
   if(timer!==null)return false;
   const token=generation;
   timer=setTimeout(()=>{
    timer=null;
    if(token===generation)action();
   },delay);
   return true;
  },
 };
}
