export const stashBall=group=>group==='solids'?7:15;
export const groupOf=id=>id>=1&&id<=7?'solids':id>=9&&id<=15?'stripes':null;
export const otherGroup=group=>group==='solids'?'stripes':'solids';
export const otherPlayer=player=>1-player;
export const liveGroupBalls=(balls,group)=>balls.filter(b=>!b.pocketed&&groupOf(b.id)===group);
export const readyForStash=(balls,group,deployed)=>Boolean(group&&!deployed&&liveGroupBalls(balls,group).length===0);
export const readyForEight=(balls,group,deployed)=>Boolean(group&&deployed&&liveGroupBalls(balls,group).length===0);
export function adjudicate({balls,shooter,groups,deployed,pocketed,firstContact,breakShot,preShotReadyForEight=false}){
 const group=groups[shooter],scratch=pocketed.includes(0),eight=pocketed.includes(8);
 // Use the start-of-shot state: sinking a last group ball with the 8 is still a loss.
 const legalFirst=group?(groupOf(firstContact)===group||(firstContact===8&&preShotReadyForEight)):Boolean(groupOf(firstContact));
 const foul=scratch||(firstContact!==null&&!legalFirst)||firstContact===null;
 if(eight){
  const valid=group&&preShotReadyForEight&&!foul;
  return{winner:valid?shooter:otherPlayer(shooter),foul,keepTurn:false,reason:valid?'The 8-ball drops! Game won.':'The 8-ball dropped early or on a foul. Game lost.'};
 }
 const ownPots=pocketed.filter(id=>groupOf(id)===group);
 const openPots=pocketed.filter(id=>groupOf(id));
 const newGroup=!group&&!breakShot&&!foul&&openPots.length?groupOf(openPots[0]):null;
 const keepTurn=!foul&&(group?ownPots.length>0:openPots.length>0);
 return{winner:null,foul,keepTurn,newGroup,reason:foul?(scratch?'Scratch! Ball in hand.':'Foul! Wrong first contact or no object ball hit.'):pocketed.length?(keepTurn?'Nice shot! Shoot again.':'Ball down. Turn passes.'):'No ball pocketed. Turn passes.'};
}
