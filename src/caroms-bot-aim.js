/**
 * Deterministic, bounded Caroms bot shot selection. The struck object ball
 * must touch the white ball before caroming into a pocket. A center-ball hit
 * transfers almost all its momentum to the white ball, so aim for a glancing
 * contact instead. This is a geometric heuristic, not a guaranteed pot.
 *
 * For equal-radius balls at contact Q = cue - 2r*n. To send the striker
 * toward pocket P after impact, choose n so (P-Q) dot n = 0. Both tangent
 * solutions are checked against the incoming direction and other balls.
 * Actual shot motion and adjudication remain in the shared physics/rules.
 */
export function planCaromsBotShot({balls=[],eligible=[],cueBall,pockets=[],radius}) {
  if(!cueBall||cueBall.pocketed||!Number.isFinite(radius)||radius<=0)return null;
  const width=Math.max(...pockets.map(p=>p.x),0);
  const height=Math.max(...pockets.map(p=>p.y),0);
  if(!width||!height)return null;
  const laneClear=(a,b,ignored)=>{
    const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    if(len2<1)return false;
    return balls.every(o=>{
      if(o.pocketed||ignored.has(o.id))return true;
      const t=Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/len2));
      return Math.hypot(o.x-a.x-t*dx,o.y-a.y-t*dy)>2.15*radius;
    });
  };
  let best=null;
  for(const ball of eligible){
    if(!ball||ball.pocketed||ball.id===0)continue;
    for(const pocket of pockets){
      const px=pocket.x-cueBall.x,py=pocket.y-cueBall.y,d=Math.hypot(px,py);
      if(d<=2*radius+1)continue;
      const ux=px/d,uy=py/d,parallel=-2*radius/d;
      const perp=Math.sqrt(1-parallel*parallel);
      for(const side of [-1,1]){
        const nx=parallel*ux-side*perp*uy;
        const ny=parallel*uy+side*perp*ux;
        const impact={x:cueBall.x-2*radius*nx,y:cueBall.y-2*radius*ny};
        if(impact.x<2*radius||impact.x>width-2*radius||
           impact.y<2*radius||impact.y>height-2*radius)continue;
        const vx=impact.x-ball.x,vy=impact.y-ball.y;
        const inDist=Math.hypot(vx,vy);
        if(inDist<2*radius+1)continue;
        const ix=vx/inDist,iy=vy/inDist,incidence=ix*nx+iy*ny;
        const outDist=Math.hypot(pocket.x-impact.x,pocket.y-impact.y);
        const forward=(ix*(pocket.x-impact.x)+iy*(pocket.y-impact.y))/outDist;
        // Reject backwards and nearly head-on/tangent strokes.
        if(incidence<0.14||forward<0.25)continue;
        const ignored=new Set([ball.id,cueBall.id]);
        if(!laneClear(ball,impact,ignored)||!laneClear(impact,pocket,ignored))continue;
        const score=forward*(0.45+incidence)/(1+inDist/700+outDist/900);
        if(!best||score>best.score)
          best={ballId:ball.id,pocketId:pocket.id,angle:Math.atan2(iy,ix),
            power:78,impact,score};
      }
    }
  }
  return best&&{ballId:best.ballId,pocketId:best.pocketId,angle:best.angle,
    power:best.power,impact:best.impact};
}
