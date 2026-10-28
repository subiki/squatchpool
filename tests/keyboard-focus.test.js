import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Run the real browser keyboard handler in isolation. This caught a user-visible
// regression: Space on a focused Undo/New rack button fired a shot and prevented
// native button activation. Preserve keyboard aiming from the table/background.
for (const [name,path] of [
 ['Caroms','src/caroms-game.js'],
 ['But Wait','src/game.js'],
]) {
 test(name+' respects focused controls without disabling table shortcuts',()=>{
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const handler=source.match(/window\.addEventListener\('keydown',e=>\{[\s\S]*?\n\}\);/);
  assert.ok(handler,'actual browser keyboard listener exists');
  let onKey=null,shots=0;
  const state={phase:'aim',turn:0,angle:0};
  const window={addEventListener(type,fn){if(type==='keydown')onKey=fn;}};
  if(name==='Caroms')new Function('window','state','hit',handler[0])(
   window,state,()=>{shots++;});
  else new Function('window','state','human','hit',handler[0])(
   window,state,()=>true,()=>{shots++;});
  assert.equal(typeof onKey,'function');
  function press(tagName,code='Space',key=' ',extra={}){
   let prevented=false;
   onKey({target:{tagName,isContentEditable:false},code,key,
    preventDefault(){prevented=true;},...extra});
   return prevented;
  }
  for(const tag of ['BUTTON','A','INPUT','SELECT','TEXTAREA','SUMMARY','DIV']){
   const previous=shots;
   assert.equal(press(tag),false,tag+' should retain native Space behavior');
   assert.equal(shots,previous,tag+' must not fire the cue');
  }
  const beforeEditable=shots;
  assert.equal(press('DIV','Space',' ',{target:{tagName:'DIV',isContentEditable:true}}),false);
  assert.equal(shots,beforeEditable,'contenteditable must not shoot');
  for(const modifier of ['ctrlKey','metaKey','altKey','defaultPrevented']){
   const previous=shots;
   assert.equal(press('BODY','Space',' ',{[modifier]:true}),false);
   assert.equal(shots,previous,modifier+' Space must not shoot');
  }
  assert.equal(press('BODY'),true,'Space on page background shoots');
  assert.equal(press('CANVAS'),true,'Space on focused table shoots');
  assert.equal(shots,2);
  const angle=state.angle;
  assert.equal(press('BODY','ArrowLeft','ArrowLeft'),true);
  assert.ok(state.angle<angle,'ArrowLeft on background aims');
  const after=state.angle;
  assert.equal(press('BUTTON','ArrowLeft','ArrowLeft'),false);
  assert.equal(state.angle,after,'focused button does not aim');
  state.phase='moving';
  assert.equal(press('BODY'),false,'moving balls cannot be struck again');
  assert.equal(shots,2);
 });
}
