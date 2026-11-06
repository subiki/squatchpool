import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pages=['index','but-wait','caroms','cutthroat','press-your-luck','tuna','arcade','rules','archive'];
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all Squatch pages use precisely one canonical header and data initializer',()=>{
 for(const name of pages){
  const html=read(name+'.html');
  assert.equal((html.match(/<squatch-header\b/g)||[]).length,1,name);
  assert.equal((html.match(/<header\s+class="squatch-unified-header"/g)||[]).length,0,name+' has duplicate header markup');
  assert.match(html,/<script src="\/src\/site-header\.js"><\/script>/,name);
  assert.match(html,/<script type="module" src="\/src\/site-header-data\.js"><\/script>/,name);
  assert.match(html,/shared-header\.css/,name);
  assert.ok(html.indexOf('/src/site-header.js')<html.indexOf('<squatch-header'),name+' component must register before DOM parses');
 }
});
test('canonical header includes every route and deployment/live stats placeholders',()=>{
 const header=read('src/site-header.js');
 for(const name of pages){
  const url=name==='index'?'/':'/'+name+'.html';
  assert.ok(header.includes(url),url+' missing from navigation');
 }
 for(const id of ['deployment-time','deployment-note','site-stats-players','site-stats-racks','site-stats-balls','site-stats-breakdown','stats-status'])
  assert.ok(header.includes(id),id+' missing');
});
