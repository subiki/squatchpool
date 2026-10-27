import {GAME_CATALOG} from '../../src/stats-games.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const games=new Map(GAME_CATALOG.map(g=>[g.id,g]));
const known=id=>games.get(id);
const isUuid=v=>typeof v==='string'&&uuid.test(v);
const rawDb=context=>context.env?.STATS_DB;
const unavailable=()=>json({error:'Statistics database is not connected yet.'},503);
const bad=(message,status=400)=>json({error:message},status);

// Schema bootstrap keeps deployment lean: create/bind D1 in Cloudflare once.
// CREATE IF NOT EXISTS is harmless on subsequent requests; no manual SQL step.
async function ensureSchema(db){
 await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS site_stats_racks (
   id TEXT PRIMARY KEY, game_key TEXT NOT NULL,
   visitor_hash TEXT NOT NULL, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`),
  db.prepare(`CREATE TABLE IF NOT EXISTS site_stats_balls (
   shot_id TEXT PRIMARY KEY, rack_id TEXT NOT NULL,
   ball_count INTEGER NOT NULL CHECK (ball_count BETWEEN 1 AND 14),
   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY(rack_id) REFERENCES site_stats_racks(id)
  )`),
  db.prepare('CREATE INDEX IF NOT EXISTS site_stats_racks_by_game ON site_stats_racks (game_key)'),
  db.prepare('CREATE INDEX IF NOT EXISTS site_stats_balls_by_rack ON site_stats_balls (rack_id)'),
 ]);
}

async function snapshot(db){
 const results=await db.batch([
  db.prepare('SELECT COUNT(*) AS racks, COUNT(DISTINCT visitor_hash) AS players FROM site_stats_racks'),
  db.prepare('SELECT game_key, COUNT(*) AS racks, COUNT(DISTINCT visitor_hash) AS players FROM site_stats_racks GROUP BY game_key'),
  db.prepare('SELECT r.game_key AS game_key, COALESCE(SUM(b.ball_count),0) AS balls FROM site_stats_balls b JOIN site_stats_racks r ON r.id=b.rack_id GROUP BY r.game_key'),
 ]);
 const site=results[0]?.results?.[0]||{};
 const byGame=new Map((results[1]?.results||[]).map(x=>[x.game_key,x]));
 const pots=new Map((results[2]?.results||[]).map(x=>[x.game_key,Number(x.balls)||0]));
 const entries=GAME_CATALOG.map(game=>{
  const row=byGame.get(game.id)||{};
  return{id:game.id,title:game.title,players:Number(row.players)||0,
   racks:Number(row.racks)||0,balls:pots.get(game.id)||0};
 });
 return{site:{players:Number(site.players)||0,racks:Number(site.racks)||0,
  balls:entries.reduce((a,g)=>a+g.balls,0)},games:entries,
  definition:'players = distinct anonymous browsers that broke at least one rack; racks = breaks struck; balls = object balls pocketed, including slop; no cue scratches',
  since:'Tracking started when this API was first enabled; historical racks cannot be reconstructed.'};
}
async function visitorHash(id){
 const bytes=new TextEncoder().encode(id.toLowerCase());
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}

export async function onRequestGet(context){
 const db=rawDb(context);if(!db)return unavailable();
 try{await ensureSchema(db);return json(await snapshot(db));}
 catch(err){console.error('stats read failed',err);return json({error:'Statistics unavailable.'},503);}
}
export async function onRequestPost(context){
 const db=rawDb(context);if(!db)return unavailable();
 const origin=context.request.headers.get('Origin');
 if(origin&&origin!==new URL(context.request.url).origin)return bad('Cross-origin stats submissions are not accepted.',403);
 if(!context.request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
  return bad('Expected JSON.');
 let payload;
 try{
  const body=await context.request.text();
  if(body.length>1024)return bad('Event too large.',413);
  payload=JSON.parse(body);
 }catch{return bad('Invalid JSON.');}
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return bad('Invalid event.');
 const {type,game,visitorId,rackId,shotId,count}=payload;
 const g=known(game);
 if(!g||!isUuid(visitorId)||!isUuid(rackId)||!['rack','balls'].includes(type))
  return bad('Invalid game, player, rack, or event type.');
 if(type==='balls'&&(!isUuid(shotId)||!Number.isInteger(count)||count<1||count>g.maxBallsPerRack))
  return bad('Invalid object-ball event.');
 if(type==='rack'&&(shotId!==undefined||count!==undefined))
  return bad('Unexpected rack fields.');
 try{
  await ensureSchema(db);
  const hash=await visitorHash(visitorId);
  if(type==='rack'){
   await db.prepare('INSERT OR IGNORE INTO site_stats_racks (id,game_key,visitor_hash) VALUES (?,?,?)')
    .bind(rackId,game,hash).run();
   const found=await db.prepare('SELECT game_key,visitor_hash FROM site_stats_racks WHERE id=?')
    .bind(rackId).first();
   if(found?.game_key!==game||found?.visitor_hash!==hash)return bad('Rack belongs to a different browser or game.',409);
  }else{
   const rack=await db.prepare('SELECT game_key,visitor_hash FROM site_stats_racks WHERE id=?')
    .bind(rackId).first();
   if(!rack||rack.game_key!==game||rack.visitor_hash!==hash)return bad('Start this rack before recording pocketed balls.',409);
   await db.prepare(`INSERT OR IGNORE INTO site_stats_balls (shot_id,rack_id,ball_count)
    SELECT ?,?,? WHERE
    COALESCE((SELECT SUM(ball_count) FROM site_stats_balls WHERE rack_id=?),0)+? <= ?`)
    .bind(shotId,rackId,count,rackId,count,g.maxBallsPerRack).run();
   const found=await db.prepare('SELECT rack_id,ball_count FROM site_stats_balls WHERE shot_id=?')
    .bind(shotId).first();
   if(!found||found.rack_id!==rackId||found.ball_count!==count)
    return bad('Ball event is inconsistent or exceeds the rack limit.',409);
  }
  return json({ok:true,stats:await snapshot(db)});
 }catch(err){console.error('stats write failed',err);return json({error:'Statistics unavailable.'},503);}
}
