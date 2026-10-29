/** Coin-Op Cutthroat telemetry; D1 is optional and never gates gameplay. */
import {createStatsClient,newStatsId} from './stats.js';
const GAME_ID='cutthroat';
let tracker=null;
const put=(id,value)=>{if(typeof document==='undefined')return;const el=document.getElementById(id);if(el)el.textContent=value;};
const format=totals=>['players','racks','balls'].map(k=>
 Number(totals[k]).toLocaleString('en-US')+' '+k).join(' · ');
export function initCutthroatStats(){
 if(typeof document==='undefined')return;
 let storage=null,hasGame=false;
 try{storage=globalThis.localStorage??null;}catch{}
 tracker=createStatsClient({
  gameId:GAME_ID,
  request:typeof fetch==='function'?fetch.bind(globalThis):null,
  storage,
  onStats:data=>{
   const game=data.games.find(g=>g.id===GAME_ID);
   hasGame=Boolean(game);
   if(game)put('cut-stats-game',format(game));
   put('cut-stats-site',format(data.site));
  },
  onStatus:state=>put('cut-stats-status',state==='live'&&hasGame?
   'Live D1 totals. Players means distinct anonymous browsers, not local seats.':
   'Statistics unavailable; gameplay continues and events retry when connected.')
 });
 void tracker.refresh();void tracker.flush();
 if(typeof window!=='undefined')window.addEventListener('online',()=>{
  void tracker.flush();void tracker.refresh();
 });
}
export const newCutthroatStatsId=()=>newStatsId();
export function reportCutthroatRack(rackId){tracker?.rack(rackId);}
export function reportCutthroatBalls(rackId,shotId,count){tracker?.balls(rackId,shotId,count);}
