import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameSession} from '../src/game-session.js';
import {attachShotAnnouncer} from '../src/shot-announcer.js';

function fakeStage() {
  let banner;
  const stage = {
    ownerDocument: {
      createElement() {
        const visible = new Set();
        banner = {
          className: '',
          textContent: '',
          attributes: {},
          classList: {
            add(name) { visible.add(name); },
            remove(name) { visible.delete(name); },
            contains(name) { return visible.has(name); },
          },
          setAttribute(name, value) { this.attributes[name] = value; },
          get offsetWidth() { return 200; },
          remove() { this.removed = true; },
        };
        return banner;
      },
    },
    appendChild(node) { assert.equal(node, banner); },
  };
  return {stage, get banner() { return banner; }};
}

test('Tuna announces a settled session ruling once, not a shot launch', () => {
  const dom = fakeStage();
  const game = createGameSession({
    game: 'tuna',
    adjudicate: () => ({
      legal: false, foul: true, pocketed: [], points: 0,
      nextPlayer: 1, ballInHand: true, rackEnd: false,
      announcement: 'Scratch! Player 2 has ball in hand.', actions: {},
    }),
  });
  const dispose = attachShotAnnouncer(game, dom.stage);
  game.startRack();
  assert.equal(dom.banner.attributes['aria-live'], 'polite');
  assert.equal(dom.banner.textContent, '');
  assert.equal(game.startShot('shot-1'), true);
  assert.equal(dom.banner.textContent, '', 'no ruling before physics settles');
  const ruling = game.resolveShot({shotId: 'shot-1', context: {}});
  assert.equal(dom.banner.textContent, ruling.announcement);
  assert.equal(dom.banner.classList.contains('is-visible'), true);
  game.resolveShot({shotId: 'shot-1', context: {}});
  assert.equal(dom.banner.textContent, ruling.announcement);
  dispose();
  assert.equal(dom.banner.removed, true);
});

test('new rulings replace the banner, fade away and unsubscribe on dispose', async () => {
  const dom = fakeStage();
  const game = createGameSession({
    game: 'tuna',
    adjudicate: context => ({
      legal: true, foul: false, pocketed: [], points: 0,
      nextPlayer: 0, ballInHand: false, rackEnd: false,
      announcement: context.announcement, actions: {},
    }),
  });
  const dispose = attachShotAnnouncer(game, dom.stage, {holdMs: 5});
  game.startRack();
  game.startShot('shot-1');
  game.resolveShot({shotId: 'shot-1', context: {announcement: 'First shot'}});
  game.settle();
  game.startShot('shot-2');
  game.resolveShot({shotId: 'shot-2', context: {announcement: 'Second shot'}});
  assert.equal(dom.banner.textContent, 'Second shot');
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(dom.banner.classList.contains('is-visible'), false);
  dispose();
  game.startRack();
  game.startShot('shot-3');
  game.resolveShot({shotId: 'shot-3', context: {announcement: 'After unmount'}});
  assert.equal(dom.banner.textContent, 'Second shot');
});
