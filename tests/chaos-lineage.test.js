import test from 'node:test';
import assert from 'node:assert/strict';
import {newOrigin,forkLineage,reviseLineage,validLineage,describeLineage} from '../src/chaos-lineage.js';
test('forks preserve exact parent version and root across generations',()=>{
 const a=newOrigin('Original');const b=forkLineage(a,'Remixer');const c=forkLineage(b,'Third');
 assert.equal(b.parentVersionId,a.versionId);assert.equal(c.parentVersionId,b.versionId);
 assert.equal(c.rootGameId,a.gameId);assert.equal(c.generation,2);assert.equal(c.ancestors.length,2);
 assert.ok(validLineage(c));assert.match(describeLineage(c),/Generation 2/);
});
test('revisions preserve game identity and point to previous version',()=>{
 const a=newOrigin();const revised=reviseLineage(a);
 assert.equal(revised.gameId,a.gameId);assert.equal(revised.parentVersionId,a.versionId);
 assert.notEqual(revised.versionId,a.versionId);
});
test('invalid imported lineage is rejected',()=>{assert.equal(validLineage({gameId:'x',versionId:'y',generation:-1,ancestors:[]}),false);});
