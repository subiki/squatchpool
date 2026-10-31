import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSurpriseChoice,readyForStash,readyForEight,adjudicate} from '../src/rules.js';

const onTable=(ids)=>ids.map(id=>({id,pocketed:false}));
test('opponent can return their own stripe first without blocking the solid shooter eight',()=>{
 const solids=onTable([0,8,9,15]);
 assert.equal(readyForStash(onTable([0,8,9]),'solids',false),true);
 const choice=resolveSurpriseChoice([7,15],{solids:false,stripes:false},'solids',15);
 assert.deepEqual(choice.heldBalls,[7]);
 assert.equal(choice.deployed.solids,true);
 assert.equal(choice.deployed.stripes,false);
 assert.equal(readyForEight(solids,'solids',choice.deployed.solids),true);
 const legal=adjudicate({balls:solids,shooter:0,groups:['solids','stripes'],
  deployed:choice.deployed,pocketed:[8],firstContact:8,breakShot:false,
  preShotReadyForEight:true,calledBall:8,calledPocket:'TR',
  pocketEvents:[{id:8,pocketId:'TR'}]});
 assert.equal(legal.winner,0,'returned opponent stripe cannot invalidate a legal called eight');
});
test('returning shooter solid first requires pocketing it, then remaining stripe can be chosen',()=>{
 const first=resolveSurpriseChoice([7,15],{solids:false,stripes:false},'solids',7);
 assert.deepEqual(first.heldBalls,[15]);
 assert.equal(readyForEight(onTable([0,7,8]),'solids',first.deployed.solids),false);
 assert.equal(readyForEight(onTable([0,8]),'solids',first.deployed.solids),true);
 assert.equal(readyForStash(onTable([0,8]),'stripes',first.deployed.stripes),true);
 const second=resolveSurpriseChoice(first.heldBalls,first.deployed,'stripes',15);
 assert.deepEqual(second.heldBalls,[]);
 assert.equal(readyForEight(onTable([0,15,8]),'stripes',second.deployed.stripes),false);
 assert.equal(readyForEight(onTable([0,8]),'stripes',second.deployed.stripes),true);
 assert.equal(resolveSurpriseChoice(second.heldBalls,second.deployed,'solids',7),null);
});
test('only held balls can be chosen, each shooter surprise resolves once',()=>{
 const state={solids:false,stripes:false};
 assert.equal(resolveSurpriseChoice([7,15],state,'solids',8),null);
 assert.equal(resolveSurpriseChoice([7,15],state,'unknown',7),null);
 const first=resolveSurpriseChoice([7,15],state,'solids',15);
 assert.equal(resolveSurpriseChoice(first.heldBalls,first.deployed,'solids',7),null);
 assert.equal(resolveSurpriseChoice(first.heldBalls,first.deployed,'stripes',15),null);
 assert.deepEqual(state,{solids:false,stripes:false},'do not mutate original state');
});
