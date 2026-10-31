import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../but-wait.html',import.meta.url),'utf8');
const controller=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');

test('But Wait keeps break, called shots, stash and spin inside fullscreen table',()=>{
 const stage=html.indexOf('id="table-stage"');
 const announcer=html.indexOf('class="announcer"');
 assert.ok(stage>0&&announcer>stage);
 const section=html.slice(stage,announcer);
 for(const id of ['table','pocket-targets','stash-panel','stash-solid','stash-stripe',
  'stash-confirm','power','shoot','invert-aim','kit-fullscreen','move-cue',
  'but-wait-more','call-panel','call-ball-status','call-pocket-status',
  'undo-call','ball-picks','spin-top','spin-side','control-hint']){
  assert.ok(section.includes('id="'+id+'"'),id+' must remain usable in fullscreen');
 }
 assert.ok(section.indexOf('id="table"')<section.indexOf('id="shoot"'));
 assert.ok(section.indexOf('id="shoot"')<section.indexOf('id="but-wait-more"'));
 assert.match(html,/src="\.\/src\/table-kit\.js"/);
 assert.match(html,/<details class="kit-more" id="but-wait-more">/);
 assert.match(controller,/!state\.isBreak&&human\(state\.turn\)&&!callReady\(\)\)\$\('#but-wait-more'\)\.open=true/);
});

test('But Wait preserves unique controller IDs and collapsed shot history',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.match(html,/<details class="rules-card log-card"><summary>Shot history/);
 assert.equal(html.split('<details').length,html.split('</details>').length);
 assert.match(html,/:fullscreen \.table-frame/);
});
