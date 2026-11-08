// Predict deterministic Chaos Pool movement with the same integration, drag,
// cushions, bumper response and ball collision math used by the live sandbox.
// Stochastic modifiers are intentionally excluded from the guaranteed forecast.
import {applyForces} from './chaos-mechanics.js';
const W=960,H=520,R=13;
export const POCKETS=[[28,28],[480,22],[932,28],[28,492],[480,498],[932,492]];
const speed=b=>Math.hypot(b.vx,b.vy);
export function predictShot(source,bumpers,mods,aim,power,{maxSteps=3600}={}){
 if(!source.length)return null;
 const balls=source.map(b=>({...b})),paths=balls.map(b=>[[b.x,b.y]]);
 const alive=new Set(balls);let firstHit=null,firstCueHit=null;
 const world={balls,bumpers,mods,events:[],stage:0,shots:1,pockets:POCKETS};
 balls[0].vx=aim.x*(3+power*16);balls[0].vy=aim.y*(3+power*16);
 const railHits=[];
 for(let step=0;step<maxSteps;step++){
  let active=false;
  for(const b of balls){
   if(!alive.has(b))continue;
   if(mods.gravity)b.vx+=.035;
   applyForces(world,b,1);
   if(b.portalCooldown>0)b.portalCooldown--;
   if(mods.magnet){const dx=W/2-b.x,dy=H/2-b.y,d=Math.hypot(dx,dy)||1;b.vx+=dx/d*.05;b.vy+=dy/d*.05;}
   b.x+=b.vx;b.y+=b.vy;b.vx*=.988;b.vy*=.988;
   if(speed(b)>.25)active=true;
   if((b.portalCooldown||0)<=0&&POCKETS.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<25))continue;
   const restitution=mods.bounce?1.16:.87;
   if(b.x<R+24||b.x>W-R-24){b.x=Math.max(R+24,Math.min(W-R-24,b.x));b.vx*=-restitution;railHits.push([b.x,b.y]);}
   if(b.y<R+24||b.y>H-R-24){b.y=Math.max(R+24,Math.min(H-R-24,b.y));b.vy*=-restitution;railHits.push([b.x,b.y]);}
   if(mods.pinball)for(const p of bumpers){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||.001;if(d<R+p.r){const nx=dx/d,ny=dy/d,impact=b.vx*nx+b.vy*ny;b.x=p.x+nx*(R+p.r);b.y=p.y+ny*(R+p.r);b.vx-=2*impact*nx;b.vy-=2*impact*ny;b.vx+=nx*2;b.vy+=ny*2;}}
  }
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
   const a=balls[i],b=balls[j];if(!alive.has(a)||!alive.has(b))continue;
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;
   if(d<R*2){const nx=dx/d,ny=dy/d,over=(R*2-d)/2;a.x-=nx*over;b.x+=nx*over;a.y-=ny*over;b.y+=ny*over;
    const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(rel<0){if(!firstHit)firstHit={x:a.x+nx*R,y:a.y+ny*R,indices:[i,j]};if(!firstCueHit&&(i===0||j===0))firstCueHit={x:balls[0].x,y:balls[0].y,other:i===0?j:i};const imp=-rel*.94;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny;}
   }
  }
  for(let i=balls.length-1;i>=0;i--){const b=balls[i];if(!alive.has(b))continue;
   if((b.portalCooldown||0)<=0&&POCKETS.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<22)){
    alive.delete(b);if(i===0){b.x=205;b.y=260;b.vx=0;b.vy=0;}
   }
  }
  for(let i=0;i<balls.length;i++){const b=balls[i];if(alive.has(b)&& (step%3===0||!active))paths[i].push([b.x,b.y]);}
  if(!active&&step>8)break;
 }
 return {paths,firstHit,firstCueHit,railHits,cueLanding:alive.has(balls[0])?[balls[0].x,balls[0].y]:null,balls,stochastic:!!(mods.roulette||mods.portals||mods.multiball||mods.split||mods.sabotage)};
}
