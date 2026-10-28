import test from 'node:test';
import assert from 'node:assert/strict';
import {ball,fullRack} from '../src/physics.js';
import {CUTTHROAT_GROUPS,cutthroatGroupCounts,cutthroatShot,caromRailAfterContact,pressYourLuckScore} from '../src/squatch-modes.js';

test('full rack contains one cue and all fifteen object balls',()=>{
 const ids=fullRack().map(b=>b.id).sort((a,b)=>a-b);
 assert.deepEqual(ids,Array.from({length:16},(_,i)=>i));
});
test('cutthroat counts only surviving balls in each group',()=>{
 const balls=Array.from({length:16},(_,i)=>ball(i,0,0));
 balls.find(b=>b.id===3).pocketed=true;
 assert.deepEqual(cutthroatGroupCounts(balls),[4,5,5]);
 assert.equal(CUTTHROAT_GROUPS.length,3);
});
test('cutthroat own ball may count toward continuing a turn',()=>{
 const balls=Array.from({length:16},(_,i)=>ball(i,0,0));
 assert.equal(cutthroatShot({balls,owners:[0,1,2],shooter:0,pocketed:[1],firstContact:1}).keepTurn,true);
});
test('caroms requires rail AFTER cue contact',()=>{
 assert.equal(caromRailAfterContact([{type:'rail',ballId:1},{type:'contact',balls:[1,0]}],1),false);
 assert.equal(caromRailAfterContact([{type:'contact',balls:[1,0]},{type:'rail',ballId:0}],1),true);
});
test('Press Your Luck banking and forfeiture',()=>{
 assert.deepEqual(pressYourLuckScore({opponentBalls:3,eightMade:true,eightBanked:true}),{pending:3,banked:10,forfeited:0});
 assert.deepEqual(pressYourLuckScore({opponentBalls:3}),{pending:3,banked:0,forfeited:3});
 assert.throws(()=>pressYourLuckScore({eightBanked:true}));
});
