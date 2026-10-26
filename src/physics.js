/**
 * Squatch Pool integration for Tailuge's billiards-specific GPL-3.0 physics.
 * Reuses Tailuge's real collision-throw, sliding/rolling, spin and cushion models.
 * This adapter supplies continuous time-of-impact detection for our six pocket
 * table and preserves the public game API used by the rules and UI.
 */
import { ballCollision, cushionBounce, advanceFriction, applyCueSpin as setCueSpin }
  from './vendor/tailuge-physics.js';
export { setCueSpin as applyCueSpin };
import {TABLE,cushions,pockets,jaws,facings,pocketCaptureTime} from './table-geometry.js';
export {TABLE,cushions,pockets} from './table-geometry.js';
const R=TABLE.radius,STOP=5;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ball=(id,x,y)=>({id,x,y,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary',pocketed:false});
export const stationary=balls=>balls.every(b=>b.pocketed||Math.hypot(b.vx,b.vy)<STOP);
export function canPlace(balls,x,y,ignoreId=null){
 const {width:W,height:H}=TABLE,inset=2*R+1;
 if(x<inset||x>W-inset||y<inset||y>H-inset)return false;
 if(pockets.some(p=>p.kind==='side'?
  Math.abs(x-p.x)<p.half+R&&p.sy*(y-p.y)<2.3*R:
  p.sx*(x-p.x)+p.sy*(y-p.y)<p.lip+2*R&&p.sx*(x-p.x)>0&&p.sy*(y-p.y)>0))return false;
 return balls.every(b=>b.pocketed||b.id===ignoreId||Math.hypot(b.x-x,b.y-y)>=2*R+2);
}
export function findPlacement(balls,preferred={x:TABLE.width/4,y:TABLE.height/2}){
 if(canPlace(balls,preferred.x,preferred.y))return preferred;
 for(let radius=26;radius<=400;radius+=26)for(let i=0;i<36;i++){
  const angle=i*Math.PI/18,x=preferred.x+Math.cos(angle)*radius,y=preferred.y+Math.sin(angle)*radius;
  if(canPlace(balls,x,y))return{x,y};
 }
 return null;
}
export function rack(){
 const W=TABLE.width,H=TABLE.height;
 // A physical inch always uses the same number of pixels across table sizes.
 const cueX=R+(W-2*R)/4,apexX=R+(W-2*R)*0.70;
 const balls=[ball(0,cueX,H/2)],numbers=[1,10,3,12,8,2,9,11,4,13,5,14,6];
 let index=0;
 const spacingX=2*R*Math.sqrt(3)/2+0.35,spacingY=2*R+0.9;
 for(let row=0;row<5;row++)for(let column=0;column<=row;column++){
  if(row===4&&(column===0||column===4))continue;
  balls.push(ball(numbers[index++],apexX+row*spacingX,H/2+(column-row/2)*spacingY));
 }
 return balls;
}

// Swept moving circle v. stationary point/other moving circle.
// Analytic contact avoids missing balls even on full-power breaks.
function circleTime(dx,dy,vx,vy,r,maxT){
 const speed2=vx*vx+vy*vy,dot=dx*vx+dy*vy,c=dx*dx+dy*dy-r*r;
 if(speed2<1e-8||dot>=0)return null;
 if(c<=-0.001)return 0;
 const disc=dot*dot-speed2*c;
 if(disc<0)return null;
 const t=(-dot-Math.sqrt(disc))/speed2;
 return t>=-1e-8&&t<=maxT+1e-8?Math.max(0,t):null;
}
function facingTime(b,f,maxT){
 const dx=f.x2-f.x1,dy=f.y2-f.y1,len=Math.hypot(dx,dy);
 const nx=-dy/len,ny=dx/len;
 const dist=(b.x-f.x1)*nx+(b.y-f.y1)*ny,vn=b.vx*nx+b.vy*ny;
 if(Math.abs(vn)<1e-8)return null;
 let best=null;
 for(const sign of [-1,1]){
  // Only resolve a collision from the approaching, occupied side.
  if(vn*sign>=-1e-8)continue;
  const t=(sign*(R+f.radius)-dist)/vn;
  if(t<0||t>maxT)continue;
  const x=b.x+b.vx*t,y=b.y+b.vy*t;
  const projection=((x-f.x1)*dx+(y-f.y1)*dy)/len;
  if(projection>=0&&projection<=len&&(!best||t<best.time))
   best={time:t,nx:nx*sign,ny:ny*sign};
 }
 return best;
}
function advance(balls,time){
 if(time<=0)return;
 for(const b of balls)if(!b.pocketed){b.x+=b.vx*time;b.y+=b.vy*time;}
}
const valid=b=>!b.pocketed&&Number.isFinite(b.x+b.y+b.vx+b.vy);
export function step(balls,dt=1/120){
 const W=TABLE.width,H=TABLE.height,pocketed=[],contacts=[],pocketEvents=[];
 if(!(dt>0))return{pocketed,contacts,pocketEvents};
 let remaining=Math.min(dt,1/30),events=0;
 while(remaining>1e-8&&events++<120){
  let best=null;
  const offer=(time,type,a,b=null,nx=0,ny=0)=>{
   if(time===null)return;
   if(!best||time<best.time-1e-8)best={time,type,a,b,nx,ny};
  };
  for(let i=0;i<balls.length;i++){
   const a=balls[i];if(!valid(a))continue;
   for(let j=i+1;j<balls.length;j++){
    const b=balls[j];if(!valid(b))continue;
    const t=circleTime(b.x-a.x,b.y-a.y,b.vx-a.vx,b.vy-a.vy,2*R,remaining);
    offer(t,'ball',a,b);
   }
   // A ball must cross the physical pocket throat, not enter a magic circle.
   for(const p of pockets){
    offer(pocketCaptureTime(a,p,remaining),'pocket',a,p);
   }
   // Cushion noses: centers collide at ball radius inward of visible rail.
   for(const c of cushions){
    if(c.y1===c.y2){
     const normal=c.y1<H/2?1:-1;
     const face=c.y1+normal*R,vy=a.vy;
     if(vy*normal>=-1e-8)continue;
     const t=(face-a.y)/vy;
     if(t<0||t>remaining)continue;
     const x=a.x+a.vx*t;
     if(x>=Math.min(c.x1,c.x2)&&x<=Math.max(c.x1,c.x2))
      offer(t,'rail',a,null,0,normal);
    }else{
     const normal=c.x1<W/2?1:-1;
     const face=c.x1+normal*R,vx=a.vx;
     if(vx*normal>=-1e-8)continue;
     const t=(face-a.x)/vx;
     if(t<0||t>remaining)continue;
     const y=a.y+a.vy*t;
     if(y>=Math.min(c.y1,c.y2)&&y<=Math.max(c.y1,c.y2))
      offer(t,'rail',a,null,normal,0);
    }
   }
   // Tailuge knuckle principle: rounded protrusions at each pocket mouth.
   for(const k of jaws){
    offer(circleTime(a.x-k.x,a.y-k.y,a.vx,a.vy,R+k.radius,remaining),'jaw',a,k);
   }
   for(const f of facings){const hit=facingTime(a,f,remaining);if(hit)offer(hit.time,'facing',a,f,hit.nx,hit.ny);}
  }
  if(!best){advance(balls,remaining);remaining=0;break;}
  advance(balls,best.time);
  remaining=Math.max(0,remaining-best.time);
  const {a,b,type,nx,ny}=best;
  if(type==='pocket'){
   a.pocketed=true;a.vx=0;a.vy=0;a.wx=0;a.wy=0;a.wz=0;a.motion='stationary';
   pocketed.push(a.id);pocketEvents.push({id:a.id,pocketId:b.id});
  }else if(type==='ball'){
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
   const overlap=2*R-d,ux=dx/d,uy=dy/d;
   if(overlap>0){a.x-=ux*(overlap/2+1e-5);a.y-=uy*(overlap/2+1e-5);
    b.x+=ux*(overlap/2+1e-5);b.y+=uy*(overlap/2+1e-5);}
   if(ballCollision(a,b))contacts.push([a.id,b.id]);
  }else if(type==='rail'){
   cushionBounce(a,nx,ny);
   // Post-collision project onto the same rail nose used for rendering.
   if(nx)a.x=nx>0?Math.max(a.x,2*R):Math.min(a.x,W-2*R);
   if(ny)a.y=ny>0?Math.max(a.y,2*R):Math.min(a.y,H-2*R);
  }else if(type==='facing'){
   cushionBounce(a,nx,ny);
   a.x+=nx*1e-3;a.y+=ny*1e-3;
  }else if(type==='jaw'){
   const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;
   const ux=dx/d,uy=dy/d;
   a.x=b.x+ux*(R+b.radius+1e-4);
   a.y=b.y+uy*(R+b.radius+1e-4);
   cushionBounce(a,ux,uy);
  }
 }
 // An event cap should never freeze a rack; safely finish the remaining step.
 if(remaining>1e-8)advance(balls,remaining);
 for(const b of balls){
  if(b.pocketed)continue;
  advanceFriction(b,dt,STOP);
  // If a ball went behind an uncovered jaw, recover it instead of letting it
  // drift offscreen forever. Pocket capture is always handled first.
  if(b.x<-R||b.x>W+R||b.y<-R||b.y>H+R){
   b.x=clamp(b.x,2*R,W-2*R);b.y=clamp(b.y,2*R,H-2*R);
   b.vx=0;b.vy=0;b.wx=0;b.wy=0;b.wz=0;
  }
 }
 return{pocketed,contacts,pocketEvents};
}
export function clearShot(balls,from,to,excluded=[]){
 const dx=to.x-from.x,dy=to.y-from.y,len2=dx*dx+dy*dy;if(!len2)return false;
 return balls.every(b=>{
  if(b.pocketed||excluded.includes(b.id))return true;
  const t=clamp(((b.x-from.x)*dx+(b.y-from.y)*dy)/len2,0,1);
  return Math.hypot(b.x-(from.x+t*dx),b.y-(from.y+t*dy))>R*2.15;
 });
}
