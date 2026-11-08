/**
 * Canonical Squatch Pool game-page composition.
 *
 * Legacy game adapters own only their named controls and table/HUD markup.
 * The shared shell owns the page hierarchy, player/table setup, rulebook,
 * playable area, auxiliary panels and shot-control arrangement. Nodes are
 * MOVED, never cloned: all controller IDs, events, canvas and state survive.
 *
 * Applied at controller mount (direct load and SPA route transitions) before
 * controller listeners are installed. No CSS or layout belongs in this file.
 */
export const GAME_PAGE_CONFIG=Object.freeze({
 'but-wait':{
  title:"But Wait, There's More",eyebrow:"THE FIRST GAME · THE 4T'S",
  intro:"Classic called-pocket 8-ball with a surprise: two hidden balls let your opponent change the table just before your 8.",
  players:'mode',size:null,extras:[],selectLabel:'Players',sizeLabel:'Table size'
 },
 caroms:{
  title:'Caroms · Whacky Pool',eyebrow:"THE ORIGINAL GAMES · THE 4T'S",
  intro:'Shoot an object ball into the white ball first. A legal carom changes everything about your angles.',
  players:'caroms-mode',size:'caroms-size',
  extras:[['caroms-level-0','Player 1 skill'],['caroms-level-1','Player 2 skill']],
  selectLabel:'Players',sizeLabel:'Table size'
 },
 cutthroat:{
  title:'Coin-Op Cutthroat',eyebrow:"THE ORIGINAL GAMES · THE 4T'S",
  intro:'Three players, blue, yellow and red. Protect your color, eliminate the others, and watch for scratch claims.',
  players:'cut-players',size:'cut-size',extras:[],
  selectLabel:'Players',sizeLabel:'Table size'
 },
 'press-your-luck':{
  title:'Press Your Luck',eyebrow:"THE ORIGINAL GAMES · THE 4T'S",
  intro:'Pocket your group, then gamble on your opponent’s balls to build a bigger rack score before the called 8.',
  players:'opponent',size:'size',extras:[['target','Target score']],
  selectLabel:'Players',sizeLabel:'Table size'
 },
 tuna:{
  title:'Big Tuna Casserole',eyebrow:"THE ORIGINAL GAMES · THE 4T'S",
  intro:'Two independent lowest-ball sequences, three scoring balls and a winning 10. Plan every shot.',
  players:'opponent',size:'size',extras:[],
  selectLabel:'Players',sizeLabel:'Table size'
 },
 arcade:{
  title:'The First Corner · Arcade Lab',eyebrow:"THE 4T'S · POINTS-ONLY ARCADE",
  intro:'Sink the 1-ball in the top-left pocket within three shots. Practice free or play for imaginary Squatch Points.',
  players:null,size:null,extras:[],
  selectLabel:'Players',sizeLabel:'Table size'
 }
});

