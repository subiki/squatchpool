import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const pages=['index','but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];
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

test('active header navigation recognizes Cloudflare extensionless and static offline routes',()=>{
 for(const name of pages){
  const href=name==='index'?'/':'/'+name+'.html';
  for(const pathname of name==='index'?['/','/index','/index.html']:['/'+name,href,'/'+name+'/']){
   let Component;
   const nav={children:[],append(node){this.children.push(node);}};
   const document={createElement:()=>({attributes:{},setAttribute(key,value){this.attributes[key]=value;},querySelector:()=>nav})};
   runInNewContext(read('src/site-header.js'),{
    location:{pathname},document,
    HTMLElement:class{constructor(){this.dataset={};}append(){}},
    customElements:{get:()=>null,define:(name,type)=>{Component=type;}},
   });
   const header=new Component();header.connectedCallback();
   assert.deepEqual(nav.children.filter(node=>node.attributes['aria-current']==='page').map(node=>node.href),[href],pathname);
   const count=nav.children.length;header.connectedCallback();
   assert.equal(nav.children.length,count,'reconnection must not duplicate navigation');
  }
 }
});

test('But Wait skips the competing read-only stats reader on every production/offline alias',()=>{
 // Execute the real initializer with import calls recorded, not network access.
 const source=read('src/site-header-data.js')
  .replace("import './deployment.js';","load('deployment');")
  .replace("import('./hub-stats.js')","load('stats')");
 for(const pathname of ['/but-wait','/but-wait.html','/but-wait/','/caroms','/arcade.html','/']){
  const imports=[];
  runInNewContext(source,{location:{pathname},load:name=>imports.push(name)});
  assert.deepEqual(imports,pathname.startsWith('/but-wait')?['deployment']:['deployment','stats'],pathname);
 }
});
