/**
 * One settled physics shot -> one immutable, mode-normalized ruling event.
 * Rules stay pure; UI/history/telemetry subscribe without adjudicating again.
 * Each rack resets the idempotency map. This is intentionally independent of
 * the 120 Hz physics loop and the existing cue placement lifecycle.
 *
 * ShotResult: {game,shotId,legal,foul,pocketed,points,nextPlayer,
 *   ballInHand,rackEnd,announcement,actions}.
 */
export function createShotResultSession({game,adjudicate}){
 const listeners=new Set(),resolved=new Map();
 return {
  subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
  reset(){resolved.clear();},
  resolve({shotId,context}){
   if(!shotId)throw new Error('A settled shot requires a stable shotId');
   if(resolved.has(shotId))return resolved.get(shotId);
   const result=Object.freeze({game,shotId,...adjudicate(context)});
   resolved.set(shotId,result);
   for(const listener of listeners)listener(result);
   return result;
  },
 };
}
