import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../caroms.html',import.meta.url),'utf8');

test('Caroms is playable before optional instructions and lore',()=>{
 const at=id=>html.indexOf('id="'+id+'"');
 const table=at('caroms-table');
 assert.ok(table>0,'the real game canvas is present');
 for(const id of ['caroms-new','caroms-turn','caroms-score','caroms-status','caroms-stats-game','caroms-stats-site'])
  assert.ok(at(id)>0&&at(id)<table,id+' must appear before the table');
 for(const id of ['caroms-call-controls','caroms-shot-panel','caroms-shoot','caroms-rules-panel','caroms-story-panel'])
  assert.ok(at(id)>table,id+' must follow the playable table');
 assert.match(html,/<p class="notice">\s*<strong>Play Caroms:/);
 assert.match(html,/@media\(max-width:650px\)/);
 assert.match(html,/#caroms-shoot\{position:fixed/);
 assert.equal(html.split('<details').length,html.split('</details>').length,
  'all collapsible panels must close');
 for(const id of ['caroms-rules-panel','caroms-setup-panel','caroms-shot-panel','caroms-history-panel'])
  assert.match(html,new RegExp('id="'+id+'"'));
});

test('all controller IDs remain unique and call/shot controls are accessible',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'duplicate IDs break controller lookups');
 for(const id of ['caroms-new','caroms-size','caroms-level-0','caroms-level-1',
  'caroms-table','caroms-shoot','caroms-call-controls','caroms-undo','caroms-log',
  'caroms-pocket-TL','caroms-pocket-TM','caroms-pocket-TR',
  'caroms-pocket-BL','caroms-pocket-BM','caroms-pocket-BR'])
  assert.ok(ids.includes(id),id);
 assert.match(html,/<details[^>]*\bopen\b[^>]*id="caroms-shot-panel"/);
 assert.match(html,/id="caroms-call-controls" hidden/);
});

test('original story remains intact but collapsed after the game',()=>{
 const table=html.indexOf('id="caroms-table"');
 const rules=html.indexOf('id="caroms-rules-panel"');
 const story=html.indexOf('id="caroms-story-panel"');
 assert.ok(table<rules&&rules<story,'optional content must not block play');
 const tag=html.match(/<details[^>]*id="caroms-story-panel"[^>]*>/)?.[0];
 assert.ok(tag&&!/\bopen\b/.test(tag),'story must be closed by default');
 assert.match(html,/Optional original story/);
 assert.match(html,/href="#caroms-play-anchor"/);
 assert.match(html,/id="caroms-play-anchor"/);
 assert.match(html,/archive.html#episode-3/);
 assert.match(html,/tap to expand/);
});
