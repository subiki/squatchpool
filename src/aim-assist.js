/**
 * Shared visual aiming assistant. This never changes physics, legal calls,
 * shot angle, or opponent decisions. Distances use live TABLE ball radius.
 *
 * Modes: minimal (cue only), line (first-contact ruler), ghost (impact cue
 * position), coach (also ideal ball-to-pocket / cue-to-ghost geometry).
 * Previews use ideal, no-spin collision geometry; they're not guarantees.
 */
export const AIM_ASSIST_KEY='squatch-aim-assistance';
export const AIM_ASSIST_MODES=Object.freeze([
 {id:'minimal',label:'Minimal',hint:'Cue stick only. No extra aiming lines.'},
 {id:'line',label:'Line',hint:'Extended cue-ball path and first-contact marker.'},
 {id:'ghost',label:'Ghost Ball',hint:'Line plus the translucent ball at the predicted first contact.'},
 {id:'coach',label:'Coach',hint:'Ghost ball plus ideal cut angle and selected ball-to-pocket lineup.'}
]);
const valid=new Set(AIM_ASSIST_MODES.map(item=>item.id));
let current=null;
export function readAimAssistMode(){
 if(current!==null)return current;
 try{const mode=globalThis.localStorage?.getItem(AIM_ASSIST_KEY);current=valid.has(mode)?mode:'ghost';}
 catch{current='ghost';}
 return current;
}
export function setAimAssistMode(mode){
 if(!valid.has(mode))return readAimAssistMode();
 current=mode;
 try{globalThis.localStorage?.setItem(AIM_ASSIST_KEY,mode);}catch{}
 return current;
}
export function resetAimAssistCacheForTests(){current=null;}

export function mountAimAssist(stage){
 const doc=stage?.ownerDocument;
 const kit=stage?.querySelector?.('.table-kit');
 if(!doc?.createElement||!kit)return;
 const existing=kit.querySelector('.squatch-aim-assist');
 if(existing)return existing;
 const wrap=doc.createElement('div');
 wrap.className='squatch-aim-assist';
 wrap.setAttribute('role','group');
 wrap.setAttribute('aria-label','Aiming assistance');
 const title=doc.createElement('span');
 title.className='squatch-aim-title';
 title.textContent='🎯 Aim help';
 const choices=doc.createElement('div');
 choices.className='squatch-aim-levels';
 const hint=doc.createElement('span');
 hint.className='squatch-aim-hint';
 hint.setAttribute('aria-live','polite');
 function paint(){
  const mode=readAimAssistMode();
  for(const btn of choices.children)btn.setAttribute('aria-pressed',String(btn.dataset.aimMode===mode));
  hint.textContent=AIM_ASSIST_MODES.find(item=>item.id===mode).hint+
   ' Visual estimate; spin, throw and other balls can change the result.';
 }
 for(const item of AIM_ASSIST_MODES){
  const button=doc.createElement('button');
  button.type='button';
  button.className='squatch-aim-mode';
  button.dataset.aimMode=item.id;
  button.textContent=item.label;
  button.addEventListener('click',()=>{setAimAssistMode(item.id);paint();});
  choices.append(button);
 }
 wrap.append(title,choices,hint);
 kit.prepend(wrap);
 paint();
 return wrap;
}

