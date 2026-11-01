import test from 'node:test';
import assert from 'node:assert/strict';
import {createTableRenderer} from '../src/table-renderer.js';
import {TABLE,pockets,cushions,setTableSize} from '../src/table-geometry.js';

test('shared renderer follows live 7/8/9-foot geometry without mutating balls',()=>{
 let renderedPockets=0;
 const renderer=createTableRenderer({table:TABLE,pockets,cushions,renderPocket:()=>{renderedPockets++;}});
 const rects=[],arcs=[];
 const ctx=new Proxy({
  fillRect:(...args)=>rects.push(args),
  arc:(...args)=>arcs.push(args),
 },{get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 const balls=[{id:0,x:70,y:80,pocketed:false},{id:8,x:210,y:170,pocketed:false},{id:4,x:180,y:130,pocketed:true}];
 const before=structuredClone(balls);
 try{
  for(const size of [7,8,9]){
   setTableSize(size);rects.length=0;arcs.length=0;renderedPockets=0;
   renderer.drawTable(ctx,balls);
   assert.deepEqual(rects[0],[0,0,TABLE.width,TABLE.height],'felt uses selected table size');
   assert.equal(arcs.length,2,'only live balls are drawn');
   assert.equal(renderedPockets,6,'all six regulation pockets are rendered');
   assert.deepEqual(balls,before,'rendering must not change physics objects');
  }
 }finally{setTableSize(9);}
});

test('aim guide accepts an explicit object-ball striker for Caroms',()=>{
 const strokes=[];
 const ctx=new Proxy({
  stroke(){strokes.push(this.strokeStyle);},
 },{get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
 const renderer=createTableRenderer({table:TABLE,pockets,cushions,renderPocket:()=>{}});
 renderer.drawAim(ctx,{id:5,x:100,y:100,pocketed:false},Math.PI/2);
 assert.deepEqual(strokes,['#f4e1a3','#d6aa70']);
 renderer.drawAim(ctx,{id:5,x:100,y:100,pocketed:true},0);
 assert.equal(strokes.length,2,'pocketed striker cannot display a cue');
});
