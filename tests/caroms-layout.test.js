import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../caroms.html',import.meta.url),'utf8');

test('Caroms has concise rules before play, with optional panels after the table',()=>{
 const at=id=>html.indexOf('id="'+id+'"');
 const table=at('caroms-table');
 assert.ok(table>0,'the real game canvas is present');
 for(const id of ['caroms-new','caroms-turn','caroms-score','caroms-status','caroms-stats-game','caroms-stats-site'])
  assert.ok(at(id)>0&&at(id)<table,id+' must appear before the table');
 for(const id of ['caroms-call-controls','caroms-shot-panel','caroms-shoot','caroms-story-panel'])
  assert.ok(at(id)>table,id+' must follow the playable table');
 assert.ok(at('caroms-rules-panel')>0&&at('caroms-rules-panel')<table,'rules appear before gameplay without forcing an expanded panel');
 assert.match(html,/<p class="notice">\s*<strong>Play Caroms:/);
 assert.match(html,/@media\(max-width:650px\)/);
 assert.doesNotMatch(html,/#caroms-shoot\{position:fixed/);
 assert.match(html,/id="table-stage"/);
 assert.match(html,/id="kit-fullscreen"/);
 assert.match(html,/src="\/src\/table-kit.js"/);
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
 assert.match(html,/id="caroms-shot-panel" class="kit-options"/);
 assert.match(html,/id="caroms-more"/);
 assert.match(html,/id="caroms-call-controls" hidden/);
});

test('original story remains intact but collapsed after the game',()=>{
 const table=html.indexOf('id="caroms-table"');
 const rules=html.indexOf('id="caroms-rules-panel"');
 const story=html.indexOf('id="caroms-story-panel"');
 assert.ok(rules<table&&table<story,'source rules are available before the table; optional story follows gameplay');
 const tag=html.match(/<details[^>]*id="caroms-story-panel"[^>]*>/)?.[0];
 assert.ok(tag&&!/\bopen\b/.test(tag),'story must be closed by default');
 assert.match(html,/Optional original story/);
 assert.match(html,/href="#caroms-play-anchor"/);
 assert.match(html,/id="caroms-play-anchor"/);
 assert.match(html,/archive.html#episode-3/);
 assert.match(html,/tap to expand/);
});

test('Caroms keeps required actions inside the fullscreen table',()=>{
 const start=html.indexOf('id="table-stage"'),end=html.indexOf('id="caroms-history-panel"');
 const kit=html.indexOf('class="table-kit"',start);
 assert.ok(start>0&&kit>start&&end>kit);
 for(const id of ['caroms-turn','caroms-status','caroms-table','caroms-striker','caroms-power',
  'caroms-shoot','invert-aim','kit-fullscreen','caroms-more','caroms-option',
  'caroms-call-controls','caroms-undo','caroms-shot-panel']){
  const at=html.indexOf('id="'+id+'"');
  assert.ok(at>start&&at<end,id+' must be in fullscreen table stage');
 }
 assert.ok(html.indexOf('id="caroms-shoot"')>html.indexOf('id="caroms-table"'));
 assert.doesNotMatch(html,/<details[^>]*\bopen\b[^>]*id="caroms-more"/);
 const controller=readFileSync(new URL('../src/caroms-game.js',import.meta.url),'utf8');
 assert.ok(controller.includes("needCall&&canAim&&(!state.calledBall||!state.calledPocket)"));
 assert.ok(controller.includes("state.phase==='option'&&!isBot()"));
});
