import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {GAMES,renderGameCards} from '../src/game-catalog.js';
import {GAME_GUIDES} from '../src/game-guides.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pages=['index','but-wait','caroms','cutthroat','press-your-luck','tuna','arcade'];

test('standalone rules and field notes pages are gone, with internal redirects for old bookmarks',()=>{
 for(const file of ['rules.html','archive.html'])
  assert.equal(existsSync(new URL('../'+file,import.meta.url)),false,file+' should not ship');
 const nav=read('src/site-header.js'),soft=read('src/static-navigation.js');
 assert.doesNotMatch(nav,/\/rules\.html|\/archive\.html|Field Notes/);
 assert.doesNotMatch(soft,/['"]\/rules['"]|['"]\/archive['"]/);
 for(const path of ['/rules','/rules.html','/archive','/archive.html']){
  assert.ok(read('_redirects').includes(path+' / 301'),path+' should redirect internally');
 }
 const offline=read('scripts/build-pwa.mjs');
 const verifier=read('scripts/verify-pwa.mjs');
 assert.doesNotMatch(offline,/scan\('archive\/source'\)/);
 assert.doesNotMatch(verifier,/collect\('archive\/source'\)/);
});
test('every live page has local-only asset references and never outbound hyperlinks',()=>{
 for(const page of pages){
  const html=read(page+'.html');
  assert.doesNotMatch(html,/https?:\/\/|docs\.google\.com/i,page+' embeds an external URL');
  for(const [,url] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)){
   assert.match(url,/^(?:\/|\.\/|\.\.\/|#)/,page+' has outbound target: '+url);
  }
 }
 for(const game of GAMES)assert.match(game.url,/^\/[a-z-]+\.html$/);
});
test('home promotes each game with a rules summary, expanded strategy and local play link',()=>{
 assert.equal(GAMES.length,5);
 for(const game of GAMES){
  assert.ok(game.rules.length>=3&&game.rules.length<=5,game.id);
  assert.ok(game.strategy.length>=12&&game.highlight.length>12,game.id);
  assert.match(game.url,/^\//);
 }
 const previous=globalThis.document;
 class Element {
  constructor(tag){this.tag=tag;this.className='';this.dataset={};this.attributes={};
   this.children=[];this.textContent='';this.open=false;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelectorAll(){return [];}
 }
 try{
  globalThis.document={createElement:tag=>new Element(tag)};
  const list=new Element('div');
  renderGameCards(list);
  assert.equal(list.children.length,5);
  for(const card of list.children){
   assert.match(card.id,/^game-/);
   const details=card.children.find(node=>node.tag==='details');
   assert.equal(details.className,'hub-rules');
   assert.equal(details.children[0].tag,'summary');
   assert.match(details.children[0].textContent,/rules.*strategy/i);
   const guide=GAME_GUIDES[card.dataset.game];
   const sections=details.children.filter(node=>node.tag==='section');
   assert.equal(sections.length,guide.sections.length);
   for(let i=0;i<sections.length;i++){
    assert.equal(sections[i].children[0].textContent,guide.sections[i].title);
    assert.equal(sections[i].children[1].children.length,guide.sections[i].items.length);
   }
   assert.ok(details.children.some(node=>node.className==='hub-rule-example'));
   assert.ok(details.children.some(node=>node.className==='hub-rule-controls'));
   const play=card.children.at(-1);
   assert.equal(play.tag,'a');
   assert.match(play.href,/^\/[a-z-]+\.html$/);
  }
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
 const html=read('index.html');
 assert.match(html,/house rules/i);
 assert.doesNotMatch(html,/href=["'](?:\/rules|\/archive)/);
 const local=read('src/game-hub.css');
 assert.doesNotMatch(local,/url\s*\(|@import/i,
  'page-specific CSS must remain URL-free for soft navigation');
 const visual=read('src/pnw-theme.css');
 assert.match(visual,/\.hub-game \.hub-rules/);
 assert.match(visual,/--pnw-photo-moss/);
});
