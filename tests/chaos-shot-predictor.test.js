import test from 'node:test';
import assert from 'node:assert/strict';
import {predictShot} from '../src/chaos-shot-predictor.js';
const ball=(x,y,c='#f6f3e7')=>({x,y,vx:0,vy:0,c});
const forecast=(balls,aim={x:1,y:0},power=.55,mods={})=>predictShot(balls,[],{bounce:false,gravity:false,magnet:false,pinball:false,...mods},aim,power);
test('power changes predicted travel and cue landing',()=>{
 const low=forecast([ball(200,260)],undefined,.1),high=forecast([ball(200,260)],undefined,1);
 assert.ok(low.paths[0].length>2);assert.ok(high.paths[0].length>low.paths[0].length);
 assert.ok(low.cueLanding&&high.cueLanding);
});
test('first cue contact identifies struck ball and keeps both paths',()=>{
 const p=forecast([ball(200,260),ball(340,260,'#ee6060')]);
 assert.equal(p.firstCueHit?.other,1);assert.ok(p.paths[0].length>2);assert.ok(p.paths[1].length>2);
});
test('forecast marks stochastic modifiers as non-guaranteed',()=>{
 assert.equal(forecast([ball(200,260)],undefined,.55,{portals:true}).stochastic,true);
});
