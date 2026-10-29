import test from 'node:test';
import assert from 'node:assert/strict';
import {INVERT_AIM_KEY,angleFromPointer,bindInvertAim} from '../src/aim-preference.js';

test('point towards finger normally and away when inverted for all axes', () => {
 const b={x:100,y:100};
 assert.equal(angleFromPointer(b,{x:150,y:100},false),0);
 assert.equal(angleFromPointer(b,{x:50,y:100},true),0);
 assert.equal(angleFromPointer(b,{x:100,y:50},true),Math.PI/2);
 assert.equal(angleFromPointer(b,{x:100,y:150},false),Math.PI/2);
 assert.equal(angleFromPointer(b,{x:101,y:101},true,8),null);
});

test('button toggles immediately, survives new games and pages, and reports pressed state', () => {
 const old=globalThis.localStorage;
 const values=new Map();
 globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,v)=>values.set(key,v)};
 const button=()=>({
  handlers:{},attributes:{},textContent:'',
  addEventListener(name,handler){this.handlers[name]=handler;},
  setAttribute(name,value){this.attributes[name]=value;}
 });
 try {
  const first=button(),active=bindInvertAim(first);
  assert.equal(active(),false);assert.equal(first.attributes['aria-pressed'],'false');
  first.handlers.click();
  assert.equal(active(),true);assert.equal(values.get(INVERT_AIM_KEY),'true');
  assert.match(first.textContent,/ON/);
  const nextPage=button(),restored=bindInvertAim(nextPage);
  assert.equal(restored(),true);
  nextPage.handlers.click();
  assert.equal(restored(),false);assert.equal(values.get(INVERT_AIM_KEY),'false');
 } finally {
  if(old===undefined)delete globalThis.localStorage;
  else globalThis.localStorage=old;
 }
});

test('blocked browser storage does not prevent toggling or aiming', () => {
 const old=globalThis.localStorage;
 globalThis.localStorage={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
 try {
  const button={listeners:{},attrs:{},textContent:'',addEventListener(n,f){this.listeners[n]=f;},setAttribute(k,v){this.attrs[k]=v;}};
  const enabled=bindInvertAim(button);
  assert.equal(enabled(),false);button.listeners.click();assert.equal(enabled(),true);
  assert.equal(angleFromPointer({x:100,y:100},{x:90,y:100},enabled()),0);
 }finally{
  if(old===undefined)delete globalThis.localStorage;
  else globalThis.localStorage=old;
 }
});
