import test from 'node:test';
import assert from 'node:assert/strict';
import {startPressYourLuck,pressYourLuckShot} from '../src/press-your-luck-rules.js';
test('opponent balls accrue unbanked points',()=>{
 const s=pressYourLuckShot(startPressYourLuck(),{opponentBalls:3});
 assert.equal(s.unbanked,3);
 assert.equal(s.banked,0);
});
test('8 banks accumulated points plus two',()=>{
 const s=pressYourLuckShot(pressYourLuckShot(startPressYourLuck(),{opponentBalls:3}),{eightPocketed:true});
 assert.equal(s.banked,5);
 assert.equal(s.finished,true);
});
test('cushion-banked 8 doubles score',()=>{
 const s=pressYourLuckShot(pressYourLuckShot(startPressYourLuck(),{opponentBalls:3}),{eightPocketed:true,eightBanked:true});
 assert.equal(s.banked,10);
});
test('failure to get the 8 loses unbanked points',()=>{
 const s=pressYourLuckShot(pressYourLuckShot(startPressYourLuck(),{opponentBalls:4}),{forfeit:true});
 assert.equal(s.unbanked,0);
 assert.equal(s.banked,0);
 assert.equal(s.outcome,'forfeit');
});
test('invalid bank and double resolution are rejected',()=>{
 assert.throws(()=>pressYourLuckShot(startPressYourLuck(),{eightBanked:true}));
 assert.throws(()=>pressYourLuckShot(startPressYourLuck(),{opponentBalls:-1}));
 const s=pressYourLuckShot(startPressYourLuck(),{eightPocketed:true});
 assert.throws(()=>pressYourLuckShot(s,{eightPocketed:true}));
});
