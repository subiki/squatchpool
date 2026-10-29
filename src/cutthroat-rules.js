/** Three-player Coin-Op Cutthroat match state.
 * Source: archive.html Episode 4. Unspecified foul/contact details are
 * intentionally left to the eventual browser adapter, not called canonical.
 */
import {CUTTHROAT_GROUPS} from './squatch-modes.js';

const nextPlayer = p => (p+1)%3;
const isObjectBall = id => Number.isInteger(id)&&id>=1&&id<=15;
export function startCutthroat(){
 return {turn:0,owners:[null,null,null],pocketed:[],claimedBalls:{},pendingClaim:null,winner:null};
}
export function availableGroups(match){
 return [0,1,2].filter(group=>!match.owners.includes(group));
}
export function assignCutthroatGroup(match,player,group){
 if(match.pendingClaim||match.winner!==null)throw new Error('Resolve the match first');
 if(player!==match.turn||match.owners[player]!==null||!availableGroups(match).includes(group))
  throw new Error('Group is not available for this player');
 return {...match,owners:match.owners.map((value,i)=>i===player?group:value)};
}
export function remainingCutthroatBalls(match,group){
 return CUTTHROAT_GROUPS[group].filter(id=>!match.pocketed.includes(id)&&match.claimedBalls?.[id]===undefined)
  .concat(Object.entries(match.claimedBalls||{}).filter(([id,owner])=>owner===match.owners.indexOf(group)&&!match.pocketed.includes(Number(id))).map(([id])=>Number(id)));
}
function winningPlayer(match){
 if(match.owners.some(group=>group===null))return null;
 const alive=match.owners.map((group,p)=>remainingCutthroatBalls(match,group).length?p:null).filter(p=>p!==null);
 return alive.length===1?alive[0]:null;
}
export function finishCutthroatShot(match,{pocketed=[],scratch=false,foul=false}={}){
 if(match.winner!==null||match.pendingClaim)throw new Error('Match is not ready for a shot');
 if(pocketed.some(id=>!isObjectBall(id)))throw new Error('Unknown object ball');
 const nextPocketed=[...new Set([...match.pocketed,...pocketed])];
 const made=pocketed.some(id=>!match.pocketed.includes(id));
 const next=nextPlayer(match.turn);
 const updated={...match,pocketed:nextPocketed};
 // The original allows claiming a scratching player's ball, even to revive
 // an eliminated third player. Claim choice is explicit and never automatic.
 if(scratch){
  return {...updated,turn:next,pendingClaim:{
   claimant:(match.turn+2)%3,scratcher:match.turn,returnable:match.owners[match.turn]===null?[]:
    CUTTHROAT_GROUPS[match.owners[match.turn]].filter(id=>nextPocketed.includes(id)&&match.claimedBalls?.[id]===undefined).concat(Object.entries(match.claimedBalls||{}).filter(([id,owner])=>owner===match.turn&&nextPocketed.includes(Number(id))).map(([id])=>Number(id)))
  },winner:null};
 }
 const winner=winningPlayer(updated);
 return {...updated,turn:made&&!foul?match.turn:next,winner};
}
export function resolveCutthroatClaim(match,ballId=null){
 const claim=match.pendingClaim;
 if(!claim)throw new Error('No scratch claim is pending');
 if(ballId!==null&&!claim.returnable.includes(ballId))throw new Error('Ball cannot be claimed');
 const pocketed=ballId===null?match.pocketed:match.pocketed.filter(id=>id!==ballId);
 const claimedBalls=ballId===null?match.claimedBalls||{}:{...match.claimedBalls,[ballId]:claim.claimant};
 const updated={...match,pocketed,claimedBalls,pendingClaim:null};
 return {...updated,winner:winningPlayer(updated)};
}
