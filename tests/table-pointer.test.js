import test from 'node:test';
import assert from 'node:assert/strict';
import {tablePoint} from '../src/table-pointer.js';

test('shared table pointer maps touch positions on CSS-scaled canvases',()=>{
 const canvas={width:780,height:390,clientWidth:390,clientHeight:195,
  clientLeft:0,clientTop:0,getBoundingClientRect:()=>({left:50,top:20,width:390,height:195})};
 assert.deepEqual(tablePoint(canvas,{clientX:245,clientY:117.5}),{x:390,y:195});
 assert.deepEqual(tablePoint(canvas,{clientX:50,clientY:20}),{x:0,y:0});
});

test('shared table pointer handles canvas borders and minimal browser doubles',()=>{
 const bordered={width:780,height:390,clientWidth:388,clientHeight:193,
  clientLeft:2,clientTop:2,getBoundingClientRect:()=>({left:50,top:20,width:392,height:197})};
 assert.deepEqual(tablePoint(bordered,{clientX:246,clientY:118.5}),{x:390,y:195});
 const mock={width:780,height:390,getBoundingClientRect:()=>({left:0,top:0,width:390,height:195})};
 assert.deepEqual(tablePoint(mock,{clientX:195,clientY:97.5}),{x:390,y:195});
});
