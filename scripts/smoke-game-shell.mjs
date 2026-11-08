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
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const games=['but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];
const probe=`<script>
(()=>{
 const wantsRock=new URLSearchParams(location.search).has('smokeRock');
 const wantsBots=new URLSearchParams(location.search).has('smokeBots');
 if(wantsBots&&location.pathname.includes('cutthroat'))
  try{localStorage.setItem('squatch-cutthroat-player-count','0');}catch{}
 if(wantsRock)try{localStorage.setItem('squatchpool-visual-mode','rock');}catch{}
 const errors=[];
 const fail=e=>{errors.push(String(e?.message||e?.reason||e||'unknown'));};
 window.addEventListener('error',fail);
 window.addEventListener('unhandledrejection',fail);
 window.addEventListener('DOMContentLoaded',()=>{
  if(new URLSearchParams(location.search).get('smokeNavigate')==='caroms'){
   const originalHeader=document.querySelector('squatch-header');
   setTimeout(()=>{
    document.querySelector('.squatch-header-nav a[href="/caroms.html"]')?.click();
   },350);
   setTimeout(()=>{
    const main=document.querySelector('main');
    const shared=document.head.querySelector('link[data-squatch-shared-styles]');
    const pageStyles=[...document.head.querySelectorAll('[data-page-style]')];
    const inOrder=Boolean(shared&&pageStyles.length>0&&pageStyles.every(node=>
      Boolean(node.compareDocumentPosition(shared)&Node.DOCUMENT_POSITION_FOLLOWING)));
    const rules=main?.querySelector('.squatch-rulebook>summary');
    const ruleFont=rules?getComputedStyle(rules).fontFamily:'missing';
    const ok=Boolean(main?.dataset.squatchGameShell==='caroms'&&
      document.querySelector('squatch-header')===originalHeader&&
      document.querySelectorAll('link[data-squatch-shared-styles]').length===1&&
      inOrder&&document.documentElement.dataset.squatchTheme==='rock'&&
      ruleFont.includes('system-ui'));
    document.documentElement.dataset.squatchSoftNav=ok?'pass':'fail';
    document.documentElement.dataset.squatchSoftNavDetails=JSON.stringify({
      game:main?.dataset.squatchGameShell,headerKept:document.querySelector('squatch-header')===originalHeader,
      pageStyleCount:pageStyles.length,inOrder,ruleFont,errors
    });
   },2200);
  }
  if(location.pathname==='/'&&wantsRock)setTimeout(()=>{
   // Check real computed layout, not just the presence of illustrated assets.
   const hero=document.querySelector('.hub-intro');
   const logo=hero?.querySelector('.rock-hero-wordmark');
   const heading=hero?.querySelector('h2');
   const cta=hero?.querySelector('.hub-hero-cta');
   const cards=[...document.querySelectorAll('.hub-game')];
   const box=el=>el?.getBoundingClientRect();
   const h=box(hero),l=box(logo),t=box(heading),a=box(cta);
   const heroOK=Boolean(h&&l&&t&&a&&
    getComputedStyle(logo).display!=='none'&&
    Math.abs((l.left+l.right-t.left-t.right)/2)<8&&
    l.bottom+3<t.top&&a.bottom<h.bottom-9&&t.left>=h.left&&t.right<=h.right);
   const metrics=cards.map(card=>{
    const r=box(card),title=card.querySelector('h3'),n=box(title);
    const artHeight=parseFloat(getComputedStyle(card,'::before').height);
    const aligned=Boolean(r&&n&&
     n.top>=r.top+artHeight-8&&n.left>=r.left-4&&n.right<=r.right+4&&
     title.scrollWidth<=title.clientWidth+2&&title.scrollHeight<=title.clientHeight+2);
    return {name:title?.textContent,top:r?.top,titleTop:n?.top,aligned};
   });
   const sameRow=metrics.every(x=>metrics.every(y=>
     Math.abs(x.top-y.top)>3||Math.abs(x.titleTop-y.titleTop)<3));
   const ok=heroOK&&cards.length===5&&metrics.every(x=>x.aligned)&&sameRow;
   document.documentElement.dataset.squatchHomeAlignment=ok?'pass':'fail';
   document.documentElement.dataset.squatchHomeDetails=JSON.stringify({
    heroOK,logoBottom:l?.bottom,titleTop:t?.top,heroBottom:h?.bottom,
    cards:metrics,sameRow
   });
  },1000);
  if(wantsBots){
   // Let each route's module register its controller and change handler first.
   setTimeout(()=>{
    const selected=document.querySelector('main')?.dataset.squatchGameShell;
    const seat=document.getElementById(selected==='cutthroat'?'cut-players':'mode');
    // Cutthroat restores its persisted choice at startup; But Wait toggles here.
    if(seat&&selected!=='cutthroat'){
     seat.value='bots';seat.dispatchEvent(new Event('change',{bubbles:true}));
    }
   },100);
   setTimeout(()=>{
    const stage=document.querySelector('#table-stage');
    document.documentElement.dataset.squatchBotPreview=
      stage?.dataset.squatchBotPlanning==='true'?'pass':'fail';
   },1850);
  }
  setTimeout(()=>{
   try {
    const main=document.querySelector('main');
    const expected=['squatch-page-hero','squatch-game-setup','squatch-game-rules',
                    'squatch-game-play','squatch-game-after'];
    const sections=[...main?.children||[]].map(x=>x.classList?.[0]||'');
    const stage=main?.querySelector('#table-stage');
    const canvas=stage?.querySelector('canvas');
    const canvasRect=canvas?.getBoundingClientRect(),stageRect=stage?.getBoundingClientRect();
    const canvasFits=!!canvasRect&&canvasRect.width>0&&canvasRect.left>=stageRect.left-1&&
      canvasRect.right<=stageRect.right+1;
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
    const appearanceOK=!wantsRock || (document.documentElement.dataset.squatchTheme==='rock' &&
      !document.getElementById('squatch-rock-style')?.disabled);
    const header=document.querySelector('squatch-header .squatch-unified-header');
    const wordmark=header?.querySelector('.squatch-brand-row .brand-mark');
    const themeButtons=[...header?.querySelectorAll('.squatch-theme-switch button')||[]];
    const themeRects=themeButtons.map(b=>b.getBoundingClientRect());
    const markRect=wordmark?.getBoundingClientRect();
    const headerLayoutOK=!wantsRock||window.innerWidth>760||Boolean(
      header&&markRect&&themeRects.length===2&&
      themeRects.every(rect=>rect.width>=70&&rect.height>=40&&rect.top>markRect.bottom-1)&&
      themeRects[0].right<=themeRects[1].left+1
    );
    const hero=main?.querySelector(':scope > .squatch-page-hero');
    const gameId=main?.dataset.squatchGameShell;
    const artNames={
      'but-wait':'rock-but-wait-theres-more.webp',
      caroms:'rock-caroms.webp',cutthroat:'rock-cutthroat.webp',
      'press-your-luck':'rock-press-your-luck.webp',
      tuna:'rock-tuna.webp',arcade:'rock-assassin.webp'
    };
    const heroImg=hero?getComputedStyle(hero,'::before').backgroundImage:'';
    const title=hero?.querySelector('.squatch-page-title');
    const hr=hero?.getBoundingClientRect(),tr=title?.getBoundingClientRect();
    const rockPageOK=!wantsRock || Boolean(
      hero&&title&&artNames[gameId]&&heroImg.includes(artNames[gameId])&&
      getComputedStyle(hero).borderTopWidth!=='0px'&&
      tr&&hr&&tr.width>0&&tr.height>0&&tr.left>=hr.left-2&&tr.right<=hr.right+2&&
      main?.querySelectorAll(':scope > .squatch-game-setup, :scope > .squatch-game-rules, :scope > .squatch-game-play').length===3
    );
    const wronglyVisibleHidden=[...main.querySelectorAll('[hidden]')]
      .filter(node=>getComputedStyle(node).display!=='none');
    const spectatorOK=!wantsBots||(
      !!main?.querySelector('#table-stage .squatch-bot-showtime')&&
      !main.querySelector('#table-stage .squatch-bot-showtime').hidden
    );
    const aimChoices=[...main?.querySelectorAll('.squatch-aim-mode')||[]];
    const aimOK=aimChoices.length===4&&
      aimChoices.filter(btn=>btn.getAttribute('aria-pressed')==='true').length===1&&
      !!main?.querySelector('#table-stage .squatch-aim-assist');
    // Comparable computed typography/control metrics for every game, in each
    // appearance mode and viewport. Decorative art may differ; this UI may not.
    const styleOf=selector=>{
      const el=main?.querySelector(selector);
      if(!el)return null;
      const cs=getComputedStyle(el);
      return [
        cs.fontFamily,cs.fontSize,cs.fontWeight,cs.lineHeight,
        cs.borderTopLeftRadius,cs.minHeight
      ];
    };
    const fingerprint={
      title:styleOf('.squatch-page-title'),
      section:styleOf('.squatch-section-title'),
      setting:styleOf('.squatch-setting select'),
      rules:styleOf('.squatch-rulebook > summary'),
      aim:styleOf('.squatch-aim-mode'),
      shot:styleOf('.squatch-shot-row #shoot, .squatch-shot-row #caroms-shoot, .squatch-shot-row #cut-shoot')
    };
    document.documentElement.dataset.squatchStyleFingerprint=
      encodeURIComponent(JSON.stringify(fingerprint));
    const styles=shoot?getComputedStyle(shoot):null;
    const visible=Boolean(shoot&&shoot.getBoundingClientRect().width>0&&styles?.visibility!=='hidden');
    const ok=appearanceOK&&rockPageOK&&headerLayoutOK&&JSON.stringify(sections)===JSON.stringify(expected)&&!!stage&&!!setup&&
      !!controls&&visible&&canvasFits&&dimensions&&unique&&wronglyVisibleHidden.length===0&&
      !!setupOrder&&rulesUniform&&aimOK&&spectatorOK&&
      main?.dataset.squatchGameShell&&errors.length===0;
    if(location.search.includes('smokeScroll=table')&&stage){
      // Headless Chrome's --screenshot after scrollIntoView can capture a
      // blank compositor frame. Keep real game/table nodes and computed CSS,
      // but hide the header/preceding panels in this SCREENSHOT-ONLY probe.
      document.querySelector('squatch-header')?.style.setProperty('display','none','important');
      for(const panel of [...main.children]){
        if(!panel.classList.contains('squatch-game-play'))
          panel.style.setProperty('display','none','important');
      }
      window.scrollTo(0,0);
    }
    document.documentElement.dataset.squatchSmoke=ok?'pass':'fail';
    document.documentElement.dataset.squatchSmokeDetails=JSON.stringify({
      sections,game:main?.dataset.squatchGameShell,hasStage:!!stage,hasSetup:!!setup,
      hasControls:!!controls,buttonVisible:visible,canvasFits,navEqualHeights:dimensions,
      setupHeadingBeforeFields:!!setupOrder,canonicalRules:rulesUniform,aimOK,spectatorOK,
      duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i),appearanceOK,rockPageOK,headerLayoutOK,heroImg,
      wronglyVisibleHidden:wronglyVisibleHidden.map(x=>x.id||x.className),errors
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
const sharedStyleFingerprints=new Map();
function assertConsistentUI(game,width,theme,html){
 const encoded=html.match(/data-squatch-style-fingerprint="([^"]+)"/)?.[1];
 if(!encoded)throw Error(game+': computed UI style fingerprint missing');
 const current=JSON.parse(decodeURIComponent(encoded));
 const key=theme+'-'+width;
 if(!sharedStyleFingerprints.has(key)){
  sharedStyleFingerprints.set(key,{game,metrics:current});
  return;
 }
 const base=sharedStyleFingerprints.get(key);
 for(const [component,signature] of Object.entries(current)){
  const expected=base.metrics[component];
  if(!signature||!expected||JSON.stringify(signature)!==JSON.stringify(expected))
   throw Error('UI drift in '+theme+' at '+width+'px: '+component+
    ' '+game+' = '+JSON.stringify(signature)+'; '+base.game+' = '+
    JSON.stringify(expected));
 }
}
async function browse(game,width,height,focus='top',theme='classic',spectator=false){
 const params=new URLSearchParams();
 if(focus==='table')params.set('smokeScroll','table');
 if(theme==='rock')params.set('smokeRock','1');
 if(spectator)params.set('smokeBots','1');
 const url='http://127.0.0.1:'+port+'/'+game+'.html'+(params.size?'?'+params:'');
 const image=join(outputDir,game+'-'+width+(focus==='table'?'-table':'')+(theme==='rock'?'-rock':'')+(spectator?'-bots':'')+'.png');
 const argv=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--disable-features=TranslateUI','--window-size='+width+','+height,
  '--virtual-time-budget='+(spectator?2600:2500),'--screenshot='+image,'--dump-dom',url];
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
 if(result.timeout||result.code!==0||match?.[1]!=='pass'||
    (spectator&&!html.includes('data-squatch-bot-preview="pass"'))){
  throw new Error(game+' '+width+'px: '+JSON.stringify(result)+
   ' smoke='+match?.[1]+' details='+details?.[1]+' stderr='+stderr.slice(-500));
 }
 if(focus==='top'&&!spectator)assertConsistentUI(game,width,theme,html);
 console.log('PASS',game,width+'x'+height,focus,theme,'shared page / controls / typography / startup');
}

async function browseRockHome(width,height){
 const url='http://127.0.0.1:'+port+'/?smokeRock=1';
 const image=join(outputDir,'home-'+width+'-rock.png');
 const argv=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--window-size='+width+','+height,'--virtual-time-budget=3200',
  '--screenshot='+image,'--dump-dom',url];
 const browser=spawn(exe,argv,{stdio:['ignore','pipe','pipe']});
 let html='',stderr='';
 browser.stdout.on('data',chunk=>{html+=chunk;});
 browser.stderr.on('data',chunk=>{stderr+=chunk;});
 const result=await Promise.race([
  new Promise(resolve=>browser.on('exit',code=>resolve({code}))),
  new Promise(resolve=>setTimeout(()=>{browser.kill('SIGKILL');resolve({timeout:true});},25000))
 ]);
 const loaded=html.includes('data-squatch-theme="rock"')&&
  html.includes('class="rock-hero-wordmark"')&&html.includes('class="hub-game"');
 const aligned=html.includes('data-squatch-home-alignment="pass"');
 if(result.timeout||result.code!==0||!loaded||!aligned){
  const details=html.match(/data-squatch-home-details="([^"]+)"/)?.[1];
  throw new Error('Rock homepage '+width+'px: '+JSON.stringify(result)+
   ' hero/cards ready='+loaded+' alignment='+aligned+' '+details+' stderr='+stderr.slice(-500));
 }
 console.log('PASS Rock homepage',width+'x'+height,'artwork / logo / title strips / card alignment');
}
async function browseSoftNavigation(){
 const url='http://127.0.0.1:'+port+'/?smokeRock=1&smokeNavigate=caroms';
 const image=join(outputDir,'spa-caroms-rock-390.png');
 const args=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
   '--no-first-run','--disable-extensions','--disable-background-networking',
   '--window-size=390,844','--virtual-time-budget=3500',
   '--screenshot='+image,'--dump-dom',url];
 const browser=spawn(exe,args,{stdio:['ignore','pipe','pipe']});
 let html='',stderr='';
 browser.stdout.on('data',chunk=>{html+=chunk;});
 browser.stderr.on('data',chunk=>{stderr+=chunk;});
 const result=await Promise.race([
  new Promise(resolve=>browser.on('exit',code=>resolve({code}))),
  new Promise(resolve=>setTimeout(()=>{browser.kill('SIGKILL');resolve({timeout:true});},25000))
 ]);
 if(result.timeout||result.code!==0||!html.includes('data-squatch-soft-nav="pass"')){
  const details=html.match(/data-squatch-soft-nav-details="([^"]+)"/)?.[1];
  throw Error('Soft navigation CSS/order/header mismatch: '+JSON.stringify(result)+
    ' details='+details+' stderr='+stderr.slice(-600));
 }
 console.log('PASS home → caroms Rock soft navigation: same header and CSS cascade');
}
try{
 await browseSoftNavigation();
 await browseRockHome(1180,1200);
 await browseRockHome(930,1000);
 await browseRockHome(390,900);
 for(const game of games)await browse(game,1180,900);
 for(const game of games)await browse(game,390,844);
 for(const game of games)await browse(game,390,844,'table');
 for(const game of games)await browse(game,390,844,'top','rock');
 for(const game of games)await browse(game,1180,900,'top','rock');
 await browse('but-wait',390,844,'table','rock',true);
 await browse('cutthroat',390,844,'table','rock',true);
 console.log('Shared game shell: 35 Chromium page loads passed (12 Classic top, six Classic table, six Rock mobile, six Rock desktop, two bot previews).');
}finally{await new Promise(resolve=>server.close(resolve));}
