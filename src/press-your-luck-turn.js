import {groupOf,liveGroupBalls} from './rules.js';
import {pocketOpponentBalls,forfeitBonus,endRack} from './press-your-luck-score.js';

// This adapter only adjudicates owner-confirmed outcomes. Physics, calls,
// group assignment and foul legality are supplied by the table controller.
export function pressEligible(balls,group){
 return Boolean(group&&liveGroupBalls(balls,group).length===0);
}
export function pressTurn({match,balls,groups,shooter,shotEvents=[],breakShot=false,
 legalShot=true,eightAttempt=false,bankOrKick=false,calledShotMade=false}){
 if(![0,1].includes(shooter))throw new RangeError('Invalid shooter');
 if(!Array.isArray(groups)||groups.length!==2)throw new Error('Two groups required');
 const pocketed=shotEvents.filter(e=>e.type==='pocket').map(e=>e.ballId);
 const scratch=pocketed.includes(0),eight=pocketed.includes(8);
 const eligible=pressEligible(balls,groups[shooter]);
 // Eligibility must be captured BEFORE shot by the controller: balls already
 // pocketed by this shot must not make an early 8 suddenly legal.
 // Caller must supply balls representing the pre-shot layout.
 let next=match,finish=null,winner=null,keepTurn=false;
 if(breakShot&&eight)return {match:next,respotEight:true,finish:null,winner:null,keepTurn:!scratch,nextPlayer:scratch?1-shooter:shooter,scratch,ballInHand:scratch};
 if(eight){
  winner=!scratch&&legalShot&&eligible?shooter:1-shooter;
  finish=winner===shooter?'eight':scratch?'eight-scratch':'early-eight';
  next=endRack(next,{winner,finish,bankOrKick:finish==='eight'&&bankOrKick});
  return {match:next,respotEight:false,finish,winner,keepTurn:false,nextPlayer:null,scratch};
 }
 if(scratch){
  next=forfeitBonus(next,shooter);
  return {match:next,finish:null,winner:null,keepTurn:false,nextPlayer:1-shooter,scratch:true,ballInHand:true};
 }
 if(eightAttempt){
  next=forfeitBonus(next,shooter);
  return {match:next,finish:null,winner:null,keepTurn:false,nextPlayer:1-shooter,scratch:false};
 }
 if(!legalShot)return {match:next,finish:null,winner:null,keepTurn:false,nextPlayer:1-shooter,scratch:false,unresolvedFoul:true};
 const opponent=groups[1-shooter];
 const count=eligible?pocketed.filter(id=>groupOf(id)===opponent).length:0;
 if(count)next=pocketOpponentBalls(next,shooter,count);
 // Clearing one's own group is normal eight-ball play; a correctly called shot
 // continues the inning. Once clear, opponent balls can build provisional bonus.
 keepTurn=count>0||calledShotMade;
 return {match:next,finish:null,winner:null,keepTurn,nextPlayer:keepTurn?shooter:1-shooter,scratch:false,
  unresolvedOwnGroupShot:!eligible};
}