function make(doc,tag,className,text){
 const node=doc.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function addSetting(doc,grid,labelText,control){
 if(!control)return;
 const wrap=make(doc,'div','squatch-setting');
 const label=make(doc,'label','squatch-setting-label');
 const name=make(doc,'span','squatch-setting-name',labelText);
 label.append(name,control);
 wrap.append(label);grid.append(wrap);
 return wrap;
}
function addReadonlySetting(doc,grid,label,value){
 const wrap=make(doc,'div','squatch-setting');
 const title=make(doc,'span','squatch-setting-name',label);
 const text=make(doc,'span','squatch-setting-static',value);
 wrap.append(title,text);grid.append(wrap);
}
function byId(main,id){return id?main.querySelector('#'+id):null;}
function moveSetup(main,doc,config,setup,gameId){
 const grid=make(doc,'div','squatch-setup-grid');
 const player=byId(main,config.players);
 if(player)addSetting(doc,grid,config.selectLabel,player);
 else addReadonlySetting(doc,grid,config.selectLabel,'Solo challenge');
 let size=byId(main,config.size);
 if(gameId==='but-wait'){
  // The original buttons are a private adapter until the gameplay engine
  // itself uses a select. Only the standard select is visible to players.
  size=make(doc,'select','squatch-size-select');
  size.id='squatch-size';
  size.setAttribute('aria-label','Table size');
  for(const [value,label] of [['7','7 ft · Bar · 78 × 39 in'],
                             ['8','8 ft · Home · 88 × 44 in'],
                             ['9','9 ft · Pro · 100 × 50 in']]){
   const opt=make(doc,'option','',label);opt.value=value;size.append(opt);
  }
  const buttons=main.querySelector('.table-size-buttons');
  const chosen=buttons?.querySelector('.table-size-pick.selected')?.dataset.size;
  try{size.value=globalThis.localStorage?.getItem('squatch-table-size')||chosen||'7';}
  catch{size.value=chosen||'7';}
  if(buttons){
   buttons.classList.add('squatch-legacy-size');
   buttons.hidden=true;buttons.setAttribute('aria-hidden','true');
   setup.append(buttons);
   size.addEventListener('change',()=>{
    buttons.querySelector('[data-size="'+size.value+'"]')?.click();
   });
  }
 }
 if(size&&gameId!=='but-wait'){
  for(const opt of size.options||[]){
   const labels={'7':'7 ft · Bar · 78 × 39 in','8':'8 ft · Home · 88 × 44 in',
                 '9':'9 ft · Pro · 100 × 50 in'};
   if(labels[opt.value])opt.textContent=labels[opt.value];
  }
 }
 if(size)addSetting(doc,grid,config.sizeLabel,size);
 else addReadonlySetting(doc,grid,config.sizeLabel,'7 ft · Fixed challenge');
 for(const [id,label] of config.extras){
  const extra=byId(main,id);
  if(extra)addSetting(doc,grid,label,extra);
 }
 setup.prepend(grid);
}
function normalizeKit(main,doc){
 const kit=main.querySelector('#table-stage .table-kit');
 const primary=kit?.querySelector('.kit-primary');
 if(!primary||primary.dataset.squatchNormalized)return;
 primary.dataset.squatchNormalized='true';
 const more=primary.querySelector(':scope > .kit-more');
 if(more)primary.after(more);
 const power=primary.querySelector('.kit-power');
 const striker=primary.querySelector('.kit-striker');
 const shoot=primary.querySelector('#shoot, #caroms-shoot, #cut-shoot');
 const aimInput=primary.querySelector('#invert-aim');
 const aim=aimInput?.closest('label')||aimInput;
 const fullscreen=primary.querySelector('#kit-fullscreen');
 const row=make(doc,'div','squatch-shot-row');
 const utilities=make(doc,'div','squatch-shot-actions');
 if(striker)row.append(striker);
 if(power)row.append(power);
 if(shoot)row.append(shoot);
 for(const id of ['cut-place','cut-reposition','place','break-reposition',
                  'move-cue','undo-call']){
  const item=primary.querySelector('#'+id);
  if(item)utilities.append(item);
 }
 if(aim)utilities.append(aim);
 if(fullscreen)utilities.append(fullscreen);
 const remainder=[...primary.children];
 primary.replaceChildren(row,utilities,...remainder);
}
function clearOriginalIntro(main,gameId,hero){
 if(gameId==='but-wait'){
  main.querySelector(':scope > .intro')?.remove();
  main.querySelector(':scope > .grain')?.remove();
 }else if(gameId==='arcade'){
  const original=main.querySelector(':scope > .arcade-heading');
  const dynamic=original?.querySelector('#rules-summary');
  if(dynamic){dynamic.classList.add('squatch-dynamic-intro');hero.append(dynamic);}
  original?.remove();
 }else{
  const heading=main.querySelector(':scope > h1, :scope > h2');
  const next=heading?.nextElementSibling;
  heading?.remove();
  if(next?.matches('p, p.notice'))next.remove();
 }
 const extraHeading=main.querySelector(':scope > .gameplay-heading');
 extraHeading?.remove();
}
function buildHero(doc,config){
 const hero=make(doc,'section','squatch-page-hero');
 hero.setAttribute('aria-label','Game introduction');
 hero.append(make(doc,'p','squatch-page-eyebrow',config.eyebrow),
             make(doc,'h2','squatch-page-title',config.title),
             make(doc,'p','squatch-page-lead',config.intro));
 return hero;
}
/** Compose exactly the same five outer slots across every game route. */
export function prepareGamePage(root=globalThis.document,gameId){
 const config=GAME_PAGE_CONFIG[gameId];
 if(!config||!root?.querySelector)return false;
 const main=root.matches?.('main')?root:root.querySelector('main');
 if(!main||typeof main.querySelector!=='function'||!main.ownerDocument||
    main.dataset?.squatchGameShell===gameId)return false;
 const stage=main.querySelector('#table-stage');
 if(!stage||!main.ownerDocument)return false; // fast no-op for unit DOM mocks
 const doc=main.ownerDocument;
 // Rebuild the shot-controls layout while the stage is still in the source tree.
 normalizeKit(main,doc);
 const hero=buildHero(doc,config);
 const setup=make(doc,'section','squatch-game-setup');
 setup.setAttribute('aria-label','Match setup');
 setup.append(make(doc,'h3','squatch-section-title','Set up your game'));
 // All selects/inputs move into the same setup renderer with stable IDs.
 moveSetup(main,doc,config,setup,gameId);
 const rules=make(doc,'section','squatch-game-rules');
 rules.setAttribute('aria-label','How to play');
 rules.append(make(doc,'h3','squatch-section-title','How to play'));
 const ruleContent=main.querySelector('.game-rules-layout');
 if(ruleContent)rules.append(ruleContent);
 const quickstart=main.querySelector('.quickstart');
 if(quickstart)rules.append(quickstart);
 const play=make(doc,'section','squatch-game-play');
 play.setAttribute('aria-label','Play pool');
 play.append(make(doc,'h3','squatch-section-title','At the table'));
 const extras=make(doc,'section','squatch-game-after');
 extras.setAttribute('aria-label','Game details and history');
 if(gameId==='but-wait'){
  const match=main.querySelector(':scope > .match');
  if(match){
   // Align But Wait status placement with the other four HUD layouts.
   const stats=match.querySelector('.game-stats');
   const score=match.querySelector('.scoreboard');
   if(score)stage.prepend(score);
   if(stats)stage.insertBefore(stats,score?.nextSibling||stage.firstChild);
   play.append(match);
  }else play.append(stage);
 }else if(gameId==='arcade'){
  const balance=main.querySelector(':scope > .arcade-accounts');
  const choice=main.querySelector(':scope > .arcade-entry');
  const meta=main.querySelector(':scope > .arcade-table-meta');
  if(choice)setup.append(choice);
  if(balance)play.append(balance);
  if(meta)play.append(meta);
  const status=main.querySelector(':scope > #status');
  if(status)play.append(status);
  play.append(stage);
  const arcadeInfo=main.querySelector('.arcade-instructions');
  if(arcadeInfo)rules.append(arcadeInfo);
 }else{
  const anchor=main.querySelector('#caroms-play-anchor');
  if(anchor)play.append(anchor);
  play.append(stage);
 }
 clearOriginalIntro(main,gameId,hero);
 if(gameId==='caroms')main.querySelector(':scope > #caroms-setup-panel')?.remove();
 // Remove the old layout-only setup wrapper, after moving all controls.
 if(gameId==='cutthroat')main.querySelector(':scope > .controls')?.remove();
 if(gameId==='press-your-luck'||gameId==='tuna')main.querySelector(':scope > section.controls')?.remove();
 // Preserve shot history, in-game modals, notes, and future game-specific
 // extensions. Append them after the shared table slot; never discard nodes.
 extras.append(...[...main.childNodes]);
 main.classList.add('squatch-game-page');
 main.dataset.squatchGameShell=gameId;
 main.replaceChildren(hero,setup,rules,play,extras);
 return true;
}