const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const normalize=(dx,dy)=>{
 const length=Math.hypot(dx,dy);
 return length>1e-8?{x:dx/length,y:dy/length}:null;
};
export function ghostBallForPocket(ball,pocket,radius){
 if(!finitePoint(ball)||!finitePoint(pocket)||!(radius>0))return null;
 const direction=normalize(pocket.x-ball.x,pocket.y-ball.y);
 return direction?{x:ball.x-direction.x*2*radius,y:ball.y-direction.y*2*radius}:null;
}
export function firstAimCollision(striker,angle,balls,radius){
 if(!finitePoint(striker)||!Number.isFinite(angle)||!(radius>0))return null;
 const dx=Math.cos(angle),dy=Math.sin(angle);
 let best=null;
 for(const b of balls||[]){
  if(!finitePoint(b)||b.pocketed||b===striker||b.id===striker.id)continue;
  const rx=b.x-striker.x,ry=b.y-striker.y;
  const along=rx*dx+ry*dy,side2=rx*rx+ry*ry-along*along;
  if(along<=0||side2>4*radius*radius)continue;
  const t=along-Math.sqrt(Math.max(0,4*radius*radius-side2));
  if(t<0||!Number.isFinite(t))continue;
  if(!best||t<best.distance)best={ball:b,distance:t,
   contact:{x:striker.x+dx*t,y:striker.y+dy*t}};
 }
 return best;
}
export function railDistance(origin,angle,table){
 if(!finitePoint(origin)||!Number.isFinite(angle)||!table)return 0;
 const dx=Math.cos(angle),dy=Math.sin(angle),r=table.radius;
 const walls=[2*r,table.width-2*r,2*r,table.height-2*r];
 const ts=[];
 if(dx>1e-8)ts.push((walls[1]-origin.x)/dx);
 if(dx< -1e-8)ts.push((walls[0]-origin.x)/dx);
 if(dy>1e-8)ts.push((walls[3]-origin.y)/dy);
 if(dy< -1e-8)ts.push((walls[2]-origin.y)/dy);
 return Math.max(0,Math.min(...ts.filter(t=>t>=0),Math.hypot(table.width,table.height)));
}
function line(ctx,a,b,color,width=2,dash=[]){
 if(!finitePoint(a)||!finitePoint(b))return;
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 ctx.setLineDash([]);
}
function ring(ctx,point,radius,color,width=2,fill=null){
 ctx.beginPath();ctx.arc(point.x,point.y,radius,0,Math.PI*2);
 if(fill){ctx.fillStyle=fill;ctx.fill();}
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
/** Draw onto an existing game canvas, after colored balls for visibility. */
export function drawAimAssistance(ctx,{
 table,striker,angle,balls,pockets=[],calledBallId=null,calledPocketId=null,
 targetBallId=null,mode=readAimAssistMode()
}={}){
 if(mode==='minimal'||!valid.has(mode)||!finitePoint(striker)||striker.pocketed||
    !Number.isFinite(angle)||!table?.radius||!Array.isArray(balls))return;
 const r=table.radius,d={x:Math.cos(angle),y:Math.sin(angle)};
 const first=firstAimCollision(striker,angle,balls,r);
 const limit=railDistance(striker,angle,table);
 const reach=first?Math.min(limit,first.distance):limit;
 const start={x:striker.x+d.x*r,y:striker.y+d.y*r};
 const finish={x:striker.x+d.x*reach,y:striker.y+d.y*reach};
 ctx.save();
 line(ctx,start,finish,'#ffed88',3,[10,7]);
 if(first)ring(ctx,first.contact,Math.max(3,r*.28),'#ffeb74',2,'#ffed883b');
 if((mode==='ghost'||mode==='coach')&&first){
  ring(ctx,first.contact,r,'#fffef0',3,'#f9ffeb4b');
  // Dashed normal shows where the object ball initially moves on contact.
  const n=normalize(first.ball.x-first.contact.x,first.ball.y-first.contact.y);
  if(n){
   const travel=Math.min(table.width*.22,190);
   line(ctx,first.ball,{x:first.ball.x+n.x*travel,y:first.ball.y+n.y*travel},
    '#6ff7f0',2.5,[8,5]);
  }
 }
 if(mode==='coach'){
  const chosen=balls.find(b=>!b.pocketed&&b.id===(
   targetBallId===null?Number(calledBallId):Number(targetBallId))&&b.id!==striker.id);
  const pocket=pockets.find(p=>p.id===calledPocketId);
  if(chosen&&pocket){
   const ghost=ghostBallForPocket(chosen,pocket,r);
   if(ghost){
    const validPlace=ghost.x>=2*r&&ghost.x<=table.width-2*r&&
      ghost.y>=2*r&&ghost.y<=table.height-2*r;
    if(validPlace){
     // Cyan ideal cue-ball position and two separately readable guide paths.
     line(ctx,striker,ghost,'#55e9ff',2.6,[6,5]);
     ring(ctx,ghost,r,'#7ff9ff',3,'#53e7ff49');
     line(ctx,chosen,pocket,'#fdb34e',2.8,[10,5]);
     ring(ctx,chosen,r+5,'#f9bb6b',2);
     if(first&&first.ball.id!==chosen.id)
      ring(ctx,first.ball,r+8,'#ff6b71',3);
    }
   }
  }
 }
 ctx.restore();
}
