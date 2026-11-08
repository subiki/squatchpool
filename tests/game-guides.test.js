import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAME_GUIDES} from '../src/game-guides.js';
import {GAMES} from '../src/game-catalog.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pageByGame={
 'but-wait-theres-more':'but-wait.html',
 'caroms':'caroms.html',
 'cutthroat':'cutthroat.html',
 'press-your-luck':'press-your-luck.html',
 'tuna':'tuna.html'
};
const escapeHtml=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

test('five complete house rulebooks agree with the actual in-game instructions',()=>{
 assert.deepEqual(Object.keys(GAME_GUIDES),GAMES.map(g=>g.id));
 let points=0;
 for(const [id,guide] of Object.entries(GAME_GUIDES)){
  const html=read(pageByGame[id]);
  assert.ok(guide.sections.length>=4,id+' needs setup, turn, foul and win guidance');
  assert.ok(guide.example.length>70,id+' needs a real example');
  assert.ok(guide.controls.length>65,id+' needs concrete play controls');
  assert.match(html,/class="rulebook"/,id+' must have in-game rulebook');
  assert.match(html,/class="rulebook-example"/);
  assert.match(html,/class="rulebook-controls"/);
  assert.ok(html.includes(escapeHtml(guide.intro)),id+' intro must match canonical rules');
  for(const section of guide.sections){
   assert.ok(html.includes('<h4>'+escapeHtml(section.title)+'</h4>'),id+': '+section.title);
   assert.ok(section.items.length>=2,id+': '+section.title+' needs detail');
   for(const item of section.items){
    points++;
    assert.ok(html.includes('<li>'+escapeHtml(item)+'</li>'),id+': '+item);
   }
  }
  assert.ok(html.includes(escapeHtml(guide.example)),id+' example is missing');
  assert.ok(html.includes(escapeHtml(guide.controls)),id+' controls are missing');
  assert.doesNotMatch(html,/docs\.google\.com|href=["']https?:\/\//i,id+' must not send users outside');
 }
 assert.ok(points>=55,'rules should cover the actual games, not just short summaries');
});
test('rules remain optional and do not obscure gameplay by default',()=>{
 const pages=Object.values(pageByGame);
 for(const path of pages){
  const html=read(path);
  const book=html.indexOf('class="rulebook"');
  const table=html.indexOf('id="table-stage"');
  assert.ok(book>0&&table>book,path+' instructions must be above the table');
  const details=html.slice(Math.max(0,book-650),book);
  assert.match(details,/<details\b/,path+' long rules must be expandable');
  assert.doesNotMatch(details,/<details[^>]*\bopen\b/,path+' should load collapsed');
 }
 const css=read('src/game-hub.css');
 assert.doesNotMatch(css,/url\s*\(|@import/i,'SPA route CSS must remain self-contained');
 assert.match(css,/\.hub-game:has\(\.hub-rules\[open\]\)/,
  'expanded rules must get a readable full-width card');
});
test('important original house-rule twists are explained, not silently normalized',()=>{
 const but=GAME_GUIDES['but-wait-theres-more'];
 const car=GAME_GUIDES.caroms;
 const cut=GAME_GUIDES.cutthroat;
 const press=GAME_GUIDES['press-your-luck'];
 const tuna=GAME_GUIDES.tuna;
 const all=g=>g.sections.flatMap(s=>s.items).join(' ');
 assert.match(all(but),/7-ball and 15-ball/);
 assert.match(all(but),/either still-hidden ball/);
 assert.match(all(car),/white cue ball cannot be used/);
 assert.match(all(car),/center between the side pockets/);
 assert.match(all(cut),/five blue, five yellow and five red/);
 assert.match(all(cut),/brings them back into the game/);
 assert.match(all(press),/entire current-rack award is doubled/);
 assert.match(all(press),/no automatic two points/);
 assert.match(all(tuna),/lowest numbered ball still on the table in either sequence/);
 assert.match(all(tuna),/Other lower solids/);
});
