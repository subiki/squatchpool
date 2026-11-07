import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachShotKeyboard} from '../src/shot-keyboard.js';

for(const game of ['press-your-luck','tuna']){
 test(game+' uses the shared keyboard shortcut for shot and aim',()=>{
  const source=readFileSync(new URL('../src/'+game+'-game.js',import.meta.url),'utf8');
  assert.match(source,/cleanups\.push\(attachShotKeyboard\(globalThis\.window/);
  assert.match(source,/getPhase:\(\)=>shot\.phase,isHumanTurn:\(\)=>!isBotTurn\(\)/);
  assert.match(source,/shoot:\(\)=>fire\(\),nudgeAim:delta=>\{angle\+=delta;\}/);
 });
}
test('Space shoots once without scrolling; arrows nudge aim, but not native form controls',()=>{
 let listener,shots=0,aim=0,phase='aim',human=true,removed=false;
 const win={addEventListener(name,fn){assert.equal(name,'keydown');listener=fn;},
  removeEventListener(name,fn){removed=name==='keydown'&&fn===listener;}};
 const dispose=attachShotKeyboard(win,{getPhase:()=>phase,isHumanTurn:()=>human,
  shoot:()=>{shots++;phase='moving';},nudgeAim:delta=>{aim+=delta;}});
 const send=(tagName='BODY',code='Space',key=' ',extra={})=>{
  const event={target:{tagName,isContentEditable:false},code,key,repeat:false,
   preventDefault(){this.prevented=true;},...extra};
  listener(event);return Boolean(event.prevented);
 };
 for(const tag of ['BUTTON','INPUT','SELECT','TEXTAREA','A','SUMMARY','DIV']){
  assert.equal(send(tag),false,tag+' keeps native Space behavior');
 }
 assert.equal(send('BODY','Space',' ',{target:{tagName:'DIV',isContentEditable:true}}),false);
 for(const modifier of ['ctrlKey','metaKey','altKey','shiftKey','defaultPrevented'])
  assert.equal(send('BODY','Space',' ',{[modifier]:true}),false,modifier);
 assert.equal(shots,0);
 assert.equal(send('BODY','ArrowLeft','ArrowLeft'),true);
 assert.ok(aim<0);
 const oldAim=aim;
 assert.equal(send('INPUT','ArrowRight','ArrowRight'),false);
 assert.equal(aim,oldAim);
 assert.equal(send('BODY'),true,'Space must prevent scroll on page background');
 assert.equal(shots,1,'one strike fired');
 assert.equal(send('BODY','Space',' ',{repeat:true}),true,'auto-repeat while moving stays scroll-free');
 assert.equal(shots,1,'repeats cannot start a second shot');
 phase='aim';human=false;
 assert.equal(send('BODY'),false,'no human keyboard shot on bot turn');
 assert.equal(shots,1);
 human=true;phase='place';
 assert.equal(send('BODY'),false,'Space does not bypass cue placement');
 phase='aim';
 assert.equal(send('CANVAS'),true,'focused table fires another shot');
 assert.equal(shots,2);
 dispose();assert.equal(removed,true,'listener removed on SPA navigation');
});
