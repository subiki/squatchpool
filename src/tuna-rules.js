// Big Tuna Casserole — original house rules, Nov 6 2022.
// Two independently descending targets: 1–10 and 11–15.
// 10 is the winning ball only after 1–9 and all 11–15 have cleared.
export const TUNA_PAYOUTS=Object.freeze({15:1,9:2,10:3});
export function tunaTargets(balls){
 const live=new Set(balls.filter(b=>b.id>0&&!b.pocketed).map(b=>b.id));
 const targets=[];
 for(const [lo,hi] of [[1,10],[11,15]]){
  for(let id=lo;id<=hi;id++)if(live.has(id)){targets.push(id);break;}
 }
 return targets;
}
export function tunaCanWin(balls){
 const live=new Set(balls.filter(b=>b.id>0&&!b.pocketed).map(b=>b.id));
 return live.has(10)&&![1,2,3,4,5,6,7,8,9,11,12,13,14,15].some(id=>live.has(id));
}
export function tunaRackOrder(){
 // Rows 1,2,3,4,5; apex 1, geometric center 10, back-row center 15.
 return [1,2,3,4,5,6,7,8,10,11,12,13,15,14,9];
}
export function tunaJudgeShot({balls,firstContact,pocketed=[],calledBall,calledPocket,pocketEvents=[],scratch=false}){
 const targets=tunaTargets(balls);
 const legalContact=targets.includes(firstContact);
 const called=pocketEvents.some(e=>e.ballId===calledBall&&e.pocketId===calledPocket);
 const foul=scratch||!legalContact;
 const legalPocket=!foul&&called;
 const pocketIds=new Set(pocketed.filter(id=>id>0));
 const winning=legalPocket&&calledBall===10&&pocketIds.has(10)&&tunaCanWin(balls);
 const spotted=pocketed.filter(id=>id>0&&(!legalPocket||id!==calledBall||id===10&&!winning));
 const credited=legalPocket?pocketed.filter(id=>id>0&&!spotted.includes(id)):[];
 return {targets,legalContact,foul,ballInHand:foul,winning,spotted,credited,
  payout:credited.reduce((sum,id)=>sum+(TUNA_PAYOUTS[id]||0),0),
  keepTurn:credited.length>0&&!winning};
}
