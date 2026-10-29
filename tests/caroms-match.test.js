import test from 'node:test';
import assert from 'node:assert/strict';
import {caromsBreaker} from '../src/caroms-match.js';

test('best-of-three Caroms alternates breakers across completed racks',()=>{
 assert.equal(caromsBreaker([0,0]),0,'first rack: Player 1');
 assert.equal(caromsBreaker([1,0]),1,'second rack: Player 2 after Player 1 win');
 assert.equal(caromsBreaker([0,1]),1,'second rack: Player 2 after Player 2 win');
 assert.equal(caromsBreaker([1,1]),0,'deciding rack: Player 1');
 assert.equal(caromsBreaker([2,0]),0,'completed match is reset by New match');
});
test('only completed rack wins affect the next breaker',()=>{
 const wins=[0,0];
 assert.equal(caromsBreaker(wins),0);
 assert.equal(caromsBreaker(wins),0,'New rack mid-rack must not skip a breaker');
 wins[1]++;
 assert.equal(caromsBreaker(wins),1);
});
test('reject malformed scoreboards rather than silently choosing a breaker',()=>{
 for(const bad of [null,[],[0],[0,1,2],[-1,0],[0,0.5],['1',0]])
  assert.throws(()=>caromsBreaker(bad),RangeError);
});
