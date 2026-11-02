import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBotTurnScheduler} from '../src/bot-turn-scheduler.js';

test('bot scheduler prevents duplicate actions and cancels a pending turn',async()=>{
 const bot=createBotTurnScheduler();
 let fired=0;
 assert.equal(bot.schedule(()=>fired++,25),true);
 assert.equal(bot.pending,true);
 assert.equal(bot.schedule(()=>fired++,0),false);
 bot.cancel();
 assert.equal(bot.pending,false);
 await new Promise(resolve=>setTimeout(resolve,35));
 assert.equal(fired,0);
});

test('bot scheduler allows a follow-up action after a completed turn',async()=>{
 const bot=createBotTurnScheduler();
 let fired=0;
 bot.schedule(()=>{
  fired++;
  assert.equal(bot.pending,false);
  bot.schedule(()=>fired++,0);
 },0);
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(fired,2);
});


test('Press Your Luck bot shares cancellable turn scheduling with Cutthroat',()=>{
 const controller=readFileSync(new URL('../src/press-your-luck-game.js',import.meta.url),'utf8');
 assert.match(controller,/createBotTurnScheduler\(\)/);
 assert.match(controller,/function cancelBot\(\)\{botScheduler\.cancel\(\);\}/);
 assert.match(controller,/botScheduler\.schedule\(\(\)=>\{/);
 assert.match(controller,/botScheduler\.pending/);
 assert.doesNotMatch(controller,/botTimer|botGeneration|setTimeout\(/,
  'bot turn timing must have one shared owner');
 assert.match(controller,/function rack\(\)\{\s*cancelBot\(\)/,
  'new rack must cancel a pending bot action');
 assert.match(controller,/\$\('opponent'\)\.onchange=\(\)=>\{cancelBot\(\);update\(\);\}/,
  'switching to local players must cancel a pending bot action');
});
