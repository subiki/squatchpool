import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/stats.js';
import {createStatsClient} from '../src/stats.js';

const A='55555555-5555-4555-8555-555555555555';
const B='66666666-6666-4666-8666-666666666666';
const R1='11111111-1111-4111-8111-111111111111';
const R2='22222222-2222-4222-8222-222222222222';
const R3='33333333-3333-4333-8333-333333333333';
const S1='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const S2='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const game='but-wait-theres-more';

// Narrow D1 API stand-in: validates actual SQL statements against in-memory
// rows, executes insert-ignore/dedup and aggregate queries without Cloudflare.
function fakeD1(){
 const racks=new Map(),balls=new Map();
 const prepare=sql=>{
  let args=[];
  const stmt={
   bind(...values){args=values;return this;},
   async run(){
    if(sql.includes('INSERT OR IGNORE INTO site_stats_racks')){
     const [id,game_key,visitor_hash]=args;
     if(!racks.has(id))racks.set(id,{id,game_key,visitor_hash});
    }else if(sql.includes('INSERT OR IGNORE INTO site_stats_balls')){
     const [id,rack_id,count,,,limit]=args;
     const total=[...balls.values()].filter(x=>x.rack_id===rack_id)
      .reduce((sum,x)=>sum+x.ball_count,0);
     if(!balls.has(id)&&total+count<=limit)balls.set(id,{rack_id,ball_count:count});
    }
    return{success:true};
   },
   async first(){
    if(sql.includes('FROM site_stats_racks WHERE id='))return racks.get(args[0])||null;
    if(sql.includes('FROM site_stats_balls WHERE shot_id='))return balls.get(args[0])||null;
    throw new Error('Unexpected first query: '+sql);
   },
   async all(){
    if(sql.startsWith('CREATE '))return{results:[]};
    if(sql.includes('COUNT(DISTINCT visitor_hash)')&&!sql.includes('GROUP BY')){
     return{results:[{racks:racks.size,players:new Set([...racks.values()].map(x=>x.visitor_hash)).size}]};
    }
    if(sql.includes('COUNT(DISTINCT visitor_hash)')&&sql.includes('GROUP BY')){
     const grouped=new Map();
     for(const x of racks.values()){
      const row=grouped.get(x.game_key)||{game_key:x.game_key,racks:0,visitors:new Set()};
      row.racks++;row.visitors.add(x.visitor_hash);grouped.set(x.game_key,row);
     }
     return{results:[...grouped.values()].map(x=>({game_key:x.game_key,racks:x.racks,players:x.visitors.size}))};
    }
    if(sql.includes('SUM(b.ball_count)')){
     const sums=new Map();
     for(const b of balls.values()){
      const rack=racks.get(b.rack_id);
      sums.set(rack.game_key,(sums.get(rack.game_key)||0)+b.ball_count);
     }
     return{results:[...sums.entries()].map(([game_key,balls])=>({game_key,balls}))};
    }
    throw new Error('Unexpected batch query: '+sql);
   },
  };return stmt;
 };
 return{prepare,async batch(statements){return Promise.all(statements.map(s=>s.all()));}};
}
function context(db,payload,origin='https://squatch.subikistudios.com'){
 const options={method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(payload)};
 return{env:db?{STATS_DB:db}:{},request:new Request('https://squatch.subikistudios.com/api/stats',options)};
}
const rack=(visitorId,rackId)=>({type:'rack',game,visitorId,rackId});
const pot=(visitorId,rackId,shotId,count)=>({type:'balls',game,visitorId,rackId,shotId,count});

test('API distinguishes unavailable D1 from zero tracked games',async()=>{
 const missing=await onRequestGet({env:{}});
 assert.equal(missing.status,503);
 const ready=await onRequestGet({env:{STATS_DB:fakeD1()}});
 assert.equal(ready.status,200);
 const body=await ready.json();
 assert.deepEqual(body.site,{players:0,racks:0,balls:0});
 assert.equal(body.games[0].id,game);
 assert.equal(body.games[0].balls,0);
 assert.match(body.since,/Tracking started/);
});

