// Immutable local lineage metadata for Chaos recipes. Publishing requires a backend;
// this module provides portable ancestry in exported/imported recipe codes.
const id=()=>globalThis.crypto?.randomUUID?.()||'g-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const newOrigin=(name='')=>({gameId:id(),versionId:id(),rootGameId:null,parentVersionId:null,parentGameId:null,generation:0,creatorName:String(name).slice(0,64),createdAt:new Date().toISOString(),ancestors:[]});
export function forkLineage(parent,name=''){
 const base=validLineage(parent)?parent:newOrigin();
 const ancestors=[...(base.ancestors||[]),{gameId:base.gameId,versionId:base.versionId,creatorName:base.creatorName||'',generation:base.generation}].slice(-100);
 return {gameId:id(),versionId:id(),rootGameId:base.rootGameId||base.gameId,parentVersionId:base.versionId,parentGameId:base.gameId,generation:base.generation+1,creatorName:String(name).slice(0,64),createdAt:new Date().toISOString(),ancestors};
}
export function reviseLineage(previous){
 const base=validLineage(previous)?previous:newOrigin();
 return {...base,versionId:id(),parentVersionId:base.versionId,parentGameId:base.gameId,createdAt:new Date().toISOString(),ancestors:[...(base.ancestors||[]),{gameId:base.gameId,versionId:base.versionId,creatorName:base.creatorName||'',generation:base.generation}].slice(-100)};
}
export function validLineage(l){
 return !!l&&typeof l==='object'&&typeof l.gameId==='string'&&l.gameId.length<100&&typeof l.versionId==='string'&&l.versionId.length<100&&Number.isInteger(l.generation)&&l.generation>=0&&l.generation<=10000&&Array.isArray(l.ancestors)&&l.ancestors.length<=100&&l.ancestors.every(a=>typeof a.gameId==='string'&&a.gameId.length<100&&typeof a.versionId==='string'&&a.versionId.length<100);
}
export function describeLineage(l){if(!validLineage(l))return 'Original game · no recorded ancestry';return l.generation===0?'Original game · generation 0':`Generation ${l.generation} · forked from ${l.parentGameId||'unknown'} · ${l.ancestors.length} recorded ancestors`;}
