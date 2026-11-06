/** Shared, optional rack/shot telemetry for compact playable games. */
import {createStatsClient,newStatsId} from './stats.js';
export const newGameStatsId=()=>newStatsId();
export function createGameTelemetry(gameId){
 let storage=null,client=null;
 let hasTotals=false;
 const fields=['players','racks','balls'];
 const put=(id,value)=>{
  if(typeof document==='undefined')return;
  const node=document.getElementById?.(id);
  if(node)node.textContent=value;
 };
 try{storage=globalThis.localStorage??null;}catch{}
 try{
  client=createStatsClient({
   gameId,storage,
   request:typeof fetch==='function'?fetch.bind(globalThis):null,
   onStats:data=>{
    const game=data.games.find(g=>g.id===gameId);
    hasTotals=Boolean(game)&&fields.every(field=>Number.isSafeInteger(game[field])&&game[field]>=0);
    for(const field of fields)put('current-game-stats-'+field,hasTotals?game[field].toLocaleString('en-US'):'\u2014');
   },
   onStatus:state=>{
    const live=state==='live'&&hasTotals;
    if(!live)for(const field of fields)put('current-game-stats-'+field,'\u2014');
    put('current-game-stats-status',live
     ?'Live game totals · players are distinct anonymous browsers.'
     :'Statistics unavailable · gameplay continues.');
   },
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
