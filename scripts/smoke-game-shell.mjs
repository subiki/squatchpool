/**
 * Browser smoke for the one-page Squatch game shell.
 * Zero npm dependencies. Uses the Chrome/Chromium already on the CI runner.
 * Checks real module execution/computed DOM; source assertions alone cannot.
 */
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';

const root=resolve(new URL('..',import.meta.url).pathname);
const exe=process.env.CHROME_BIN||
 ['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(name=>{
  const check=spawnSync('which',[name],{encoding:'utf8'});
  return check.status===0;
 });
if(!exe){console.error('Headless browser unavailable: install Chrome/Chromium on the CI runner.');process.exit(1);}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webmanifest':'application/manifest+json'};
const games=['but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];
const probe=`<script>
(()=>{
 const errors=[];
 const fail=e=>{errors.push(String(e?.message||e?.reason||e||'unknown'));};
 window.addEventListener('error',fail);
 window.addEventListener('unhandledrejection',fail);
 window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
   try {
    const main=document.querySelector('main');
    const expected=['squatch-page-hero','squatch-game-setup','squatch-game-rules',
                    'squatch-game-play','squatch-game-after'];
    const sections=[...main?.children||[]].map(x=>x.classList?.[0]||'');
    const stage=main?.querySelector('#table-stage');
    const setup=main?.querySelector('.squatch-setup-grid');
    const controls=stage?.querySelector('.squatch-shot-row');
    const shoot=controls?.querySelector('#shoot,#caroms-shoot,#cut-shoot');
    const setupTitle=main?.querySelector('.squatch-game-setup > .squatch-section-title');
    const setupGrid=main?.querySelector('.squatch-game-setup > .squatch-setup-grid');
    const setupOrder=!!setupTitle&&!!setupGrid&&
      setupTitle.compareDocumentPosition(setupGrid)&Node.DOCUMENT_POSITION_FOLLOWING;
    const rulebook=main?.querySelector('.squatch-game-rules .squatch-rulebook');
    const rulesUniform=!!rulebook&&!rulebook.open&&
      rulebook.querySelector('summary')?.textContent==='Explore full house rules, examples & controls';
    const nav=[...document.querySelectorAll('.squatch-header-nav a')];
    const navRects=nav.map(x=>x.getBoundingClientRect());
    const dimensions=navRects.every(r=>Math.abs(r.height-navRects[0].height)<2);
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const unique=new Set(ids).size===ids.length;
    const styles=shoot?getComputedStyle(shoot):null;
    const visible=Boolean(shoot&&shoot.getBoundingClientRect().width>0&&styles?.visibility!=='hidden');
    const ok=JSON.stringify(sections)===JSON.stringify(expected)&&!!stage&&!!setup&&
      !!controls&&visible&&dimensions&&unique&&!!setupOrder&&rulesUniform&&
      main?.dataset.squatchGameShell&&errors.length===0;
    document.documentElement.dataset.squatchSmoke=ok?'pass':'fail';
    document.documentElement.dataset.squatchSmokeDetails=JSON.stringify({
      sections,game:main?.dataset.squatchGameShell,hasStage:!!stage,hasSetup:!!setup,
      hasControls:!!controls,buttonVisible:visible,navEqualHeights:dimensions,
      setupHeadingBeforeFields:!!setupOrder,canonicalRules:rulesUniform,
      duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i),errors
    });
   }catch(e){document.documentElement.dataset.squatchSmoke='fail';
     document.documentElement.dataset.squatchSmokeDetails=String(e?.stack||e);}
  },450);
 });
})();
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const reqPath=new URL(req.url,'http://localhost').pathname;
  if(reqPath.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end('{}');return;}
  const rel=reqPath==='/'?'index.html':decodeURIComponent(reqPath).replace(/^\/+/, '');
  const path=resolve(root,rel.endsWith('/')?rel+'index.html':rel);
  if(!path.startsWith(root+'/')&&!path.startsWith(root+'\\')){
   res.writeHead(403);res.end();return;
  }
  let bytes=await readFile(path);
  if(extname(path)==='.html'){
   let html=bytes.toString('utf8');
   html=html.replace(/<head>/i,m=>m+probe);
   bytes=Buffer.from(html);
  }
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream',
    'cache-control':'no-store'});res.end(bytes);
 }catch(e){res.writeHead(404);res.end(String(e.code||e.message));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const outputDir=process.env.SQUATCH_SCREENSHOT_DIR||join(tmpdir(),'squatch-shell-smoke');
mkdirSync(outputDir,{recursive:true});
async function browse(game,width,height){
 const url='http://127.0.0.1:'+port+'/'+game+'.html';
 const image=join(outputDir,game+'-'+width+'.png');
 const argv=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--disable-features=TranslateUI','--window-size='+width+','+height,
  '--virtual-time-budget=2500','--screenshot='+image,'--dump-dom',url];
 const browser=spawn(exe,argv,{stdio:['ignore','pipe','pipe']});
 let html='',stderr='';
 browser.stdout.on('data',data=>{html+=data;});
 browser.stderr.on('data',data=>{stderr+=data;});
 const result=await Promise.race([
  new Promise(resolve=>browser.on('exit',(code,signal)=>resolve({code,signal}))),
  new Promise(resolve=>setTimeout(()=>{browser.kill('SIGKILL');resolve({timeout:true});},25000))
 ]);
 const match=html.match(/data-squatch-smoke="([^"]+)"/);
 const details=html.match(/data-squatch-smoke-details="([^"]+)"/);
 if(result.timeout||result.code!==0||match?.[1]!=='pass'){
  throw new Error(game+' '+width+'px: '+JSON.stringify(result)+
   ' smoke='+match?.[1]+' details='+details?.[1]+' stderr='+stderr.slice(-500));
 }
 console.log('PASS',game,width+'x'+height,'one shared page / controls / unique IDs / script startup');
}
try{
 for(const game of games)await browse(game,1180,900);
 for(const game of games)await browse(game,390,844);
 console.log('Shared game shell: 12 actual Chromium page loads passed.');
}finally{await new Promise(resolve=>server.close(resolve));}
