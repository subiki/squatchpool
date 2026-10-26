/**
 * Squatch Pool integration for Tailuge's billiards-specific GPL-3.0 physics.
 * Reuses Tailuge's real collision-throw, sliding/rolling, spin and cushion models.
 * This adapter supplies continuous time-of-impact detection for our six pocket
 * table and preserves the public game API used by the rules and UI.
 */
import { ballCollision, cushionBounce, advanceFriction, applyCueSpin as setCueSpin }
  from './vendor/tailuge-physics.js';
export { setCueSpin as applyCueSpin };
export const TABLE = { width:1000, height:500, radius:11, pocketRadius:23 };
const R=TABLE.radius, W=TABLE.width, H=TABLE.height, STOP=5;
export const cushions=[
 {x1:34,y1:R,x2:W/2-26,y2:R},
 {x1:W/2+26,y1:R,x2:W-34,y2:R},
 {x1:34,y1:H-R,x2:W/2-26,y2:H-R},
 {x1:W/2+26,y1:H-R,x2:W-34,y2:H-R},
 {x1:R,y1:34,x2:R,y2:H-34},
 {x1:W-R,y1:34,x2:W-R,y2:H-34},
];
export const pockets=[
 {x:0,y:0,radius:22},{x:W/2,y:0,radius:26},
 {x:W,y:0,radius:22},{x:0,y:H,radius:22},
 {x:W/2,y:H,radius:26},{x:W,y:H,radius:22},
];
// Tailuge Knuckle: pocket cushion tips are circular obstacles, unlike the
// previous Planck open-edge segments that let glancing balls escape the table.
const jaws=[...new Map(cushions.flatMap(c=>[
 [c.x1+','+c.y1,{x:c.x1,y:c.y1}],
 [c.x2+','+c.y2,{x:c.x2,y:c.y2}],
])).values()];
const JAW_RADIUS=3;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ball=(id,x,y)=>({id,x,y,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary',pocketed:false});
export const stationary=balls=>balls.every(b=>b.pocketed||Math.hypot(b.vx,b.vy)<STOP);
export function canPlace(balls,x,y,ignoreId=null){
 const inset=2*R+1;
 if(x<inset||x>W-inset||y<inset||y>H-inset)return false;
 if(pockets.some(p=>Math.hypot(x-p.x,y-p.y)<p.radius+R+3))return false;
 return balls.every(b=>b.pocketed||b.id===ignoreId||Math.hypot(b.x-x,b.y-y)>=2*R+2);
}
export function findPlacement(balls,preferred={x:260,y:250}){
 if(canPlace(balls,preferred.x,preferred.y))return preferred;
 for(let radius=26;radius<=400;radius+=26)for(let i=0;i<36;i++){
  const angle=i*Math.PI/18,x=preferred.x+Math.cos(angle)*radius,y=preferred.y+Math.sin(angle)*radius;
  if(canPlace(balls,x,y))return{x,y};
 }
 return null;
}
export function rack(){
 const balls=[ball(0,255,250)],numbers=[1,10,3,12,8,2,9,11,4,13,5,14,6];let index=0;
 for(let row=0;row<5;row++)for(let column=0;column<=row;column++){
  if(row===4&&(column===0||column===4))continue;
  balls.push(ball(numbers[index++],695+row*19.4,250+(column-row/2)*22.9));
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
function advance(balls,time){
 if(time<=0)return;
 for(const b of balls)if(!b.pocketed){b.x+=b.vx*time;b.y+=b.vy*time;}
}
const valid=b=>!b.pocketed&&Number.isFinite(b.x+b.y+b.vx+b.vy);
export function step(balls,dt=1/120){
 const pocketed=[],contacts=[];
 if(!(dt>0))return{pocketed,contacts};
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
   // Six real pocket mouths.
   for(const p of pockets){
    if(Math.hypot(a.x-p.x,a.y-p.y)<p.radius-1e-6){offer(0,'pocket',a,p);continue;}
    offer(circleTime(a.x-p.x,a.y-p.y,a.vx,a.vy,p.radius,remaining),'pocket',a,p);
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
    offer(circleTime(a.x-k.x,a.y-k.y,a.vx,a.vy,R+JAW_RADIUS,remaining),'jaw',a,k);
   }
  }
  if(!best){advance(balls,remaining);remaining=0;break;}
  advance(balls,best.time);
  remaining=Math.max(0,remaining-best.time);
  const {a,b,type,nx,ny}=best;
  if(type==='pocket'){
   a.pocketed=true;a.vx=0;a.vy=0;a.wx=0;a.wy=0;a.wz=0;a.motion='stationary';
   pocketed.push(a.id);
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
  }else if(type==='jaw'){
   const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;
   const ux=dx/d,uy=dy/d;
   a.x=b.x+ux*(R+JAW_RADIUS+1e-4);
   a.y=b.y+uy*(R+JAW_RADIUS+1e-4);
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
 return{pocketed,contacts};
}
export function clearShot(balls,from,to,excluded=[]){
 const dx=to.x-from.x,dy=to.y-from.y,len2=dx*dx+dy*dy;if(!len2)return false;
 return balls.every(b=>{
  if(b.pocketed||excluded.includes(b.id))return true;
  const t=clamp(((b.x-from.x)*dx+(b.y-from.y)*dy)/len2,0,1);
  return Math.hypot(b.x-(from.x+t*dx),b.y-(from.y+t*dy))>R*2.15;
 });
}
