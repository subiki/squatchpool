import test from 'node:test';
import assert from 'node:assert/strict';
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
