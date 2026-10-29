import test from 'node:test';
import assert from 'node:assert/strict';
import {qualifyingBankOrKick} from '../src/press-your-luck-bank.js';
const contact={type:'contact',balls:[0,8]},eight={type:'pocket',ballId:8,pocketId:'TR'};
test('banked 8 requires rail after cue contact and before pocket',()=>{
 assert.equal(qualifyingBankOrKick([contact,{type:'rail',ballId:8},eight]),true);
 assert.equal(qualifyingBankOrKick([contact,eight,{type:'rail',ballId:8}]),false);
 assert.equal(qualifyingBankOrKick([{type:'rail',ballId:8},contact,eight]),false);
});
test('kicked cue requires rail before cue–8 contact',()=>{
 assert.equal(qualifyingBankOrKick([{type:'rail',ballId:0},contact,eight]),true);
 assert.equal(qualifyingBankOrKick([contact,{type:'rail',ballId:0},eight]),false);
});
test('no false doubles from unrelated rails, pocketless shots or missing contact',()=>{
 assert.equal(qualifyingBankOrKick([{type:'rail',ballId:9},contact,eight]),false);
 assert.equal(qualifyingBankOrKick([contact,{type:'rail',ballId:8}]),false);
 assert.equal(qualifyingBankOrKick([{type:'rail',ballId:8},eight]),false);
});
