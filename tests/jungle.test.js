import test from 'node:test';
import assert from 'node:assert/strict';
import {makePreview,changeView,shootPreview,advancePreview,toWorld,toTable} from '../experiments/jungle/scene-state.js';
test('overhead and cinematic are two views of the same rack',()=>{
 const state=makePreview(), balls=JSON.stringify(state.balls);
 changeView(state,'overhead');changeView(state,'cinematic');
 assert.equal(JSON.stringify(state.balls),balls);assert.equal(state.shots,0);
});
test('table and world positions roundtrip',()=>{
 const point={x:234.1,y:365.7};
 const copy=toTable(toWorld(point));
 assert.ok(Math.abs(copy.x-point.x)<1e-8);assert.ok(Math.abs(copy.y-point.y)<1e-8);
});
test('preview mode fires and settles without re-racking on view change',()=>{
 const state=makePreview();state.angle=0;state.power=55;
 assert.equal(shootPreview(state),true);
 assert.equal(shootPreview(state),false);
 changeView(state,'overhead');
 assert.equal(state.phase,'moving');
 assert.equal(state.shots,1);
 let done=false;
 for(let i=0;i<2500&&!done;i++)done=advancePreview(state).done;
 assert.ok(done,'shot should settle');assert.equal(state.phase,'aim');
 assert.equal(state.shots,1);assert.equal(state.view,'overhead');
});
test('unsupported scene view cannot mutate the rack',()=>{
 const state=makePreview(),balls=JSON.stringify(state.balls);
 assert.throws(()=>changeView(state,'random'));
 assert.equal(JSON.stringify(state.balls),balls);
});
