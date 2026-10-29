// Press Your Luck: owner-approved match scoring. Shot legality belongs to the gameplay controller.
// No points are banked to match totals until the rack ends; only its winner scores.
export const DEFAULT_TARGET_SCORE=15;
export function validateTargetScore(value){
 const n=typeof value==='number'?value:Number(value);
 if(!Number.isSafeInteger(n)||n<1||n>10000)throw new RangeError('Target score must be an integer from 1 to 10000');
 return n;
}
export function newMatch({targetScore=DEFAULT_TARGET_SCORE,breaker=0}={}){
 if(![0,1].includes(breaker))throw new RangeError('Invalid breaker');
 return {targetScore:validateTargetScore(targetScore),scores:[0,0],rack:1,breaker,bonus:[0,0],finished:false,winner:null};
}
function player(p){if(![0,1].includes(p))throw new RangeError('Invalid player');return p;}
export function pocketOpponentBalls(match,p,count=1){
 player(p);
 if(match.finished)throw new Error('Match finished');
 if(!Number.isSafeInteger(count)||count<1)throw new RangeError('Invalid ball count');
 return {...match,bonus:match.bonus.map((n,i)=>i===p?n+count:n)};
}
export function forfeitBonus(match,p){
 player(p);
 if(match.finished)throw new Error('Match finished');
 return {...match,bonus:match.bonus.map((n,i)=>i===p?0:n)};
}
export function endRack(match,{winner,finish='eight',bankOrKick=false}){
 player(winner);
 if(match.finished)throw new Error('Match finished');
 if(!['eight','early-eight','eight-scratch'].includes(finish))throw new RangeError('Unknown rack finish');
 if(finish!=='eight'&&bankOrKick)throw new Error('Cannot multiply forfeited rack');
 // On an early 8 or scratch-on-8, the *opponent* wins their own accumulated
 // rack bonus, without an automatic two-point 8 award.
 const awarded=finish==='eight'?(match.bonus[winner]+2)*(bankOrKick?2:1):match.bonus[winner];
 const scores=match.scores.map((n,i)=>i===winner?n+awarded:n);
 const finished=scores[winner]>=match.targetScore;
 return {...match,scores,bonus:[0,0],finished,winner:finished?winner:null,
  rack:finished?match.rack:match.rack+1,breaker:winner,lastRack:{winner,awarded,finish,bankOrKick}};
}
export function newRackAfterBreakEight(match){return match;} // 8 is respotted; no scoring event
