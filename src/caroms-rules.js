/** Caroms (Whacky Pool) local-match adjudication.
 * Historical source: archive.html Episode 3 / 2024 Google Doc.
 * Provisional decisions: break 8 is re-spotted, legal slop counts only for
 * the current group, and a correctly caromed struck ball may itself score.
 * These choices must be playtested and never described as original quotations.
 */
import {groupOf,otherGroup,liveGroupBalls} from './rules.js';
import {caromShotFromEvents} from './squatch-modes.js';

/** Only the struck object ball and its post-cue-contact object-ball chain
 * can score. A pocket made solely by the white ball is an illegal combo.
 * This is explicitly prohibited in the original Episode 3 technical rules.
 */
export function caromsObjectPockets(shotEvents=[],shooterBall){
 const cueContact=shotEvents.findIndex(e=>e.type==='contact'&&
  e.balls?.includes(shooterBall)&&e.balls.includes(0));
 const fromStriker=new Set([shooterBall]),legal=[],illegal=[];
 for(let i=0;i<shotEvents.length;i++){
  const e=shotEvents[i];
  if(i>cueContact&&cueContact>=0&&e.type==='contact'&&e.balls?.length===2){
   const [a,b]=e.balls;
   // The white cue ball is a backboard, never a legal combo source.
   if(a!==0&&b!==0&&(fromStriker.has(a)||fromStriker.has(b))){
    fromStriker.add(a);fromStriker.add(b);
   }
  }
  if(e.type==='pocket'&&e.ballId!==0){
   if(cueContact>=0&&i>cueContact&&fromStriker.has(e.ballId))
    legal.push(e.ballId);
   else illegal.push(e.ballId);
  }
 }
 return {legal,illegal};
}

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
 const objectPockets=breakShot?{legal:pocketed.filter(id=>id!==0),illegal:[]}:
  caromsObjectPockets(shotEvents,shooterBall);
 const illegalCombo=objectPockets.illegal.length>0;
 // Once groups are assigned, calling an opponent ball (or an early 8)
 // cannot make an otherwise slopped own-group pocket count as a called shot.
 // On an open table, the first legally called group ball still chooses sides.
 const calledBallEligible=!group||
  (eightEligibleBefore?calledBall===8:groupOf(calledBall)===group);
 const calledMade=calledBallEligible&&Number.isInteger(calledBall)&&Boolean(calledPocket)&&
  pocketEvents.some(e=>e.ballId===calledBall&&e.pocketId===calledPocket&&
   objectPockets.legal.includes(e.ballId));
 const events=caromShotFromEvents({shooterBall,shotEvents,level,calledBall,calledPocket});
 const shooterAllowed=breakShot?shooterBall===1:
  group?(eightEligibleBefore?shooterBall===8:groupOf(shooterBall)===group):
  Boolean(groupOf(shooterBall));
 const foul=!shooterAllowed||scratch||illegalCombo||(!breakShot&&events.foul);
 const madeValidCall=!requiresCall||calledMade;
 const scored=objectPockets.legal.filter(id=>groupOf(id)===group);
 const anyGroupPot=objectPockets.legal.find(id=>Boolean(groupOf(id)));
 let newGroup=null;
 if(!breakShot&&!group&&!foul&&madeValidCall&&anyGroupPot)
  newGroup=groupOf(requiresCall?calledBall:anyGroupPot);
 const legalPot=!foul&&madeValidCall&&(group?scored.length>0:Boolean(newGroup));
 // An 8-ball win requires the 8 itself in the called pocket at levels that call it.
 // Calling another ball correctly cannot launder a slopped 8 into a win.
 const eightCallMade=!requiresCall||(calledBall===8&&
  pocketEvents.some(e=>e.ballId===8&&e.pocketId===calledPocket&&
   objectPockets.legal.includes(8)));
 const winner=!breakShot&&eight?(group&&eightEligibleBefore&&!foul&&eightCallMade?shooter:1-shooter):null;
 const keepTurn=winner===null&&!foul&&(breakShot?pocketed.some(id=>groupOf(id)):legalPot);
 const reason=winner!==null?(winner===shooter?'Legal 8-ball! Rack won.':'8-ball fell too soon or illegally. Rack lost.'):
  foul?(scratch?'Cue-ball scratch. Re-spot the white ball at center.':
   illegalCombo?'Illegal combo: the white ball cannot pocket your target.':
   'Foul: hit the white ball first, then reach a rail.'):
  breakShot?'Break complete. '+(keepTurn?'Shooter continues.':'Next player shoots.'):
  keepTurn?'Legal group ball pocketed. Shoot again.':
  requiresCall&&!calledMade?'Called ball/pocket not made. Turn passes.':'No scoring ball. Turn passes.';
 return {foul,scratch,illegalCombo,legalPocketed:objectPockets.legal,
  keepTurn,nextPlayer:keepTurn?shooter:1-shooter,
  winner,newGroup,groups:newGroup?groups.map((g,i)=>i===shooter?newGroup:otherGroup(newGroup)):groups.slice(),
  cueOption:foul&&!scratch?'leave-or-center':null,
  respotCue:scratch,respotEight:breakShot&&eight,
  pocketed,reason,firstContact:events.firstContact,railAfterContact:events.railAfterContact};
}
export function caromsEligible(balls,group){
 return Boolean(group&&liveGroupBalls(balls,group).length===0);
}
