/** Caroms (Whacky Pool) local-match adjudication.
 * Historical source: archive.html Episode 3 / 2024 Google Doc.
 * Provisional decisions: break 8 is re-spotted, legal slop counts only for
 * the current group, and a correctly caromed struck ball may itself score.
 * These choices must be playtested and never described as original quotations.
 */
import {groupOf,otherGroup,liveGroupBalls} from './rules.js';
import {caromShotFromEvents} from './squatch-modes.js';

export const caromsCallRequired=(level,eightEligible=false)=>
 level==='advanced'||(level==='intermediate'&&eightEligible);

export function caromsTurn({balls,groups,shooter,shooterBall,shotEvents=[],
 level='beginner',breakShot=false,calledBall=null,calledPocket=null,
 eightEligibleBefore=false}){
 if(!['beginner','intermediate','advanced'].includes(level))throw new Error('Unknown skill level');
 if(!Number.isInteger(shooterBall)||shooterBall===0)throw new Error('Strike an object ball');
 const pocketEvents=shotEvents.filter(e=>e.type==='pocket');
 const pocketed=pocketEvents.map(e=>e.ballId);
 const scratch=pocketed.includes(0);
 const eight=pocketed.includes(8);
 const group=groups[shooter];
 const requiresCall=!breakShot&&caromsCallRequired(level,eightEligibleBefore);
 const calledMade=Number.isInteger(calledBall)&&Boolean(calledPocket)&&
  pocketEvents.some(e=>e.ballId===calledBall&&e.pocketId===calledPocket);
 const events=caromShotFromEvents({shooterBall,shotEvents,level,calledBall,calledPocket});
 const shooterAllowed=breakShot?shooterBall===1:
  group?(eightEligibleBefore?shooterBall===8:groupOf(shooterBall)===group):
  Boolean(groupOf(shooterBall));
 const foul=!shooterAllowed||scratch||(!breakShot&&events.foul);
 const madeValidCall=!requiresCall||calledMade;
 const scored=pocketed.filter(id=>groupOf(id)===group);
 const anyGroupPot=pocketed.find(id=>Boolean(groupOf(id)));
 let newGroup=null;
 if(!breakShot&&!group&&!foul&&madeValidCall&&anyGroupPot)
  newGroup=groupOf(requiresCall?calledBall:anyGroupPot);
 const legalPot=!foul&&madeValidCall&&(group?scored.length>0:Boolean(newGroup));
 const winner=!breakShot&&eight?(group&&eightEligibleBefore&&!foul&&madeValidCall?shooter:1-shooter):null;
 const keepTurn=winner===null&&!foul&&(breakShot?pocketed.some(id=>groupOf(id)):legalPot);
 const reason=winner!==null?(winner===shooter?'Legal 8-ball! Rack won.':'8-ball fell too soon or illegally. Rack lost.'):
  foul?(scratch?'Cue-ball scratch. Re-spot the white ball at center.':'Foul: hit the white ball first, then reach a rail.'):
  breakShot?'Break complete. '+(keepTurn?'Shooter continues.':'Next player shoots.'):
  keepTurn?'Legal group ball pocketed. Shoot again.':
  requiresCall&&!calledMade?'Called ball/pocket not made. Turn passes.':'No scoring ball. Turn passes.';
 return {foul,scratch,keepTurn,nextPlayer:keepTurn?shooter:1-shooter,
  winner,newGroup,groups:newGroup?groups.map((g,i)=>i===shooter?newGroup:otherGroup(newGroup)):groups.slice(),
  cueOption:foul&&!scratch?'leave-or-center':null,
  respotCue:scratch,respotEight:breakShot&&eight,
  pocketed,reason,firstContact:events.firstContact,railAfterContact:events.railAfterContact};
}
export function caromsEligible(balls,group){
 return Boolean(group&&liveGroupBalls(balls,group).length===0);
}
