import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TABLE} from '../src/physics.js';

const html=readFileSync(new URL('../press-your-luck.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');
test('Press Your Luck page exposes match, cue placement, 8 call/undo, spin and scoring',()=>{
 for(const id of ['pyl-table','pyl-target','pyl-size','pyl-new-match','pyl-next',
  'pyl-turn','pyl-score','pyl-status','pyl-place','pyl-reposition','pyl-shoot',
  'pyl-eight-panel','pyl-pockets','pyl-undo','pyl-bank',
  'pyl-power','pyl-top','pyl-side','pyl-log','pyl-stats-game'])
  assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 for(const id of ['TL','TM','TR','BL','BM','BR'])
  assert.match(html,new RegExp('data-pocket="'+id+'"'));
 assert.match(source,/pressTurn\(/);
 assert.match(source,/fullRack\(/);
 assert.match(source,/step\(game\.balls,1\/120\)/);
 assert.match(source,/game\.power=68;game\.top=0;game\.side=0/);
 assert.match(source,/game\.phase='placeBreak'/);
});

// Real controller smoke was exercised with an isolated DOM/physics harness,
// but a true browser and Cloudflare preview remain mandatory release gates.
