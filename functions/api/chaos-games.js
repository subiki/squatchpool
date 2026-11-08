// Public, immutable Chaos recipe versions on Cloudflare D1.
// Anonymous publishing is rate-limited best-effort; no identity/ownership claims.
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isId=s=>typeof s==='string'&&uuid.test(s);
const error=(message,status=400)=>reply({error:message},status);
const dbOf=c=>c.env?.STATS_DB;
async function schema(db){await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS chaos_game_versions (version_id TEXT PRIMARY KEY, game_id TEXT NOT NULL, root_game_id TEXT NOT NULL, parent_version_id TEXT, generation INTEGER NOT NULL, name TEXT NOT NULL, recipe TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
 db.prepare('CREATE INDEX IF NOT EXISTS chaos_game_versions_parent ON chaos_game_versions(parent_version_id)'),
 db.prepare('CREATE INDEX IF NOT EXISTS chaos_game_versions_root ON chaos_game_versions(root_game_id)'),
 db.prepare('CREATE INDEX IF NOT EXISTS chaos_game_versions_game ON chaos_game_versions(game_id)')
]);}
const query=c=>new URL(c.request.url).searchParams;
const rowToPublic=r=>r?{versionId:r.version_id,gameId:r.game_id,rootGameId:r.root_game_id,parentVersionId:r.parent_version_id,generation:r.generation,name:r.name,recipe:JSON.parse(r.recipe),createdAt:r.created_at}:null;
export async function onRequestGet(c){
 const db=dbOf(c);if(!db)return error('Game library unavailable',503);
 const q=query(c),version=q.get('version'),root=q.get('root'),parent=q.get('parent');
 if(version&&!isId(version)||root&&!isId(root)||parent&&!isId(parent))return error('Invalid game ID');
 try{
  await schema(db);
  if(version){const r=await db.prepare('SELECT * FROM chaos_game_versions WHERE version_id=?').bind(version).first();return r?reply({game:rowToPublic(r)}):error('Game version not found',404);}
  if(root){const r=await db.prepare('SELECT version_id,game_id,root_game_id,parent_version_id,generation,name,created_at FROM chaos_game_versions WHERE root_game_id=? ORDER BY created_at DESC LIMIT 100').bind(root).all();return reply({versions:r.results||[]});}
  if(parent){const r=await db.prepare('SELECT version_id,game_id,root_game_id,parent_version_id,generation,name,created_at FROM chaos_game_versions WHERE parent_version_id=? ORDER BY created_at DESC LIMIT 100').bind(parent).all();return reply({versions:r.results||[]});}
  const r=await db.prepare('SELECT version_id,game_id,root_game_id,parent_version_id,generation,name,created_at FROM chaos_game_versions ORDER BY created_at DESC LIMIT 30').all();
  return reply({versions:r.results||[]});
 }catch(e){console.error('chaos library read failed',e);return error('Game library unavailable',503);}
}
export async function onRequestPost(c){
 const db=dbOf(c);if(!db)return error('Game library unavailable',503);
 const origin=c.request.headers.get('Origin');if(origin&&origin!==new URL(c.request.url).origin)return error('Cross-origin publishing denied',403);
 if(!c.request.headers.get('content-type')?.startsWith('application/json'))return error('Expected JSON');
 const length=Number(c.request.headers.get('content-length')||0);if(length>18000)return error('Game code too large',413);
 let payload;try{const raw=await c.request.text();if(raw.length>18000)return error('Game code too large',413);payload=JSON.parse(raw);}catch{return error('Invalid JSON');}
 const recipe=payload?.recipe,l=recipe?.lineage;
 if(recipe?.version!==1||!Array.isArray(recipe.balls)||recipe.balls.length<1||recipe.balls.length>70||!Array.isArray(recipe.bumpers)||recipe.bumpers.length>40||!l||!isId(l.gameId)||!isId(l.versionId)||!Number.isInteger(l.generation)||l.generation<0||l.generation>1000||typeof recipe.name!=='string'||recipe.name.length>72)return error('Invalid game recipe or lineage');
 if(!recipe.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.x>=32&&b.x<=928&&b.y>=32&&b.y<=488&&/^#[0-9a-f]{6}$/i.test(b.c))||!recipe.bumpers.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.r>=10&&b.r<=45))return error('Invalid table geometry');
 if(!['clear','eight','shots','survive','sandbox'].includes(recipe.goal)||!Number.isInteger(recipe.shotLimit)||recipe.shotLimit<1||recipe.shotLimit>99)return error('Invalid challenge');
 if(!recipe.mods||typeof recipe.mods!=='object'||Object.keys(recipe.mods).some(k=>!['bounce','gravity','magnet','pinball','blackHole','portals','roulette','multiball','infection','split','sabotage','gauntlet'].includes(k)||typeof recipe.mods[k]!=='boolean'))return error('Invalid modifiers');
 const parent=l.parentVersionId||null;
 if(parent!==null&&!isId(parent))return error('Invalid parent');
 if(parent===null&&l.generation!==0)return error('Missing parent');
 if(parent!==null&&l.generation===0)return error('Unexpected parent');
 try{
  await schema(db);
  let root=l.gameId;
  if(parent){
   const p=await db.prepare('SELECT game_id,root_game_id,generation FROM chaos_game_versions WHERE version_id=?').bind(parent).first();
   if(!p)return error('Publish the parent version first',409);
   if(l.generation!==p.generation+1&&l.gameId!==p.game_id)return error('Invalid fork generation',409);
   root=p.root_game_id;
  }
  // Immutable: first published version wins. Repeated publish is idempotent.
  await db.prepare('INSERT OR IGNORE INTO chaos_game_versions(version_id,game_id,root_game_id,parent_version_id,generation,name,recipe) VALUES (?,?,?,?,?,?,?)')
   .bind(l.versionId,l.gameId,root,parent,l.generation,recipe.name,JSON.stringify(recipe)).run();
  const stored=await db.prepare('SELECT * FROM chaos_game_versions WHERE version_id=?').bind(l.versionId).first();
  if(!stored||stored.game_id!==l.gameId||stored.parent_version_id!==parent)return error('Version ID already used',409);
  return reply({game:rowToPublic(stored),url:'/chaos.html?game='+encodeURIComponent(stored.version_id)},201);
 }catch(e){console.error('chaos library publish failed',e);return error('Game library unavailable',503);}
}
