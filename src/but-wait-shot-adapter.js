import {adjudicate,otherPlayer} from './rules.js';

/**
 * Pure But Wait house-rules adapter. The original adjudicator retains called
 * ball + pocket, no-call breaks, slop, eight and surprise-ball eligibility.
 * This adapter only normalizes one settled physical shot for event consumers.
 */
export function adjudicateButWaitShot({
 balls,shooter,groups,deployed,pocketed=[],pocketEvents=[],
 firstContact=null,breakShot=false,preShotReadyForEight=false,
 calledBall=null,calledPocket=null,playerLabel='Player '+(shooter+1),
}){
 // The physics loop can report a ball more than once as it settles. Only
 // physical object-ball pockets count for telemetry, including uncalled slop.
 const physical=[...new Set(pocketed.filter(id=>Number.isInteger(id)&&id>=0&&id<=15))];
 const seen=new Set();
 const events=pocketEvents.filter(event=>{
  if(!Number.isInteger(event.id)||seen.has(event.id))return false;
  seen.add(event.id);return true;
 });
 const decision=adjudicate({
  balls,shooter,groups,deployed,pocketed:physical,pocketEvents:events,
  firstContact,breakShot,preShotReadyForEight,calledBall,calledPocket,
 });
 const made=physical.filter(id=>id!==0);
 const announcement=playerLabel+': '+(made.length?'pocketed '+made.join(', '):'no balls')+
  (physical.includes(0)?' • scratch':'')+'. '+decision.reason+
  (decision.newGroup?' '+playerLabel+' claims '+decision.newGroup+
   '. The other player takes '+(decision.newGroup==='solids'?'stripes':'solids')+'.':'');
 return {
  legal:!decision.foul,foul:decision.foul,pocketed:made,
  points:decision.winner===shooter?1:0,
  nextPlayer:decision.winner!==null?decision.winner:
   decision.keepTurn?shooter:otherPlayer(shooter),
  ballInHand:decision.winner===null&&decision.foul,
  rackEnd:decision.winner!==null,announcement,actions:decision,
 };
}
