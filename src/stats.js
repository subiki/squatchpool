import {CURRENT_GAME,GAME_CATALOG} from './stats-games.js';

const VISITOR_KEY='squatch-stats-visitor-v1';
const QUEUE_KEY='squatch-stats-pending-v1';
const API='/api/stats';
const LIMIT=120;
const isUuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export function newStatsId(){
 try{return globalThis.crypto?.randomUUID?.()||null;}catch{return null;}
}

// Small dependency-injectable client so tests can exercise retries, duplicate
// delivery and rendering without an HTTP server or the Cloudflare account.
export function createStatsClient({request,storage,uuid=newStatsId,onStats=()=>{},onStatus=()=>{},gameId=CURRENT_GAME}){
 const game=GAME_CATALOG.find(g=>g.id===gameId);
 if(!game)throw new Error('Unknown stats game: '+gameId);
 // Preserve the original But Wait queue; separate game queues must never discard each other.
 const queueKey=gameId===CURRENT_GAME?QUEUE_KEY:QUEUE_KEY+'-'+gameId;
 let visitor=null,queue=[],flushing=null;
 const read=key=>{try{return storage?.getItem(key)||null;}catch{return null;}};
 const save=(key,value)=>{try{storage?.setItem(key,value);}catch{}};
 const savedVisitor=read(VISITOR_KEY);
 visitor=isUuid(savedVisitor)?savedVisitor:uuid();
 if(isUuid(visitor)&&visitor!==savedVisitor)save(VISITOR_KEY,visitor);
 try{
  const saved=JSON.parse(read(queueKey)||'[]');
  if(Array.isArray(saved))queue=saved.filter(e=>e&&['rack','balls'].includes(e.type)&&
   e.game===gameId&&isUuid(e.rackId)&&isUuid(e.visitorId)&&
   (e.type==='rack'||(isUuid(e.shotId)&&Number.isInteger(e.count)&&e.count>=1&&e.count<=game.maxBallsPerRack))).slice(0,LIMIT);
 }catch{}
 const persist=()=>save(queueKey,JSON.stringify(queue));
 async function refresh(){
  if(typeof request!=='function')return;
  try{
   const response=await request(API,{cache:'no-store'});
   if(!response.ok)throw new Error('Stats server not ready: '+response.status);
   const data=await response.json();
   if(!data?.site||!Array.isArray(data.games))throw new Error('Invalid stats data');
   onStats(data);onStatus('live');
  }catch{onStatus('unavailable');}
 }
 function flush(){
  if(flushing)return flushing;
  if(!queue.length||typeof request!=='function')return Promise.resolve();
  flushing=(async()=>{
   try{
    while(queue.length){
    const event=queue[0],response=await request(API,{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(event),cache:'no-store',
    });
    if(!response.ok){
     // Bad client event is unrecoverable; don't block future good events.
     if([400,403,409,413].includes(response.status)){
      queue.shift();persist();continue;
     }
     throw new Error('Stats API unavailable');
    }
    const result=await response.json();
    queue.shift();persist();
    if(result?.stats?.site){onStats(result.stats);onStatus('live');}
   }
   }catch{onStatus('unavailable');}
  })().finally(()=>{flushing=null;});
  return flushing;
 }
 function add(event){
  if(!isUuid(visitor)||!isUuid(event.rackId))return;
  if(queue.length>=LIMIT)return; // Never replace the parent rack event with a shot.
  queue.push({visitorId:visitor,game:gameId,...event});persist();
  void flush();
 }
 function rack(rackId){add({type:'rack',rackId});}
 function balls(rackId,shotId,count){
  if(!isUuid(shotId)||!Number.isInteger(count)||count<1||count>game.maxBallsPerRack)return;
  add({type:'balls',rackId,shotId,count});
 }
 return{refresh,flush,rack,balls,pending:()=>queue.length};
}

function put(id,value){
 const node=document.querySelector('#'+id);
 if(node)node.textContent=Number(value).toLocaleString('en-US');
}
function renderStats(data){
 for(const field of ['players','racks','balls']){
  put('site-stats-'+field,data.site[field]);
  const game=data.games.find(g=>g.id===CURRENT_GAME);
  put('game-stats-'+field,game?.[field]??0);
 }
 const container=document.querySelector('#site-stats-breakdown');
 if(container){
  const rows=data.games.map(g=>{
   const item=document.createElement('div');item.className='stats-game-row';
   const title=document.createElement('strong');title.textContent=g.title;
   const totals=document.createElement('span');
   totals.textContent=[g.players+' players',g.racks+' racks',g.balls+' balls'].join(' · ');
   item.append(title,totals);return item;
  });
  container.replaceChildren(...rows);
 }
}
let live=null;
export function initStats(){
 if(typeof document==='undefined')return;
 const status=document.querySelector('#stats-status');
 const client=createStatsClient({
  request:typeof fetch==='function'?fetch.bind(globalThis):null,
  storage:typeof localStorage==='undefined'?null:localStorage,
  onStats:renderStats,
  onStatus:state=>{if(status)status.textContent=state==='live'
   ?'Live totals since statistics launched · players = distinct anonymous browsers that played; shared devices count once.'
   :'Statistics are not connected yet. Game play still works; totals will appear when the server is ready.';},
 });
 live=client;
 void client.refresh();
 void client.flush();
 if(typeof window!=='undefined')window.addEventListener('online',()=>{void client.flush();void client.refresh();});
}
export function reportRack(rackId){live?.rack(rackId);}
export function reportBalls(rackId,shotId,count){live?.balls(rackId,shotId,count);}
