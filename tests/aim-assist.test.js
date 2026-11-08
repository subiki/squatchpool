import test from 'node:test';
import assert from 'node:assert/strict';
import {AIM_ASSIST_KEY,AIM_ASSIST_MODES,readAimAssistMode,setAimAssistMode,
 resetAimAssistCacheForTests,ghostBallForPocket,firstAimCollision,
 railDistance,drawAimAssistance} from '../src/aim-assist.js';

test('four distinct levels persist across games; storage failures are harmless',()=>{
 const previous=globalThis.localStorage;
 const values=new Map();
 globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 try{
  resetAimAssistCacheForTests();
  assert.deepEqual(AIM_ASSIST_MODES.map(x=>x.id),['minimal','line','ghost','coach']);
  assert.equal(readAimAssistMode(),'ghost');
  assert.equal(setAimAssistMode('coach'),'coach');
  assert.equal(values.get(AIM_ASSIST_KEY),'coach');
  resetAimAssistCacheForTests();
  assert.equal(readAimAssistMode(),'coach','new page should restore coach preference');
  assert.equal(setAimAssistMode('banana'),'coach','invalid modes cannot corrupt storage');
  globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  resetAimAssistCacheForTests();
  assert.equal(readAimAssistMode(),'ghost');
  assert.equal(setAimAssistMode('line'),'line');
 }finally{
  if(previous===undefined)delete globalThis.localStorage;
  else globalThis.localStorage=previous;
  resetAimAssistCacheForTests();
 }
});

test('ghost ball is a full ball diameter behind the target along the pocket line',()=>{
 assert.deepEqual(ghostBallForPocket({x:200,y:100},{x:400,y:100},11),{x:178,y:100});
 assert.deepEqual(ghostBallForPocket({x:200,y:100},{x:200,y:0},11),{x:200,y:122});
 assert.equal(ghostBallForPocket({x:200,y:100},{x:200,y:100},11),null);
});

test('first predicted collision uses ray/circle geometry, nearest unobstructed ball',()=>{
 const cue={id:0,x:100,y:100},target={id:3,x:200,y:100},blocker={id:8,x:150,y:100};
 const hit=firstAimCollision(cue,0,[cue,target,blocker],10);
 assert.equal(hit.ball,blocker);
 assert.equal(hit.distance,30);
 assert.deepEqual(hit.contact,{x:130,y:100});
 const wrongSide=firstAimCollision(cue,Math.PI,[cue,target],10);
 assert.equal(wrongSide,null);
 const pocketed=firstAimCollision(cue,0,[cue,{...target,pocketed:true}],10);
 assert.equal(pocketed,null);
 const narrow=firstAimCollision(cue,0,[cue,{id:4,x:210,y:121}],10);
 assert.equal(narrow,null,'a cue passing just outside a 2-radius channel misses');
});

test('extended guide terminates at physical table nose, not off-table',()=>{
 assert.equal(railDistance({x:100,y:100},0,{width:1000,height:500,radius:10}),880);
 assert.equal(railDistance({x:100,y:100},Math.PI/2,{width:1000,height:500,radius:10}),380);
});

test('guide drawing is visual-only; level controls stroke complexity without mutating balls',()=>{
 const strokes=[],arcs=[];
 const ctx=new Proxy({
  save(){},restore(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},
  arc(...args){arcs.push(args)},stroke(){strokes.push(this.strokeStyle)},fill(){}
 },{get:(t,p)=>t[p]??(()=>{}),set:(t,p,v)=>{t[p]=v;return true}});
 const balls=[{id:0,x:100,y:100,pocketed:false},{id:2,x:200,y:100,pocketed:false}];
 const before=structuredClone(balls),table={width:1000,height:500,radius:10};
 const pockets=[{id:'TR',x:980,y:20}];
 const config={table,striker:balls[0],angle:0,balls,pockets,calledBallId:2,calledPocketId:'TR'};
 drawAimAssistance(ctx,{...config,mode:'minimal'});
 assert.equal(strokes.length,0);
 drawAimAssistance(ctx,{...config,mode:'line'});
 const lineCount=strokes.length;
 assert.ok(lineCount>=2);
 drawAimAssistance(ctx,{...config,mode:'ghost'});
 assert.ok(strokes.length>lineCount);
 const ghostCount=strokes.length;
 drawAimAssistance(ctx,{...config,mode:'coach'});
 assert.ok(strokes.length>ghostCount);
 assert.ok(arcs.length>=3);
 assert.deepEqual(balls,before);
});
