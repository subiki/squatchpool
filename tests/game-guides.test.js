import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GAME_GUIDES} from '../src/game-guides.js';
import {GAMES} from '../src/game-catalog.js';
import {renderGameRules} from '../src/game-page-shell.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pageByGame={
 'but-wait-theres-more':'but-wait.html',
 caroms:'caroms.html',
 cutthroat:'cutthroat.html',
 'press-your-luck':'press-your-luck.html',
 tuna:'tuna.html'
};

function fakeElement(tag){
 return {
  tag,children:[],className:'',textContent:'',id:'',open:false,
  append(...items){this.children.push(...items);}
 };
}
const descendants=node=>[node,...node.children.flatMap(descendants)];

test('one rulebook renderer displays the actual guide for all five games',()=>{
 assert.deepEqual(Object.keys(GAME_GUIDES),GAMES.map(game=>game.id));
 let points=0;
 for(const [id,guide] of Object.entries(GAME_GUIDES)){
  const nodes={createElement:fakeElement};
  const host=fakeElement('section');
  const gameId=id==='but-wait-theres-more'?'but-wait':id;
  renderGameRules({},nodes,host,gameId,{intro:guide.intro});
  const all=descendants(host);
  const details=all.filter(n=>n.tag==='details');
  assert.equal(details.length,1,id+' must render one collapsible rulebook');
  assert.equal(details[0].open,false,'rules should be collapsed initially');
  assert.equal(all.filter(n=>n.tag==='summary').length,1);
  assert.equal(all.filter(n=>n.tag==='h4').length,guide.sections.length);
  assert.ok(all.some(n=>n.textContent===guide.intro),id+' intro is rendered');
  assert.ok(all.some(n=>n.textContent==='Example: '+guide.example),id+' example is rendered');
  assert.ok(all.some(n=>n.textContent==='Playing on this site: '+guide.controls),
   id+' controls are rendered');
  for(const section of guide.sections){
   assert.ok(section.items.length>=2,id+' section '+section.title+' is detailed');
   assert.ok(all.some(n=>n.tag==='h4'&&n.textContent===section.title));
   for(const item of section.items){
    points++;
    assert.ok(all.some(n=>n.tag==='li'&&n.textContent===item),
     id+' instruction missing: '+item);
   }
  }
  const page=read(pageByGame[id]);
  assert.doesNotMatch(page,/class="game-rules-layout"|class="rulebook"|class="quickstart"/,
   id+' page must not duplicate the canonical rules');
  assert.ok(!page.includes('docs.google.com') && !page.includes('href="https://') &&
    !page.includes("href='https://"),id+' page must remain internal-only');
 }

 assert.ok(points>=55,'full house rules are preserved by the shared renderer');
});

test('home and game routes share the same canonical guide content',()=>{
 const home=read('src/game-catalog.js');
 const shell=read('src/game-page-shell.js');
 assert.ok(home.includes("import {GAME_GUIDES} from './game-guides.js'"));
 assert.ok(shell.includes("import {GAME_GUIDES} from './game-guides.js'"));
 assert.ok(!shell.includes("querySelector('.game-rules-layout')"));
 const css=read('src/game-hub.css');
 assert.ok(!css.includes('url(')&&!css.includes('@import'),'SPA route CSS remains self-contained');
 assert.ok(css.includes('.hub-game:has(.hub-rules[open])'));
 const site=read('src/game-shell.css');
 assert.ok(site.includes('.squatch-rulebook')&&site.includes('.squatch-rule-list'));
});

test('important unusual Squatch rules remain intact',()=>{
 const all=id=>GAME_GUIDES[id].sections.flatMap(x=>x.items).join(' ');
 assert.match(all('but-wait-theres-more'),/7-ball and 15-ball/);
 assert.match(all('but-wait-theres-more'),/either still-hidden ball/);
 assert.match(all('caroms'),/white cue ball cannot be used/);
 assert.match(all('caroms'),/center between the side pockets/);
 assert.match(all('cutthroat'),/five blue, five yellow and five red/);
 assert.match(all('cutthroat'),/brings them back into the game/);
 assert.match(all('press-your-luck'),/entire current-rack award is doubled/);
 assert.match(all('press-your-luck'),/no automatic two points/);
 assert.match(all('tuna'),/lowest numbered ball still on the table in either sequence/);
 assert.match(all('tuna'),/Other lower solids/);
});
