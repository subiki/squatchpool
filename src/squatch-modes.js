/** Original Squatch games, grounded in the recovered Episode 1, 3 and 4 rules.
 * Press Your Luck is deliberately unavailable until its audio rules are recovered.
 * This module contains deterministic game setup and shot adjudication primitives;
 * browser integration is a separate step.
 */
export const SQUATCH_GAMES=Object.freeze([
 {id:'but-wait',name:"But Wait, There's More",players:2,ready:true,episode:1},
 {id:'caroms',name:'Caroms (Whacky Pool)',players:2,ready:false,episode:3},
 {id:'cutthroat',name:'Coin-Op Cutthroat',players:3,ready:false,episode:4},
 {id:'press-your-luck',name:'Press Your Luck',players:null,ready:false,episode:2}
]);
export const CUTTHROAT_GROUPS=Object.freeze([[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15]]);
export const groupForBall=id=>CUTTHROAT_GROUPS.findIndex(g=>g.includes(id));
export const livingBalls=(balls,group)=>balls.filter(b=>!b.pocketed&&groupForBall(b.id)===group);
export function cutthroatWinner(balls,owners){
 const alive=owners.filter(group=>livingBalls(balls,group).length>0);
 return alive.length===1?owners.indexOf(alive[0]):null;
}
export function cutthroatShot({balls,owners,shooter,pocketed=[],firstContact=null,scratch=false}){
 if(owners.length!==3||new Set(owners).size!==3||owners.some(g=>g<0||g>2))
  throw new Error('Cutthroat requires three distinct groups');
 const foul=scratch||firstContact===null;
 const next=(shooter+1)%3;
 // The original house rules allow pocketing any group, including your own.
 const keepTurn=!foul&&pocketed.some(id=>id>=1&&id<=15);
 return {foul,keepTurn,nextPlayer:keepTurn?shooter:next,
  winner:cutthroatWinner(balls,owners),scratchClaimAvailable:scratch,
  // Third player may claim one of scratcher's balls; do not auto-select it.
  claimPlayer:scratch?(shooter+2)%3:null};
}
export const CAROM_LEVELS=Object.freeze(['beginner','intermediate','advanced']);
export function caromShot({shooterBall,firstContact,railAfterContact,pocketed=[],calledBall=null,calledPocket=null,pocketEvents=[],level='beginner'}){
 if(!CAROM_LEVELS.includes(level))throw new Error('Unknown carom skill level');
 const foul=shooterBall===0||firstContact!==0||!railAfterContact;
 const called=Number.isInteger(calledBall)&&Boolean(calledPocket)&&
  pocketEvents.some(e=>e.id===calledBall&&e.pocketId===calledPocket);
 const made=pocketed.some(id=>id!==0&&id!==8);
 const legalPot=level==='advanced'?called:made;
 const eight=pocketed.includes(8);
 return {foul,keepTurn:!foul&&!eight&&legalPot,
  eightValid:eight&&!foul&&(level==='beginner'||called),
  cueBallOption:foul?'leave-or-center':null};
}
