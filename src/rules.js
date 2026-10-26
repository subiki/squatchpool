export const stashBall=group=>group==='solids'?7:15;
export const groupOf=id=>id>=1&&id<=7?'solids':id>=9&&id<=15?'stripes':null;
export const otherGroup=group=>group==='solids'?'stripes':'solids';
export const otherPlayer=player=>1-player;
export const liveGroupBalls=(balls,group)=>balls.filter(b=>!b.pocketed&&groupOf(b.id)===group);
export const readyForStash=(balls,group,deployed)=>Boolean(group&&!deployed&&liveGroupBalls(balls,group).length===0);
export const readyForEight=(balls,group,deployed)=>Boolean(group&&deployed&&liveGroupBalls(balls,group).length===0);
/**
 * But Wait, There's More is CALL BALL + CALL POCKET after the break.
 * Slopped balls stay pocketed, but never earn another shot or set groups.
 * The 8 must drop in the specifically called pocket after eligibility.
 */
export function adjudicate({
 balls,shooter,groups,deployed,pocketed,firstContact,breakShot,
 preShotReadyForEight=false,calledBall=null,calledPocket=null,pocketEvents=[]
}){
 const group=groups[shooter],scratch=pocketed.includes(0),eight=pocketed.includes(8);
 const legalFirst=group?(groupOf(firstContact)===group||(firstContact===8&&preShotReadyForEight)):Boolean(groupOf(firstContact));
 const foul=scratch||(firstContact!==null&&!legalFirst)||firstContact===null;
 const madeCall=!breakShot&&Number.isInteger(calledBall)&&Boolean(calledPocket)&&
  pocketEvents.some(e=>e.id===calledBall&&e.pocketId===calledPocket);
 if(eight){
  const valid=group&&preShotReadyForEight&&!foul&&calledBall===8&&madeCall;
  return{winner:valid?shooter:otherPlayer(shooter),foul,keepTurn:false,
   madeCall,reason:valid?'Called 8-ball pocketed. Game won!':
   'The 8-ball fell early, on a foul, or in an uncalled pocket. Game lost.'};
 }
 const groupPots=pocketed.filter(id=>groupOf(id));
 // Breaks do not require calls and never assign groups.
 const claimed=madeCall&&groupOf(calledBall);
 const newGroup=!breakShot&&!group&&!foul&&claimed?claimed:null;
 const keepTurn=!foul&&(breakShot?groupPots.length>0:
  madeCall&&(group?groupOf(calledBall)===group:Boolean(groupOf(calledBall))));
 const slop=!breakShot&&groupPots.length>0&&!madeCall;
 const reason=foul?(scratch?'Scratch! Ball in hand.':'Foul! Wrong first contact or no object ball hit.'):
  keepTurn?(breakShot?'Good break! Shoot again.':'Called shot made! Shoot again.'):
  slop?'Slop stays down but does not count. Turn passes.':
  pocketed.length?'Uncalled ball pocketed. Turn passes.':'No called ball made. Turn passes.';
 return{winner:null,foul,keepTurn,newGroup,madeCall,reason};
}
