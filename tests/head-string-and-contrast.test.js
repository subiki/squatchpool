import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTableRenderer} from '../src/table-renderer.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function fakeCanvas(){
 const calls=[];
 const ctx={
  save(){calls.push(['save']);},restore(){calls.push(['restore']);},
  fillRect(...x){calls.push(['fillRect',...x]);},
  setLineDash(...x){calls.push(['dash',...x]);},
  beginPath(){calls.push(['beginPath']);},
  moveTo(...x){calls.push(['moveTo',...x]);},
  lineTo(...x){calls.push(['lineTo',...x]);},
  stroke(){calls.push(['stroke']);},
  fillText(...x){calls.push(['label',...x]);}
 };
 return {ctx,calls};
}
const table={width:1000,height:500,radius:14};
const renderer=createTableRenderer({table,pockets:[],cushions:[],renderPocket:()=>{}});
test('shared regulation head string shows the same kitchen on every table size',()=>{
 for(const width of [1000,1200,1420]){
  table.width=width;
  const {ctx,calls}=fakeCanvas();
  renderer.drawHeadString(ctx,{active:true});
  const x=14+(width-28)/4;
  assert.deepEqual(calls.find(x=>x[0]==='moveTo'),['moveTo',x,14]);
  assert.deepEqual(calls.find(x=>x[0]==='lineTo'),['lineTo',x,486]);
  assert.deepEqual(calls.find(x=>x[0]==='fillRect'),['fillRect',28,28,x-28,444]);
  assert.match(calls.find(x=>x[0]==='label')?.[1],/BREAK.*KITCHEN/);
 }
});
test('regular shots cannot be mistaken for pre-break kitchen positioning',()=>{
 const hidden=fakeCanvas();renderer.drawHeadString(hidden.ctx);
 assert.equal(hidden.calls.length,0);
 const subtle=fakeCanvas();renderer.drawHeadString(subtle.ctx,{persistent:true});
 assert.equal(subtle.calls.some(x=>x[0]==='fillRect'),false);
 assert.equal(subtle.calls.some(x=>x[0]==='label'),false);
});
test('all five original games invoke the common visible break guide',()=>{
 const butWait=read('src/game.js');
 const cutthroat=read('src/cutthroat-game.js');
 const press=read('src/press-your-luck-game.js');
 const tuna=read('src/tuna-game.js');
 const caroms=read('src/caroms-game.js');
 assert.match(butWait,/renderer\.drawHeadString\(ctx,\{active:state\.isBreak/);
 assert.match(cutthroat,/renderer\.drawHeadString\(ctx,\{active:session\.breakShot/);
 assert.match(press,/renderer\.drawTable\(ctx,balls,\{breakSetup:shot\.breakShot/);
 assert.match(tuna,/renderer\.drawTable\(ctx,balls,\{breakSetup:shot\.breakShot/);
 assert.match(caroms,/renderer\.drawHeadString\(ctx,\{active:state\.breakShot/);
 assert.match(caroms,/1-BALL BREAK/);
 assert.doesNotMatch(butWait,/ctx\.setLineDash\(\[6,9\]\)/,'But Wait must not redraw its own old head string');
});
function luminance(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
 .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
 const aL=luminance(a),bL=luminance(b);
 return (Math.max(aL,bL)+.05)/(Math.min(aL,bL)+.05);
}
test('readable ink-on-paper surfaces and selected controls meet AA text contrast',()=>{
 for(const [fg,bg] of [
  ['#102923','#f7f5ec'],['#405b4a','#f7f5ec'],
  ['#102923','#e6ede7'],['#102923','#f0c478'],
  ['#102923','#a4cc99'],['#f7f5ec','#14513d']
 ]){
  assert.ok(contrast(fg,bg)>=4.5,fg+' on '+bg+' = '+contrast(fg,bg).toFixed(2));
 }
});
test('contrast theme wins over old green/white controls, preserves fullscreen and native PWA',()=>{
 const css=read('src/pnw-theme.css');
 for(const selector of ['body .intro','body .table-size-pick[aria-pressed="true"]',
  'body .match .game-stats','body .table-stage .kit-primary input[type=range]',
  'body .table-stage:fullscreen','body .game-rules-layout .rules-card']){
  assert.ok(css.includes(selector),selector+' should be themed');
 }
 assert.match(css,/--pnw-paper:#f7f5ec/);
 assert.match(css,/--pnw-ink:#102923/);
 assert.match(css,/\.table-stage canvas\{box-shadow:none!important\}/);
 const pwa=read('src/pwa.js');
 assert.doesNotMatch(pwa,/beforeinstallprompt|Install game/);
});
