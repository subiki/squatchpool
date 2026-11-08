/**
 * One spectator strip for every Squatch Bot turn. Planning and the shot
 * are deliberately separate so players can inspect ghost-ball geometry.
 * No physics or rules are simulated here; the game still executes its shot.
 */
export function createBotShowtime(root){
 const stage=root?.querySelector?.('#table-stage');
 const doc=stage?.ownerDocument;
 const kit=stage?.querySelector?.('.table-kit');
 let timer=null,preview=null,paused=false,spectator=false,disposed=false;
 let panel=null,status=null,pauseButton=null,stepButton=null;
 if(doc?.createElement&&kit){
  panel=doc.createElement('div');
  panel.className='squatch-bot-showtime';
  panel.hidden=true;
  panel.setAttribute('role','group');
  panel.setAttribute('aria-label','Squatch Bot spectator controls');
  status=doc.createElement('span');
  status.className='squatch-bot-plan';
  status.setAttribute('role','status');
  status.textContent='Bots are ready to play';
  pauseButton=doc.createElement('button');
  pauseButton.type='button';pauseButton.className='squatch-bot-pause';
  pauseButton.textContent='⏸ Pause bots';
  stepButton=doc.createElement('button');
  stepButton.type='button';stepButton.className='squatch-bot-step';
  stepButton.textContent='▶ Take shot';stepButton.disabled=true;
  const notes=doc.createElement('details');
  notes.className='squatch-observer-notes';
  const summary=doc.createElement('summary');summary.textContent='✎ My rule and aiming notes';
  const note=doc.createElement('textarea');
  note.setAttribute('aria-label','Private spectator notes for this game');
  note.setAttribute('rows','4');
  note.setAttribute('placeholder','Write down rules questions, the bot’s planned shot, or a strange ruling…');
  const gameId=root?.querySelector?.('main')?.dataset?.squatchGameShell||
    root?.dataset?.squatchGameShell||doc.location?.pathname||'pool';
  const notesKey='squatch-bot-notes-'+gameId;
  try{note.value=globalThis.localStorage?.getItem(notesKey)||'';}catch{}
  note.addEventListener('input',()=>{
   try{globalThis.localStorage?.setItem(notesKey,note.value);}catch{}
  });
  const copy=doc.createElement('button');copy.type='button';copy.textContent='Copy notes';
  copy.addEventListener('click',async()=>{
   try{if(!globalThis.navigator?.clipboard?.writeText)throw new Error('clipboard unavailable');
    await globalThis.navigator.clipboard.writeText(note.value);
    copy.textContent='Copied';}
   catch{copy.textContent='Select the text to copy';note.select?.();}
  });
  notes.append(summary,note,copy);
  panel.append(status,pauseButton,stepButton,notes);
  kit.prepend(panel);
  pauseButton.addEventListener('click',()=>setPaused(!paused));
  stepButton.addEventListener('click',()=>fire());
 }
 function resetTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
 function visibility(){
  if(!panel)return;
  panel.hidden=!spectator&&!preview;
  if(pauseButton){
   pauseButton.textContent=paused?'▶ Resume bots':'⏸ Pause bots';
   pauseButton.setAttribute('aria-pressed',String(paused));
  }
  if(stepButton)stepButton.disabled=!preview;
  if(!preview&&status)status.textContent=spectator?
   'Spectator mode · all seats are Squatch Bots. Watch each shot and review the logs.':'';
 }
 function fire(){
  resetTimer();
  const action=preview;preview=null;
  if(stage?.dataset)delete stage.dataset.squatchBotPlanning;
  visibility();
  if(action?.valid?.()!==false&&!disposed)action?.shoot?.();
 }
 function arm(){
  resetTimer();
  if(!preview||paused||disposed)return;
  timer=setTimeout(fire,preview.delay);
 }
 function setPaused(next){
  if(disposed)return;
  paused=Boolean(next);
  visibility();
  if(paused)resetTimer();else arm();
 }
 function show({label,shoot,valid=()=>true,delay=1900}={}){
  if(disposed)return;
  // Controller test doubles have no visual stage; do not add a fake delay.
  if(!panel){if(valid())shoot?.();return;}
  resetTimer();
  preview={shoot,valid,delay};
  if(stage?.dataset)stage.dataset.squatchBotPlanning='true';
  if(status)status.textContent=label||'Squatch Bot is studying the angle…';
  visibility();arm();
 }
 function cancel(){
  resetTimer();preview=null;
  if(stage?.dataset)delete stage.dataset.squatchBotPlanning;
  visibility();
 }
 function setSpectator(enabled){
  spectator=Boolean(enabled);visibility();
 }
 function dispose(){cancel();disposed=true;panel?.remove?.();}
 return {show,cancel,setSpectator,setPaused,dispose,get pending(){return preview!==null},
  get paused(){return paused}};
}
