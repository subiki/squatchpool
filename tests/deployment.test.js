import test from 'node:test';
import assert from 'node:assert/strict';
import {pacificTimestamp,validDeploymentManifest,updateDeploymentBanner} from '../src/deployment.js';
import {createDeploymentManifest} from '../scripts/stamp-deployment.mjs';

const SHA='ef762ad93997b08651c3fda5486463a443ce5686';
const good={
 schemaVersion:1,source:'cloudflare-pages-build',branch:'main',
 deploymentBuildAt:'2026-10-27T01:33:57.000Z',commit:SHA
};

test('deployment time formats in Pacific daylight time, never browser time zone',()=>{
 const result=pacificTimestamp('2026-10-27T01:33:57Z');
 assert.match(result,/Oct 26, 2026/);
 assert.match(result,/6:33 PM PDT/);
 assert.match(pacificTimestamp('2026-12-31T23:33:00Z'),/3:33 PM PST/);
 assert.throws(()=>pacificTimestamp('not-a-date'),RangeError);
});

test('Cloudflare stamp writes a timestamp only for a verifiable build commit',()=>{
 assert.equal(createDeploymentManifest({},new Date('2026-10-27T01:33:57Z')),null);
 assert.equal(createDeploymentManifest({CF_PAGES:'1'},new Date('2026-10-27T01:33:57Z')),null);
 const m=createDeploymentManifest({
  CF_PAGES:'1',CF_PAGES_COMMIT_SHA:SHA.toUpperCase(),CF_PAGES_BRANCH:'main'
 },new Date('2026-10-27T01:33:57Z'));
 assert.deepEqual(m,{
  schemaVersion:1,deploymentBuildAt:'2026-10-27T01:33:57.000Z',
  commit:SHA,branch:'main',source:'cloudflare-pages-build'
 });
 assert.equal(validDeploymentManifest(m),true);
 assert.equal(validDeploymentManifest({...m,source:'untrusted'}),false);
 assert.equal(validDeploymentManifest({...m,deploymentBuildAt:'invalid'}),false);
 assert.equal(validDeploymentManifest({...m,commit:'not-a-sha'}),false);
});

test('header reports the deployed build, including SHA and PDT',async()=>{
 const target={textContent:'Last verified release',dateTime:'old',title:''};
 const note={textContent:'last known'};
 const ok=await updateDeploymentBanner({
  target,note,fetcher:async()=>({ok:true,json:async()=>good})
 });
 assert.equal(ok,true);
 assert.equal(target.dateTime,good.deploymentBuildAt);
 assert.match(target.textContent,/Oct 26, 2026.*6:33 PM PDT/);
 assert.equal(note.textContent,'DEPLOYED · ef762ad');
 assert.match(target.title,/Cloudflare Pages build timestamp/);
});

test('failed lookup never invents the current time or confuses a preview with production',async()=>{
 const target={textContent:'Last verified Oct 26, 6:33 PM PDT',dateTime:'2026-10-27T01:33:57Z'};
 const note={textContent:'Last verified deploy'};
 assert.equal(await updateDeploymentBanner({
  target,note,fetcher:async()=>{throw new Error('Offline');}
 }),false);
 assert.equal(target.textContent,'Last verified Oct 26, 6:33 PM PDT');
 assert.equal(note.textContent,'Last verified deploy');
 assert.equal(await updateDeploymentBanner({
  target,note,fetcher:async()=>({ok:true,json:async()=>({...good,branch:'feature'})})
 }),true);
 assert.equal(note.textContent,'PREVIEW BUILD · ef762ad');
});
