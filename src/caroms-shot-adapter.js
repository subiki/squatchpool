import {caromsTurn} from './caroms-rules.js';

/**
 * Pure Caroms house-rule adapter. The object ball, not the white ball, is
 * the striker. Keep center-or-leave foul choices and provisional break rules
 * inside caromsTurn; normalize only the settled ruling and physical pockets.
 */
export function adjudicateCaromsShot({
 balls,groups,shooter,shooterBall,shotEvents=[],level='beginner',
 breakShot=false,calledBall=null,calledPocket=null,eightEligibleBefore=false,
 playerLabel='Player '+(shooter+1),
}){
 // Physics may report a pocket twice while settling; a ball physically
 // enters one pocket once. Preserve contact/rail ordering for Caroms rules.
 const seen=new Set();
 const events=shotEvents.filter(event=>{
  if(event.type!=='pocket')return true;
  if(seen.has(event.ballId))return false;
  seen.add(event.ballId);return true;
 });
 const decision=caromsTurn({
  balls,groups,shooter,shooterBall,shotEvents:events,level,breakShot,
  calledBall,calledPocket,eightEligibleBefore,
 });
 const pocketed=[...new Set(decision.pocketed.filter(id=>id>0))];
 const announcement=playerLabel+': '+(pocketed.join(', ')||'no object balls')+
  '. '+decision.reason+
  (decision.newGroup?' '+playerLabel+' takes '+decision.newGroup+'.':'');
 return {
  legal:!decision.foul,foul:decision.foul,pocketed,
  points:decision.winner===shooter?1:0,
  nextPlayer:decision.nextPlayer,
  // Caroms uses an explicit center-or-leave choice, not unrestricted BIH.
  ballInHand:false,rackEnd:decision.winner!==null,announcement,
  actions:decision,
 };
}
