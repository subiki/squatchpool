import {groupOf} from './rules.js';
// Press Your Luck: shot legality belongs to the gameplay controller.
// Count physical own-group balls by their shooter, including balls sunk on the
// break before groups are assigned. Only the rack winner banks their rack award.
export const DEFAULT_TARGET_SCORE=15;
export function validateTargetScore(value){
 const n=typeof value==='number'?value:Number(value);
 if(!Number.isSafeInteger(n)||n<1||n>10000)throw new RangeError('Target score must be an integer from 1 to 10000');
 return n;
}
export function newMatch({targetScore=DEFAULT_TARGET_SCORE,breaker=0}={}){
 if(![0,1].includes(breaker))throw new RangeError('Invalid breaker');
 return {targetScore:validateTargetScore(targetScore),scores:[0,0],rack:1,breaker,bonus:[0,0],
  rackPoints:[0,0],rackPocketed:[[],[]],finished:false,winner:null,lastRack:null};
}
function player(p){if(![0,1].includes(p))throw new RangeError('Invalid player');return p;}
/**
 * Keep a physical ball record by shooter even while groups are open.
 * Recompute earned own-ball points whenever group assignment becomes known.
 * Ignore the cue and 8, opponent-owned balls, and duplicate physics events.
 */
export function recordRackPockets(match,p,pocketed=[],groups=[null,null]){
 player(p);
 if(match.finished)throw new Error('Match finished');
 if(!Array.isArray(pocketed)||!Array.isArray(groups)||groups.length!==2)
  throw new TypeError('Expected pocketed ball IDs and two player groups');
 const recorded=(match.rackPocketed||[[],[]]).map(ids=>[...ids]);
 for(const id of pocketed){
  if(groupOf(id)&&!recorded.some(ids=>ids.includes(id)))recorded[p].push(id);
 }
 const rackPoints=recorded.map((ids,i)=>groups[i]?
  ids.filter(id=>groupOf(id)===groups[i]).length:0);
 return {...match,rackPocketed:recorded,rackPoints};
}
/** Current rack forecast assumes a normal, legally called 8 (+2).
 * Bank/kick doubling is deliberately excluded until the shot is successful.
 */
export function rackScorePreview(match,p){
 player(p);
 const banked=match.scores[p],own=match.rackPoints?.[p]||0,press=match.bonus[p];
 const winRack=own+press+2;
 return {banked,own,press,winRack,ifLegalEight:banked+winRack};
}
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
 // The winner banks their own pocketed group balls plus remaining press bonus.
 // Legal 8 adds 2; a successful declared bank/kick doubles the *current rack*
 // only. Early 8 / 8-scratch awards the opponent their existing rack points
 // and bonus, but no automatic 8 points or multiplier.
 const ownPoints=match.rackPoints?.[winner]||0;
 const pressBonus=match.bonus[winner],eightPoints=finish==='eight'?2:0;
 const multiplier=finish==='eight'&&bankOrKick?2:1;
 const awarded=(ownPoints+pressBonus+eightPoints)*multiplier;
 const scores=match.scores.map((n,i)=>i===winner?n+awarded:n);
 const finished=scores[winner]>=match.targetScore;
 return {...match,scores,bonus:[0,0],rackPoints:[0,0],rackPocketed:[[],[]],
  finished,winner:finished?winner:null,
  rack:finished?match.rack:match.rack+1,breaker:winner,
  lastRack:{winner,awarded,finish,bankOrKick,ownPoints,pressBonus,eightPoints,multiplier}};
}
export function newRackAfterBreakEight(match){return match;} // 8 is respotted; no scoring event
