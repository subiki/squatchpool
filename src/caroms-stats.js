/** Caroms telemetry adapter. The shared API is optional; play never waits on it. */
import {createStatsClient,newStatsId} from './stats.js';

let tracker=null;
const GAME_ID='caroms';
const put=(id,value)=>{
 // Stats responses may finish after navigation or a headless DOM teardown.
 if(typeof document==='undefined')return;
 const el=document.getElementById(id);
 if(el)el.textContent=value;
};
const format=totals=>['players','racks','balls']
 .map(k=>Number(totals[k]).toLocaleString('en-US')+' '+k).join(' · ');

export function initCaromsStats(){
 if(typeof document==='undefined')return;
 const status=message=>put('caroms-stats-status',message);
 let hasGame=false;
 // Accessing localStorage itself can throw SecurityError in restricted browsers.
 // Telemetry is optional and must never prevent the game from starting.
 let storage=null;
 try{storage=globalThis.localStorage??null;}catch{}
 tracker=createStatsClient({
  gameId:GAME_ID,
  request:typeof fetch==='function'?fetch.bind(globalThis):null,
  storage,
  onStats:data=>{
   const game=data.games.find(g=>g.id===GAME_ID);
   hasGame=Boolean(game);
   if(!game){status('Caroms counters are not available on this server yet.');return;}
   put('caroms-stats-game',format(game));
   put('caroms-stats-site',format(data.site));
  },
  onStatus:state=>status(state==='live'&&hasGame
   ?'Live D1 totals since tracking began. Players means distinct anonymous browsers, not local participants.'
   :state==='live'?'Caroms counters are not available on this server yet.'
   :'Statistics unavailable; you can still play. Events will retry when the server is ready.'),
 });
 void tracker.refresh();void tracker.flush();
 if(typeof window!=='undefined')window.addEventListener('online',()=>{
  void tracker.flush();void tracker.refresh();
 });
}
export const newCaromsStatsId=()=>newStatsId();
export function reportCaromsRack(rackId){tracker?.rack(rackId);}
export function reportCaromsBalls(rackId,shotId,count){tracker?.balls(rackId,shotId,count);}
