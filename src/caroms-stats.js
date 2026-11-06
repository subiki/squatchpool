/** Optional caroms telemetry; the shared client owns retries and live totals. */
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
let tracker=null;
export function initCaromsStats(){
 if(typeof document==='undefined')return;
 tracker=createGameTelemetry('caroms');
}
export const newCaromsStatsId=()=>newGameStatsId();
export function reportCaromsRack(rackId){tracker?.rack(rackId);}
export function reportCaromsBalls(rackId,shotId,count){tracker?.balls(rackId,shotId,count);}
