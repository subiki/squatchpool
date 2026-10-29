import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startCutthroat, assignCutthroatGroup, finishCutthroatShot,
  resolveCutthroatClaim, remainingCutthroatBalls
} from '../src/cutthroat-rules.js';

// Source: archive.html Episode 4, technical rules and the Speed/Jim/Hud
// narrative. A scratch transfers ownership of an existing ball on the felt;
// pocketed balls stay down even on fouls.

test('group selection is earned by a legal pocket, not before the break', () => {
  const initial = startCutthroat();
  assert.throws(() => assignCutthroatGroup(initial, 0, 1),
    'the breaker cannot pre-select a group before pocketing legally');
  const afterPot = finishCutthroatShot(initial, {pocketed: [6]});
  const assigned = assignCutthroatGroup(afterPot, 0, 1);
  assert.equal(assigned.owners[0], 1);
});

test('Episode 4: third player can claim scratcher\'s ball still on the felt', () => {
  const initial = {
    ...startCutthroat(), owners: [1, 0, 2], turn: 0,
    // Speed owns 6-10; 6 and 7 were pocketed earlier, 10 remains on felt.
    // Hud has been eliminated, but can return by claiming the 10.
    pocketed: [6, 7, 11, 12, 13, 14, 15]
  };
  const scratched = finishCutthroatShot(initial, {scratch: true});
  assert.equal(scratched.turn, 1, 'Jim receives the next turn');
  assert.equal(scratched.pendingClaim.claimant, 2, 'Hud gets the claim');
  assert.deepEqual(scratched.pendingClaim.returnable, [8, 9, 10],
    'only scratcher-owned balls still on the felt are claimable');
  assert.throws(() => resolveCutthroatClaim(scratched, 6),
    'already-pocketed 6 cannot be resurrected');
  const revived = resolveCutthroatClaim(scratched, 10);
  assert.deepEqual(revived.pocketed, initial.pocketed,
    'claim changes ownership; it never re-spots a pocketed ball');
  assert.deepEqual(remainingCutthroatBalls(revived, 1), [8, 9]);
  assert.deepEqual(remainingCutthroatBalls(revived, 2), [10]);
  assert.equal(revived.turn, 1, 'the claim does not steal Jim\'s shot');
});

test('an eliminated player waits for a claim instead of receiving a dead turn', () => {
  const initial = {
    ...startCutthroat(), owners: [1, 0, 2], turn: 1,
    pocketed: [11, 12, 13, 14, 15]
  };
  const missed = finishCutthroatShot(initial);
  assert.equal(missed.turn, 0,
    'Hud has no balls, so play passes from Jim to Speed');
});

test('group choice expires on a miss and fouled pots do not earn a group', () => {
  let match=finishCutthroatShot(startCutthroat(), {pocketed:[6]});
  match=finishCutthroatShot(match);
  assert.throws(()=>assignCutthroatGroup(match,0,1));
  const fouled=finishCutthroatShot(startCutthroat(), {pocketed:[6],foul:true});
  assert.throws(()=>assignCutthroatGroup(fouled,0,1));
});

test('last on-felt ball claim eliminates scratcher without resurrecting balls', () => {
  let match={...startCutthroat(),owners:[0,1,2],turn:0,
    pocketed:[1,2,3,4,6,7,8,9,10]};
  match=finishCutthroatShot(match,{scratch:true});
  assert.deepEqual(match.pendingClaim.returnable,[5]);
  assert.equal(match.pendingClaim.claimant,2);
  match=resolveCutthroatClaim(match,5);
  assert.deepEqual(match.pocketed,[1,2,3,4,6,7,8,9,10]);
  assert.equal(remainingCutthroatBalls(match,0).length,0);
  assert.ok(remainingCutthroatBalls(match,2).includes(5));
  assert.equal(match.winner,2);
});
