import {finishCutthroatShot} from './cutthroat-rules.js';

/**
 * Pure three-seat Cutthroat house-rule adapter.
 * The original rule engine owns group choices, scratch claims, elimination
 * and reentry; the controller supplies only settled physical shot events.
 */
export function adjudicateCutthroatShot({match,shotEvents=[],breakShot=false}){
 const seen=new Set();
 let scratch=false,contacted=false;
 for(const event of shotEvents){
  if(event.type==='contact'&&event.balls?.includes(0))contacted=true;
  if(event.type!=='pocket')continue;
  if(event.ballId===0)scratch=true;
  else if(Number.isInteger(event.ballId)&&event.ballId>=1&&event.ballId<=15)
   seen.add(event.ballId);
 }
 const pocketed=[...seen];
 // A missed object-ball contact ends the turn but is not a speculative
 // scratch/ball-in-hand penalty. Breaks are exempt from contact requirement.
 const missedContact=!contacted&&!breakShot;
 const nextMatch=finishCutthroatShot(match,{pocketed,scratch,foul:missedContact});
 const foul=scratch||missedContact;
 const announcement='Player '+(match.turn+1)+': '+
  (pocketed.length?'pocketed '+pocketed.join(', '):'no ball pocketed')+
  (scratch?' · scratch. Third player decides a claim.':'.');
 return {
  legal:!foul,foul,pocketed,points:0,
  nextPlayer:nextMatch.turn,ballInHand:scratch,
  rackEnd:nextMatch.winner!==null,announcement,
  actions:{match:nextMatch},
 };
}
