/**
 * Fast, dependency-free UI architecture guard.
 * Pages may retain only game-specific legacy styles. Shared style loading,
 * order and theme ownership are deterministic in direct loads AND SPA routes.
 */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const entry='src/site-styles.css';
const imports=[
 'game-page-layout.css','aim-preference.css','shot-announcer.css',
 'shared-header.css','pnw-theme.css','game-shell.css'
];
const style=read(entry);
const actual=[...style.matchAll(/@import\s+url\(['"]?\/src\/([^'")]+)['"]?\)\s*;/g)]
 .map(match=>match[1]);
assert.deepEqual(actual,imports,'One shared stylesheet and a stable ownership/cascade order are required.');
for(const file of imports)assert.ok(existsSync(join(root,'src',file)),'missing shared CSS '+file);

const routes=readdirSync(root).filter(name=>name.endsWith('.html')).sort();
assert.deepEqual(routes,[
 'arcade.html','but-wait.html','caroms.html','cutthroat.html',
 'index.html','press-your-luck.html','tuna.html'
],'All playable HTML routes must use the common styling contract.');

const broadSelector=/^\s*(?::root\b|html\b|body\b|main\b|section\b|header\b|canvas\b|button\b|select\b|input\b|label\b|details\b|summary\b|p\b|li\b|a\b|\*\b|\*\[)/m;
for(const path of routes){
 const html=read(path);
 const shared=[...html.matchAll(/<link\b[^>]*\bdata-squatch-shared-styles\b[^>]*>/gi)];
 assert.equal(shared.length,1,path+': one canonical shared CSS link');
 assert.match(shared[0][0],/href="\/src\/site-styles\.css"/,path+': expected shared entry');
 const links=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi)]
  .map(m=>({offset:m.index,href:m[0].match(/\bhref="([^"]+)"/)?.[1]||''}));
 const unique=new Set(links.map(({href})=>href));
 assert.equal(unique.size,links.length,path+': repeated stylesheet links');
 assert.ok(links.every(item=>item.href.split('/').pop()==='site-styles.css'||
   !imports.includes(item.href.split('/').pop())),
   path+': common CSS must be imported, not linked individually');
 const sharedOffset=html.indexOf('data-squatch-shared-styles');
 for(const local of [...html.matchAll(/<(?:style|link)\b[^>]*\bdata-page-style\b[^>]*>/gi)]){
  assert.ok(local.index<sharedOffset,path+': game-only CSS must precede the shared entry');
 }
 const inline=[...html.matchAll(/<style\b[^>]*\bdata-page-style\b[^>]*>([\s\S]*?)<\/style>/gi)];
 for(const match of inline){
  // Raw page-global type selectors are why the game shell looked different.
  // Keep unique game controls using ID/class selectors, not a second body
  // reset or universal styling.
  assert.doesNotMatch(match[1],broadSelector,
   path+': global selector inside route-only CSS; move to the common owner');
 }
 assert.match(html,/<squatch-header><\/squatch-header>/,path+': shared header');
}
const navigation=read('src/static-navigation.js');
assert.match(navigation,/link\[data-squatch-shared-styles\]/,
 'SPA must locate the persistent common CSS link');
assert.match(navigation,/doc\.head\.insertBefore\(style,sharedStyles\)/,
 'Soft navigation must insert local CSS before shared CSS');
const header=read('src/site-header.js');
assert.match(header,/rockStyle\.href\s*=\s*['"]\/src\/wild-squatch\.css['"]/,
 'Only the persistent header loads the optional Rock skin');
assert.match(header,/rockStyle\.disabled\s*=\s*!rock/,
 'Rock styling must be disabled in Classic mode');
console.log('UI architecture verified:',routes.length,
 'routes; one shared CSS entry; local-before-shared-before-Rock ordering');
