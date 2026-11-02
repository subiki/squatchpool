import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,pockets,fullRack,step,shotSpeed} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';

const html=readFileSync(new URL('../cutthroat.html',import.meta.url),'utf8');
const controller=readFileSync(new URL('../src/cutthroat-game.js',import.meta.url),'utf8');

test('Cutthroat browser page wires three-seat match, group choice and scratch claim controls',()=>{
 for(const id of ['cut-table','cut-turn','cut-scores','cut-status','cut-new','cut-size',
  'cut-place','cut-reposition','cut-shoot','cut-group','cut-group-select','cut-group-confirm',
  'cut-claim','cut-claim-select','cut-claim-confirm','cut-power','cut-top','cut-side'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/import\('\.\/src\/cutthroat-game\.js'\)\.catch/,
  'Cutthroat uses a guarded dynamic module import so startup errors are visible');
 assert.match(html,/Cutthroat could not start:/,
  'startup failures must explain why the table did not load');
 assert.match(controller,/createGameSession\(/);
 assert.match(controller,/session\.startRack\(\)/);
 assert.match(controller,/session\.startShot\(shotId\)/);
 assert.match(controller,/session\.resolveShot\(/);
 assert.match(controller,/session\.settle\(/);
 assert.match(controller,/session\.confirmPlacement\(\)/);
 assert.match(controller,/adjudicateCutthroatShot/);
 assert.match(controller,/resolveCutthroatClaim\(/);
 assert.match(controller,/assignCutthroatGroup\(/);
 assert.match(controller,/requestAnimationFrame\(frame\)/);
 assert.match(controller,/step\(game\.balls,1\/120\)/);
 assert.match(controller,/game\.power=68;game\.top=0;game\.side=0/);
});

test('Cutthroat keeps the core shot kit and required decisions attached to the fullscreen table',()=>{
 assert.match(html,/id="table-stage"/);
 assert.match(html,/src\/table-kit\.js/);
 assert.match(html,/id="cut-options"/);
 assert.match(html,/<div class="kit-primary">[\s\S]*?id="cut-power"[\s\S]*?id="cut-shoot"[\s\S]*?id="invert-aim"[\s\S]*?id="kit-fullscreen"/);
 assert.doesNotMatch(html,/#cut-shoot\{position:fixed/,'shoot must not float over the felt on phones');
 const stage=html.slice(html.indexOf('id="table-stage"'),html.indexOf('<details><summary>Shot history'));
 for(const id of ['cut-group','cut-claim','cut-place','cut-reposition'])
  assert.ok(stage.includes('id="'+id+'"'),id+' must remain available inside fullscreen');
 assert.match(controller,/\$\('cut-options'\)\.open=true/,'required decisions must open the drawer');
});

test('regulation 7/8/9 ft Cutthroat racks retain 15 object balls and real physics',()=>{
 const dimensions={7:[78,39],8:[88,44],9:[100,50]};
 for(const size of [7,8,9]){
  setTableSize(size);
  assert.equal(TABLE.playingLengthIn,dimensions[size][0]);
  assert.equal(TABLE.playingWidthIn,dimensions[size][1]);
  assert.equal(TABLE.radius,11);
  assert.equal(pockets.length,6);
  const balls=fullRack();
  assert.equal(balls.length,16);
  assert.deepEqual(balls.map(b=>b.id).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));
  const before=balls.slice(1).map(b=>({x:b.x,y:b.y}));
  balls[0].vx=shotSpeed(85,true);
  for(let frame=0;frame<240;frame++)step(balls,1/120);
  assert.ok(balls.slice(1).some((b,i)=>b.pocketed||
   Math.hypot(b.x-before[i].x,b.y-before[i].y)>0.1),
   'the real break should move at least one object ball on '+size+' ft');
 }
 setTableSize(9);
});


test('Cutthroat scratch claim UI names the third-seat claimant, not the incoming shooter',()=>{
 const source=controller.match(/function update\(\)\{[\s\S]*?\n\}\nfunction finishShot\(\)/);
 assert.ok(source,'real Cutthroat UI update function exists');
 const nodes=new Map();
 const $=id=>{
  if(!nodes.has(id))nodes.set(id,{
   textContent:'',hidden:false,disabled:false,value:'',
   replaceChildren(...children){this.children=children;}
  });
  return nodes.get(id);
 };
 const game={phase:'claim',breakShot:false,power:68,top:0,side:0,placementValid:true,
  match:{turn:1,winner:null,owners:[0,1,2],pendingClaim:{
   claimant:2,scratcher:0,returnable:[4]},groupChoicePlayer:null}};
 const update=new Function('
  'availableGroups','Option',source[0].replace(/\nfunction finishShot\(\)$/,'')+
  '\nreturn update;')($,game,{breakShot:false},seat=>'Player '+(seat+1),()=>false,()=>{},
  ['1–5','6–10','11–15'],()=>[1],()=>[],
  class Option{constructor(text,value){this.text=text;this.value=value;}});
 update();
 assert.match($('cut-turn').textContent,/^Player 3 · scratch claim$/);
 assert.match($('cut-status').textContent,/Player 3 may claim.*Player 1/);
 assert.equal($('cut-options').open,true,'claim options automatically open');
 game.match.pendingClaim=null;
 game.phase='placeCue';
 update();
 assert.match($('cut-turn').textContent,/^Player 2 · place the white ball$/);
 game.match.turn=2;
 game.match.pendingClaim={claimant:0,scratcher:1,returnable:[8]};
 game.phase='claim';
 update();
 assert.match($('cut-turn').textContent,/^Player 1 · scratch claim$/);
 assert.match($('cut-status').textContent,/Player 1 may claim.*Player 2/);
});


test('Cutthroat break placement rejects out-of-kitchen taps and permits a fresh placement',()=>{
 const source=controller.match(/function placeCue\(p\)\{[\s\S]*?\n\}\nfunction draw\(\)/);
 assert.ok(source,'real Cutthroat placeCue handler exists');
 const cueBall={x:70,y:120};
 const game={phase:'placeBreak',balls:[cueBall],placementValid:false};
 let updates=0;
 const placeCue=new Function('game','kitchenPoint','headStringX','canPlaceBreakCue',
  'canPlace','cue','update',source[0].replace(/\nfunction draw\(\)$/,'')+'\nreturn placeCue;')(
  game,(x,y)=>({x:Math.max(44,Math.min(x,249)),y}),()=>250,
  (_balls,x,y)=>x>=44&&x<250&&y>=44&&y<=400,
  ()=>true,()=>cueBall,()=>updates++);
 placeCue({x:500,y:120});
 assert.equal(game.placementValid,false,'tapping beyond head string cannot confirm break');
 assert.deepEqual(cueBall,{x:70,y:120},'invalid tap cannot move cue');
 placeCue({x:130,y:140});
 assert.equal(game.placementValid,true);
 assert.deepEqual(cueBall,{x:130,y:140});
 assert.equal(updates,2);
 assert.match(controller,/placementValid:false/,'break requires an actual placement before confirmation');
 assert.match(controller,/game\.phase='placeBreak';game\.placementValid=false;update\(\)/,
  'reposition control returns to kitchen placement without firing a shot');
});
,'game','session','seatName','botSeat','scheduleBot','ranges','remainingCutthroatBalls',
  'availableGroups','Option',source[0].replace(/\nfunction finishShot\(\)$/,'')+
  '\nreturn update;')($,game,{breakShot:false},['Player 1','Player 2','Player 3'],
  ['1–5','6–10','11–15'],()=>[1],()=>[],
  class Option{constructor(text,value){this.text=text;this.value=value;}});
 update();
 assert.match($('cut-turn').textContent,/^Player 3 · scratch claim$/);
 assert.match($('cut-status').textContent,/Player 3 may claim.*Player 1/);
 assert.equal($('cut-options').open,true,'claim options automatically open');
 game.match.pendingClaim=null;
 game.phase='placeCue';
 update();
 assert.match($('cut-turn').textContent,/^Player 2 · place the white ball$/);
 game.match.turn=2;
 game.match.pendingClaim={claimant:0,scratcher:1,returnable:[8]};
 game.phase='claim';
 update();
 assert.match($('cut-turn').textContent,/^Player 1 · scratch claim$/);
 assert.match($('cut-status').textContent,/Player 1 may claim.*Player 2/);
});


test('Cutthroat break placement rejects out-of-kitchen taps and permits a fresh placement',()=>{
 const source=controller.match(/function placeCue\(p\)\{[\s\S]*?\n\}\nfunction draw\(\)/);
 assert.ok(source,'real Cutthroat placeCue handler exists');
 const cueBall={x:70,y:120};
 const game={phase:'placeBreak',balls:[cueBall],placementValid:false};
 let updates=0;
 const placeCue=new Function('game','kitchenPoint','headStringX','canPlaceBreakCue',
  'canPlace','cue','update',source[0].replace(/\nfunction draw\(\)$/,'')+'\nreturn placeCue;')(
  game,(x,y)=>({x:Math.max(44,Math.min(x,249)),y}),()=>250,
  (_balls,x,y)=>x>=44&&x<250&&y>=44&&y<=400,
  ()=>true,()=>cueBall,()=>updates++);
 placeCue({x:500,y:120});
 assert.equal(game.placementValid,false,'tapping beyond head string cannot confirm break');
 assert.deepEqual(cueBall,{x:70,y:120},'invalid tap cannot move cue');
 placeCue({x:130,y:140});
 assert.equal(game.placementValid,true);
 assert.deepEqual(cueBall,{x:130,y:140});
 assert.equal(updates,2);
 assert.match(controller,/placementValid:false/,'break requires an actual placement before confirmation');
 assert.match(controller,/game\.phase='placeBreak';game\.placementValid=false;update\(\)/,
  'reposition control returns to kitchen placement without firing a shot');
});

test('Cutthroat offers all legal solo/local seat counts and a physical, cancellable bot turn',()=>{
 assert.match(html,/id="cut-players"/);
 for(const value of ['1','2','3'])assert.match(html,new RegExp('<option value="'+value+'"'));
 assert.match(controller,/const botSeat=seat=>seat>=Number/);
 assert.match(controller,/planBotShot\(\{balls:game\.balls,targets,pockets,radius:TABLE\.radius,table:TABLE/);
 assert.match(controller,/shoot\(true\)/,'bot uses the real physics stroke path');
 assert.match(controller,/assignCutthroatGroup\(game\.match,chooser,group\)/);
 assert.match(controller,/resolveCutthroatClaim\(game\.match,id\)/);
 assert.match(controller,/function cancelBot\(\)\{botGeneration\+\+/);
 assert.match(controller,/\$\('cut-players'\)\.addEventListener\('change',newGame\)/);
 assert.doesNotMatch(controller,/\.click\(\)/,'bot must not impersonate a human clicking UI buttons');
});
