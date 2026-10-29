/** Three-player Coin-Op Cutthroat match state.
 * Source: archive.html Episode 4. Unspecified foul/contact details are
 * intentionally left to the eventual browser adapter, not called canonical.
 */
import {CUTTHROAT_GROUPS} from './squatch-modes.js';

const nextPlayer = p => (p+1)%3;
const isObjectBall = id => Number.isInteger(id)&&id>=1&&id<=15;
export function startCutthroat(){
 return {turn:0,owners:[null,null,null],pocketed:[],claimedBalls:{},pendingClaim:null,winner:null,groupChoicePlayer:null,pendingTurn:null};
}
export function availableGroups(match){
 return [0,1,2].filter(group=>!match.owners.includes(group));
}
export function assignCutthroatGroup(match,player,group){
 if((match.pendingClaim&&match.pendingTurn===null)||match.winner!==null)throw new Error('Resolve the match first');
 if(player!==match.turn||match.groupChoicePlayer!==player||match.owners[player]!==null||!availableGroups(match).includes(group))
  throw new Error('Group choice requires a legal pocket on this turn');
 const owners=match.owners.map((value,i)=>i===player?group:value);
 const pendingClaim=match.pendingClaim&&match.pendingClaim.scratcher===player?
  {...match.pendingClaim,returnable:remainingCutthroatBalls({...match,owners},group)}:match.pendingClaim;
 const updated={...match,owners,groupChoicePlayer:null,pendingClaim,
  turn:match.pendingTurn===null?match.turn:match.pendingTurn,pendingTurn:null};
 return {...updated,winner:pendingClaim?null:winningPlayer(updated)};
}
export function remainingCutthroatBalls(match,group){
 return CUTTHROAT_GROUPS[group].filter(id=>!match.pocketed.includes(id)&&match.claimedBalls?.[id]===undefined)
  .concat(Object.entries(match.claimedBalls||{}).filter(([id,owner])=>owner===match.owners.indexOf(group)&&!match.pocketed.includes(Number(id))).map(([id])=>Number(id)));
}
function activePlayer(match,player){
 const group=match.owners[player];
 return group===null||remainingCutthroatBalls(match,group).length>0;
}
function nextActivePlayer(match,from){
 for(let offset=1;offset<=3;offset++){
  const player=(from+offset)%3;
  if(activePlayer(match,player))return player;
 }
 return from;
}
function winningPlayer(match){
 if(match.owners.some(group=>group===null))return null;
 const alive=match.owners.map((group,p)=>remainingCutthroatBalls(match,group).length?p:null).filter(p=>p!==null);
 return alive.length===1?alive[0]:null;
}
export function finishCutthroatShot(match,{pocketed=[],scratch=false,foul=false}={}){
 if(match.winner!==null||match.pendingClaim||match.pendingTurn!==null)throw new Error('Match is not ready for a shot');
 if(pocketed.some(id=>!isObjectBall(id)))throw new Error('Unknown object ball');
 const nextPocketed=[...new Set([...match.pocketed,...pocketed])];
 const made=pocketed.some(id=>!match.pocketed.includes(id));
 const legalPot=made&&!scratch&&!foul;
 const updated={...match,pocketed:nextPocketed,
  groupChoicePlayer:match.owners[match.turn]===null&&
   (legalPot||match.groupChoicePlayer===match.turn)?match.turn:null};
 // The original allows claiming a scratching player's unpocketed ball, even
 // to revive an eliminated third player. A claim transfers ownership only.
 if(scratch){
  const next=nextActivePlayer(updated,match.turn);
  // The third seat owns the claim even if the second seat is eliminated.
  const claimant=nextPlayer(nextPlayer(match.turn));
  const group=match.owners[match.turn];
  const mustChoose=updated.groupChoicePlayer===match.turn;
  return {...updated,turn:mustChoose?match.turn:next,pendingTurn:mustChoose?next:null,
   groupChoicePlayer:mustChoose?match.turn:null,pendingClaim:{
   claimant,scratcher:match.turn,
   returnable:group===null?[]:remainingCutthroatBalls(updated,group)
  },winner:null};
 }
 const winner=winningPlayer(updated);
 const keepTurn=legalPot&&activePlayer(updated,match.turn)&&winner===null;
 const next=keepTurn?match.turn:nextActivePlayer(updated,match.turn);
 // Preserve the source's right to choose a group until the end of the
 // player's turn. A miss pauses the handoff until that choice is made.
 if(!keepTurn&&updated.groupChoicePlayer===match.turn)
  return {...updated,turn:match.turn,pendingTurn:next,winner:null};
 return {...updated,turn:next,winner};
}
export function resolveCutthroatClaim(match,ballId=null){
 const claim=match.pendingClaim;
 if(!claim||match.pendingTurn!==null)throw new Error('Resolve group choice before the scratch claim');
 if(ballId!==null&&!claim.returnable.includes(ballId))throw new Error('Ball cannot be claimed');
 const claimedBalls=ballId===null?match.claimedBalls||{}:{...match.claimedBalls,[ballId]:claim.claimant};
 const updated={...match,claimedBalls,pendingClaim:null};
 const winner=winningPlayer(updated);
 return {...updated,turn:activePlayer(updated,match.turn)?match.turn:nextActivePlayer(updated,match.turn),winner};
}
