import {createShotLifecycle} from './shot-lifecycle.js';
import {createShotResultSession} from './shot-result.js';

/**
 * One rack-scoped shot coordinator. Physics still advances in each game's
 * 120 Hz loop; its settled snapshot goes through the pure house-rules adapter.
 * A shot may publish one ruling only while its own strike is active.
 *
 * Consumers subscribe to the normalized result, never re-adjudicate it.
 * Controllers retain game-specific scoring, spotting and cue placement.
 */
export function createGameSession({game,adjudicate}){
 const lifecycle=createShotLifecycle();
 const results=createShotResultSession({game,adjudicate});
 let activeShotId=null;
 return {
  get phase(){return lifecycle.phase;},
  get breakShot(){return lifecycle.breakShot;},
  subscribe:results.subscribe,
  startRack(){
   activeShotId=null;
   results.reset();
   lifecycle.startRack();
  },
  startShot(shotId){
   if(!shotId)throw new Error('A strike requires a stable shotId');
   if(!lifecycle.startShot())return false;
   activeShotId=shotId;
   return true;
  },
  resolveShot({shotId,context}){
   if(lifecycle.phase!=='moving'||shotId!==activeShotId)
    throw new Error('Cannot resolve an inactive or stale shot');
   return results.resolve({shotId,context});
  },
  settle(options){
   if(!lifecycle.settle(options))return false;
   activeShotId=null;
   return true;
  },
  confirmPlacement(){return lifecycle.confirmPlacement();},
 };
}
