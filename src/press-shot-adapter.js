import {groupOf} from './rules.js';
import {pressTurn,pressEligible,qualifiesEightBankKick} from './press-your-luck-turn.js';

/**
 * Pure Press Your Luck house-rule adapter. The controller supplies the pre-shot
 * layout and actual physics events; the adapter owns legality, group claims,
 * provisional bonuses, rack scoring and the normalized ruling.
 */
export function adjudicatePressShot({
 match,balls,groups,shooter,shotEvents=[],firstContact=null,
 breakShot=false,calledBall=0,calledPocket='',declaredBank=false,
}){
 const seen=new Set();
 const pocketEvents=shotEvents.filter(event=>{
  if(event.type!=='pocket')return true;
  if(seen.has(event.ballId))return false;
  seen.add(event.ballId);return true;
 });
 const pocketed=[...seen],scratch=seen.has(0);
 const made=pocketEvents.some(e=>e.type==='pocket'&&e.ballId===calledBall&&e.pocketId===calledPocket);
 const eightMade=pocketEvents.some(e=>e.type==='pocket'&&e.ballId===8&&e.pocketId===calledPocket);
 const illegalEight=seen.has(8)&&(!eightMade||calledBall!==8);
 const legalCall=breakShot||made||!pocketed.some(id=>id!==0);
 const resolvedGroups=[...groups];
 const assignment=!resolvedGroups[shooter]&&!breakShot&&made&&groupOf(calledBall)&&
  !scratch&&firstContact!==null&&groupOf(firstContact)===groupOf(calledBall);
 if(assignment){
  resolvedGroups[shooter]=groupOf(calledBall);
  resolvedGroups[1-shooter]=resolvedGroups[shooter]==='solids'?'stripes':'solids';
 }
 const eligible=pressEligible(balls,resolvedGroups[shooter]);
 const legalFirst=breakShot?firstContact!==null:
  !resolvedGroups[shooter]?Boolean(groupOf(firstContact)):
  eligible?firstContact===8||Boolean(groupOf(firstContact)):
  groupOf(firstContact)===resolvedGroups[shooter];
 const legalShot=Boolean(legalFirst)&&!illegalEight&&legalCall;
 const ruling=pressTurn({
  match,balls,groups:resolvedGroups,shooter,shotEvents:pocketEvents,breakShot,
  legalShot,eightAttempt:calledBall===8&&!seen.has(8),
  bankOrKick:qualifiesEightBankKick(pocketEvents,{
   declared:declaredBank,calledBall,calledPocket,
  }),
  calledShotMade:made,
 });
 const rackEnd=Boolean(ruling.finish);
 const foul=scratch||!legalShot||(rackEnd&&ruling.winner!==shooter);
 const physicalPockets=pocketed.filter(id=>id>0);
 const points=rackEnd?ruling.match.lastRack.awarded:0;
 const announcement='Player '+(shooter+1)+': '+
  (rackEnd?'Player '+(ruling.winner+1)+' wins the rack'+(points?' · '+points+' points':''):
   ruling.respotEight?'8 on break · spot and continue':
   foul?'Foul'+(scratch?' · scratch':''):
   made?'Called '+calledBall+' made':
   physicalPockets.length?'Balls pocketed · turn resolved':'Miss');
 return {
  legal:!foul,foul,pocketed:physicalPockets,points,
  nextPlayer:rackEnd?null:ruling.nextPlayer,
  ballInHand:Boolean(ruling.ballInHand||scratch)&&!rackEnd,
  rackEnd,announcement,
  actions:{
   match:ruling.match,groups:resolvedGroups,respotEight:Boolean(ruling.respotEight),
   keepTurn:Boolean(ruling.keepTurn),winner:ruling.winner,finish:ruling.finish,
   provisionalDelta:ruling.match.bonus[shooter]-match.bonus[shooter],
  },
 };
}
