/** Shared, optional rack/shot telemetry for compact playable games. */
import {createStatsClient,newStatsId} from './stats.js';
export const newGameStatsId=()=>newStatsId();
export function createGameTelemetry(gameId){
 let storage=null,client=null;
 try{storage=globalThis.localStorage??null;}catch{}
 try{
  client=createStatsClient({
   gameId,storage,
   request:typeof fetch==='function'?fetch.bind(globalThis):null,
  });
  void client.refresh();void client.flush();
  if(typeof window!=='undefined')window.addEventListener('online',()=>{
   void client.flush();void client.refresh();
  });
 }catch{
  // Usage statistics must never prevent the game from loading or shooting.
 }
 return{
  rack:rackId=>client?.rack(rackId),
  balls:(rackId,shotId,count)=>client?.balls(rackId,shotId,count),
 };
}
