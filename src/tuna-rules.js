// Big Tuna Casserole — original house rules, Nov 6 2022.
// Two independently ascending first-contact sequences: 1–10 and 11–15.
// The 10 wins after the stripes (9 and 11–15) clear, even if lower solids remain.
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
 return live.has(10)&&![9,11,12,13,14,15].some(id=>live.has(id));
}
export function tunaRackOrder(){
 // Row-major 15-ball triangle: apex index 0, middle of row 3 index 4,
 // middle of back row index 12. The nine stays strategically near the base.
 return [1,2,3,4,10,6,7,8,5,11,12,13,15,14,9];
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