test('API counts distinct anonymous browser players, actual breaks and pocketed balls',async()=>{
 const db=fakeD1();
 let result=await onRequestPost(context(db,rack(A,R1)));
 assert.equal(result.status,200);
 let snapshot=(await result.json()).stats;
 assert.deepEqual(snapshot.site,{players:1,racks:1,balls:0});
 result=await onRequestPost(context(db,rack(A,R1))); // retried break
 assert.equal((await result.json()).stats.site.racks,1);
 result=await onRequestPost(context(db,pot(A,R1,S1,3)));
 assert.equal(result.status,200);
 assert.equal((await result.json()).stats.site.balls,3);
 result=await onRequestPost(context(db,pot(A,R1,S1,3))); // retried shot
 assert.equal((await result.json()).stats.site.balls,3);
 result=await onRequestPost(context(db,rack(A,R2))); // same browser new rack
 assert.equal((await result.json()).stats.site.players,1);
 result=await onRequestPost(context(db,rack(B,R3))); // another browser
 assert.deepEqual((await result.json()).stats.site,{players:2,racks:3,balls:3});
 result=await onRequestGet({env:{STATS_DB:db}});
 snapshot=await result.json();
 assert.deepEqual(snapshot.games[0],{id:game,title:"But Wait, There's More",players:2,racks:3,balls:3});
});

test('API rejects invalid game, origin, event counts, rack ownership and inflated balls',async()=>{
 const db=fakeD1();
 assert.equal((await onRequestPost(context(db,{...rack(A,R1),game:'made-up-game'}))).status,400);
 assert.equal((await onRequestPost(context(db,rack(A,R1),'https://other.example'))).status,403);
 assert.equal((await onRequestPost(context(db,pot(A,R1,S1,1)))).status,409,'rack must precede balls');
 assert.equal((await onRequestPost(context(db,rack(A,R1)))).status,200);
 assert.equal((await onRequestPost(context(db,rack(B,R1)))).status,409,'different visitor cannot use same rack ID');
 assert.equal((await onRequestPost(context(db,pot(B,R1,S1,1)))).status,409);
 assert.equal((await onRequestPost(context(db,pot(A,R1,S1,15)))).status,400);
 assert.equal((await onRequestPost(context(db,pot(A,R1,S1,13)))).status,200);
 assert.equal((await onRequestPost(context(db,pot(A,R1,S2,2)))).status,409,'15 balls exceed 14-ball rack limit');
 assert.equal((await onRequestPost(context(db,pot(A,R1,S1,5)))).status,409,'cannot mutate event ID after insert');
 const res=await onRequestGet({env:{STATS_DB:db}});
 assert.equal((await res.json()).site.balls,13);
});

test('client queues unavailable events, retries later and never generates a player visit without a rack',async()=>{
 const db=fakeD1(),memory=new Map(),seen=[];
 let up=false;
 const request=async(path,options={})=>{
  if(!up)return{ok:false,status:503};
  if(options.method==='POST'){
   return onRequestPost(context(db,JSON.parse(options.body)));
  }
  return onRequestGet({env:{STATS_DB:db}});
 };
 let uid=0;
 const ids=[A,R1,S1];
 const tracker=createStatsClient({
  request,
  storage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
  uuid:()=>ids[Math.min(uid++,ids.length-1)],
  onStats:s=>seen.push(s),
 });
 assert.equal(tracker.pending(),0);
 await tracker.refresh();
 assert.equal(tracker.pending(),0,'visiting without shooting does not count');
 tracker.rack(R1);
 tracker.balls(R1,S1,2);
 await tracker.flush();
 assert.equal(tracker.pending(),2,'server outage preserves both ordered events');
 up=true;
 await tracker.flush();
 assert.equal(tracker.pending(),0);
 assert.equal(seen.at(-1).site.players,1);
 assert.equal(seen.at(-1).site.racks,1);
 assert.equal(seen.at(-1).site.balls,2);
 assert.deepEqual((await (await onRequestGet({env:{STATS_DB:db}})).json()).site,
  {players:1,racks:1,balls:2});
});
