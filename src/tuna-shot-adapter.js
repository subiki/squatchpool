import {tunaJudgeShot} from './tuna-rules.js';

/** Pure Big Tuna house-rule adapter. Never infer scoring from the UI. */
export function adjudicateTunaShot({player,balls,firstContact,shotEvents,calledBall,calledPocket}){
 const pocketEvents=shotEvents.filter(event=>event.type==='pocket');
 const pocketed=pocketEvents.map(event=>event.ballId);
 const ruling=tunaJudgeShot({
  balls,firstContact,pocketed,calledBall,calledPocket,pocketEvents,
  scratch:pocketed.includes(0),
 });
 const physicalPockets=[...new Set(pocketed.filter(id=>id>0))];
 const announcement='Player '+(player+1)+': '+
  (ruling.foul?'Foul':ruling.winning?'Wins the rack':
   ruling.credited.length?'Made '+ruling.credited.join(', '):'Miss')+
  (ruling.payout?' · $'+ruling.payout:'');
 return {
  legal:!ruling.foul,foul:ruling.foul,pocketed:physicalPockets,
  points:ruling.payout,
  nextPlayer:ruling.winning||ruling.keepTurn?player:1-player,
  ballInHand:ruling.ballInHand,rackEnd:ruling.winning,announcement,
  actions:{spotted:ruling.spotted,credited:ruling.credited,
   keepTurn:ruling.keepTurn,winning:ruling.winning},
 };
}
