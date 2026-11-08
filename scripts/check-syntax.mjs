/**
 * One syntax check covers every owned JS module rather than a frozen hand-
 * maintained list that silently misses newly created game/controllers.
 */
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const files=[];
function scan(dir){
 for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){
  if(entry.isDirectory()){
   if(entry.name!=='vendor'&&entry.name!=='node_modules')scan(join(dir,entry.name));
  }else if(entry.name.endsWith('.js')||entry.name.endsWith('.mjs')){
   files.push(join(dir,entry.name));
  }
 }
}
for(const folder of ['src','scripts','functions'])scan(folder);
files.sort();
let failures=0;
for(const path of files){
 const result=spawnSync(process.execPath,['--check',path],{cwd:root,encoding:'utf8'});
 if(result.status!==0){
  failures++;
  console.error('INVALID SYNTAX '+path+'\n'+(result.stderr||result.stdout));
 }
}
if(failures)process.exitCode=1;
else console.log('Syntax verified:',files.length,'first-party JS files (src, scripts, functions)');
