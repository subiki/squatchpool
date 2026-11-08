import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 REAL_BALL_COLORS,TEAM_BALL_COLORS,ballFillColor,drawPoolBall
} from '../src/ball-appearance.js';
import {createTableRenderer} from '../src/table-renderer.js';

test('Big Tuna uses standard 1–15 solid and stripe hues',()=>{
 assert.equal(REAL_BALL_COLORS.length,16);
 assert.equal(ballFillColor(1,'realistic'),'#f2c43c');
 assert.equal(ballFillColor(2,'realistic'),'#286bc0');
 assert.equal(ballFillColor(3,'realistic'),'#ce353c');
 assert.equal(ballFillColor(8,'realistic'),'#16191d');
 for(let i=1;i<=7;i++)
  assert.equal(ballFillColor(i,'realistic'),ballFillColor(i+8,'realistic'),
   'stripe '+(i+8)+' keeps the same hue as '+i);
 assert.equal(ballFillColor(10,'realistic'),'#286bc0');
 assert.equal(ballFillColor(15,'realistic'),'#80314b');
});

test('But Wait shows a single team color per group, with cue and 8 neutral',()=>{
 for(let i=1;i<=7;i++)assert.equal(ballFillColor(i,'teams'),TEAM_BALL_COLORS.solid);
 for(let i=9;i<=15;i++)assert.equal(ballFillColor(i,'teams'),TEAM_BALL_COLORS.stripe);
 assert.notEqual(TEAM_BALL_COLORS.solid,TEAM_BALL_COLORS.stripe);
 for(const palette of ['realistic','teams']){
  assert.equal(ballFillColor(0,palette),'#f7f5e9');
  assert.equal(ballFillColor(8,palette),'#16191d');
 }
});

test('ball drawing uses distinct colored fills and numbers without changing physics objects',()=>{
 const fills=[],labels=[],rects=[];
 const gradient={addColorStop(){}};
 const ctx={
  fillStyle:'',font:'',save(){},restore(){},translate(){},beginPath(){},arc(){},
  ellipse(){},fill(){fills.push(this.fillStyle);},clip(){},
  fillRect(...args){rects.push(args);},fillText(s){labels.push(s);},
  createRadialGradient(){return gradient;}
 };
 const p={id:10,x:100,y:90,vx:54,vy:8,pocketed:false};
 const snapshot={...p};
 drawPoolBall(ctx,p,11,'realistic');
 assert.ok(fills.includes('#286bc0'),'10-ball is blue');
 assert.ok(rects.some(r=>r[0]===-11&&r[2]===22),
  '10-ball has the white center stripe');
 assert.ok(labels.includes('10'),'number remains visible');
 assert.deepEqual(p,snapshot,'rendering does not change physics');
 labels.length=0;rects.length=0;fills.length=0;
 drawPoolBall(ctx,{...p,id:3},11,'teams');
 assert.ok(fills.includes(TEAM_BALL_COLORS.solid));
 assert.equal(rects.length,1,'solid has no stripe band, only shading');
 assert.deepEqual(labels,['3']);
});

test('shared table renderer accepts per-game custom art without changing default games',()=>{
 const calls=[];
 const ctx=new Proxy({fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){}},
  {get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>{t[k]=v;return true;}});
 const renderer=createTableRenderer({
  table:{width:900,height:450,radius:11},
  pockets:[],cushions:[],renderPocket(){}
 });
 const balls=[{id:0,x:40,y:200,pocketed:false},{id:8,x:180,y:200,pocketed:true},
  {id:14,x:220,y:200,pocketed:false}];
 renderer.drawTable(ctx,balls,{customDrawBall:b=>calls.push(b.id)});
 assert.deepEqual(calls,[0,14],'pocketed balls remain hidden and custom renderer used');
});

test('the two games use different palettes without rewriting shared rules',()=>{
 const root=new URL('../',import.meta.url);
 const tuna=readFileSync(new URL('src/tuna-game.js',root),'utf8');
 const butWait=readFileSync(new URL('src/game.js',root),'utf8');
 assert.match(tuna,/customDrawBall:ball=>drawPoolBall\(ctx,ball,TABLE\.radius,'realistic'\)/);
 assert.match(butWait,/drawPoolBall\(ctx,b,TABLE\.radius,'teams'\)/);
 assert.doesNotMatch(butWait,/const colors=\[/);
});
