import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planBotShot} from '../src/bot-shot-planner.js';
import {tunaTargets,tunaCanWin} from '../src/tuna-rules.js';

const pockets=[{id:'TL',x:0,y:0},{id:'TR',x:400,y:0},{id:'BR',x:400,y:200}];
const table={width:400,height:200};
const balls=()=>[
 {id:0,x:40,y:100},
 ...Array.from({length:15},(_,i)=>({id:i+1,x:130+(i%5)*34,y:45+Math.floor(i/5)*48,pocketed:false})),
];

test('Tuna bot aims only at the lowest live ball in either sequence',()=>{
 const state=balls();
 assert.deepEqual(tunaTargets(state),[1,11]);
 const snapshot=JSON.stringify(state);
 const plan=planBotShot({balls:state,targets:tunaTargets(state),pockets,radius:5,table});
 assert.ok(plan);
 assert.ok([1,11].includes(plan.ballId));
 assert.ok(pockets.some(p=>p.id===plan.pocketId));
 assert.ok(Number.isFinite(plan.angle));
 assert.equal(JSON.stringify(state),snapshot,'planner never teleports or changes balls');
 state.find(b=>b.id===1).pocketed=true;
 state.find(b=>b.id===11).pocketed=true;
 assert.deepEqual(tunaTargets(state),[2,12]);
 const next=planBotShot({balls:state,targets:tunaTargets(state),pockets,radius:5,table});
 assert.ok([2,12].includes(next.ballId));
});

test('Tuna bot can legally target the 10 only after the nine and second sequence clear',()=>{
 const state=balls();
 for(let id=1;id<=9;id++)state.find(b=>b.id===id).pocketed=true;
 for(let id=11;id<=15;id++)state.find(b=>b.id===id).pocketed=true;
 assert.deepEqual(tunaTargets(state),[10]);
 assert.equal(tunaCanWin(state),true);
 const plan=planBotShot({balls:state,targets:tunaTargets(state),pockets,radius:5,table});
 assert.equal(plan.ballId,10);
});

test('Tuna bot integration uses shared physical shot path and cancels stale turns',()=>{
 const controller=readFileSync(new URL('../src/tuna-game.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../tuna.html',import.meta.url),'utf8');
 assert.match(page,/id="opponent"[\s\S]*?value="bot"/);
 assert.match(controller,/const targets=tunaTargets\(balls\)/);
 assert.match(controller,/planBotShot\(/);
 assert.match(controller,/updateCallHint\(\);fire\(true\)/);
 assert.match(controller,/function fire\(bot=false\)/);
 assert.match(controller,/shot\.startShot\(statsShotId\)/);
 assert.match(controller,/function cancelBot\(\)\{botGeneration\+\+/);
 assert.match(controller,/if\(generation!==botGeneration\|\|!isBotTurn\(\)\)return/);
});
