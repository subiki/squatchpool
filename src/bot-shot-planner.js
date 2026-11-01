/**
 * Shared, deterministic Squatch Bot stroke planner.
 * Picks a legal physical cue-ball line; never moves object balls or awards
 * points. The game adapter still resolves every result from Tailuge physics.
 */
function clearSegment(from,to,balls,ignore,radius){
 const dx=to.x-from.x,dy=to.y-from.y,den=dx*dx+dy*dy;
 if(den<1)return false;
 return balls.every(b=>{
  if(b.pocketed||ignore.includes(b.id))return true;
  const t=Math.max(0,Math.min(1,((b.x-from.x)*dx+(b.y-from.y)*dy)/den));
  return Math.hypot(b.x-(from.x+t*dx),b.y-(from.y+t*dy))>2*radius+0.5;
 });
}
export function planBotShot({balls,targets,pockets,radius,breakShot=false,table}){
 const cue=balls.find(b=>b.id===0&&!b.pocketed);
 const objects=balls.filter(b=>!b.pocketed&&b.id!==0&&targets.includes(b.id));
 if(!cue||!objects.length)return null;
 if(breakShot){
  const apex=[...objects].sort((a,b)=>a.x-b.x||Math.abs(a.y-cue.y)-Math.abs(b.y-cue.y))[0];
  return {ballId:apex.id,pocketId:null,angle:Math.atan2(apex.y-cue.y,apex.x-cue.x),power:85};
 }
 const candidates=[];
 for(const ball of objects)for(const pocket of pockets){
  const dx=pocket.x-ball.x,dy=pocket.y-ball.y,dist=Math.hypot(dx,dy);
  if(dist<radius*2)continue;
  const ghost={x:ball.x-2*radius*dx/dist,y:ball.y-2*radius*dy/dist};
  if(table&&(ghost.x<2*radius||ghost.x>table.width-2*radius||
   ghost.y<2*radius||ghost.y>table.height-2*radius))continue;
  if(!clearSegment(cue,ghost,balls,[0,ball.id],radius)||
     !clearSegment(ball,pocket,balls,[0,ball.id],radius))continue;
  const approach=Math.hypot(ghost.x-cue.x,ghost.y-cue.y);
  if(approach<2*radius)continue;
  candidates.push({ballId:ball.id,pocketId:pocket.id,
   angle:Math.atan2(ghost.y-cue.y,ghost.x-cue.x),
   power:Math.min(90,Math.max(48,Math.round(48+(approach+dist)/25))),
   cost:approach+dist*1.3});
 }
 if(candidates.length){
  candidates.sort((a,b)=>a.cost-b.cost||a.ballId-b.ballId||String(a.pocketId).localeCompare(String(b.pocketId)));
  const {cost,...plan}=candidates[0];return plan;
 }
 // Safety fallback: strike a legal object ball even when no clear pot exists.
 // This is a real shot, not a fabricated pocket or guaranteed success.
 const nearest=[...objects].sort((a,b)=>Math.hypot(a.x-cue.x,a.y-cue.y)-Math.hypot(b.x-cue.x,b.y-cue.y))[0];
 const pocket=[...pockets].sort((a,b)=>Math.hypot(a.x-nearest.x,a.y-nearest.y)-Math.hypot(b.x-nearest.x,b.y-nearest.y))[0];
 return {ballId:nearest.id,pocketId:pocket?.id||null,
  angle:Math.atan2(nearest.y-cue.y,nearest.x-cue.x),power:65};
}
