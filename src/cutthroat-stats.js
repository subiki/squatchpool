/** Optional cutthroat telemetry; the shared client owns retries and live totals. */
import {createGameTelemetry,newGameStatsId} from './game-telemetry.js';
let tracker=null;
export function initCutthroatStats(){
 if(typeof document==='undefined')return;
 tracker=createGameTelemetry('cutthroat');
}
export const newCutthroatStatsId=()=>newGameStatsId();
export function reportCutthroatRack(rackId){tracker?.rack(rackId);}
export function reportCutthroatBalls(rackId,shotId,count){tracker?.balls(rackId,shotId,count);}
