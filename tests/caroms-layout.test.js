import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../caroms.html',import.meta.url),'utf8');
test('rules appear first and collapsible panels are balanced',()=>{
 assert.ok(html.indexOf('id="caroms-rules-panel"')<html.indexOf('id="caroms-setup-panel"'));
 assert.ok(html.indexOf('id="caroms-rules-panel"')<html.indexOf('id="caroms-table"'));
 assert.equal(html.split('<details').length,html.split('</details>').length);
 for(const id of ['caroms-rules-panel','caroms-setup-panel','caroms-shot-panel','caroms-history-panel'])
  assert.match(html,new RegExp('id="'+id+'"'));
});
test('all controller IDs remain unique and shot/call controls accessible',()=>{
 const ids=[...html.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['caroms-new','caroms-size','caroms-level-0','caroms-level-1','caroms-table','caroms-shoot','caroms-call-controls','caroms-undo','caroms-log'])
  assert.ok(ids.includes(id),id);
 assert.match(html,/id="caroms-shot-panel"[^>]*open|open id="caroms-shot-panel"/);
});
