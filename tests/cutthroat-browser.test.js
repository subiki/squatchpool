import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE,pockets,fullRack,step,shotSpeed} from '../src/physics.js';
import {setTableSize} from '../src/table-geometry.js';

const html=readFileSync(new URL('../cutthroat.html',import.meta.url),'utf8');
const controller=readFileSync(new URL('../src/cutthroat-game.js',import.meta.url),'utf8');

test('Cutthroat browser page wires three-seat match, group choice and scratch claim controls',()=>{
 for(const id of ['cut-table','cut-turn','cut-scores','cut-status','cut-new','cut-size',
  'cut-place','cut-shoot','cut-group','cut-group-select','cut-group-confirm',
  'cut-claim','cut-claim-select','cut-claim-confirm','cut-power','cut-top','cut-side'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/src="\.\/src\/cutthroat-game\.js"/);
 assert.match(controller,/finishCutthroatShot\(/);
 assert.match(controller,/resolveCutthroatClaim\(/);
 assert.match(controller,/assignCutthroatGroup\(/);
 assert.match(controller,/requestAnimationFrame\(frame\)/);
 assert.match(controller,/step\(game\.balls,1\/120\)/);
 assert.match(controller,/game\.power=68;game\.top=0;game\.side=0/);
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
 const update=new Function('$','game','names','ranges','remainingCutthroatBalls',
  'availableGroups','Option',source[0].replace(/\nfunction finishShot\(\)$/,'')+
  '\nreturn update;')($,game,['Player 1','Player 2','Player 3'],
  ['1–5','6–10','11–15'],()=>[1],()=>[],
  class Option{constructor(text,value){this.text=text;this.value=value;}});
 update();
 assert.match($('cut-turn').textContent,/^Player 3 · scratch claim$/);
 assert.match($('cut-status').textContent,/Player 3 may claim.*Player 1/);
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
