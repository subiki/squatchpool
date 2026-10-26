export const TABLE={width:1000,height:500,radius:11,pocketRadius:28};
const RESTITUTION=.94,RAIL=.83,STOP=5,FRICTION=.991;
export const pockets=[{x:0,y:0},{x:500,y:0},{x:1000,y:0},{x:0,y:500},{x:500,y:500},{x:1000,y:500}];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ball=(id,x,y)=>({id,x,y,vx:0,vy:0,pocketed:false});
export const stationary=balls=>balls.every(b=>b.pocketed||Math.hypot(b.vx,b.vy)<STOP);
export function canPlace(balls,x,y,ignoreId=null){
 const r=TABLE.radius;
 if(x<r+10||x>TABLE.width-r-10||y<r+10||y>TABLE.height-r-10)return false;
 if(pockets.some(p=>Math.hypot(x-p.x,y-p.y)<TABLE.pocketRadius+r+4))return false;
 return balls.every(b=>b.pocketed||b.id===ignoreId||Math.hypot(b.x-x,b.y-y)>=2*r+2);
}
export function findPlacement(balls,preferred={x:260,y:250}){
 if(canPlace(balls,preferred.x,preferred.y))return preferred;
 for(let radius=26;radius<=400;radius+=26)for(let i=0;i<36;i++){
  const angle=i*Math.PI/18,x=preferred.x+Math.cos(angle)*radius,y=preferred.y+Math.sin(angle)*radius;
  if(canPlace(balls,x,y))return{x,y};
 }return null;
}
export function rack(){
 const balls=[ball(0,255,250)];
 const numbers=[1,10,3,12,8,2,9,11,4,13,5,14,6];let index=0;
 for(let row=0;row<5;row++)for(let column=0;column<=row;column++){
  if(row===4&&(column===0||column===4))continue;
  balls.push(ball(numbers[index++],695+row*19.4,250+(column-row/2)*22.9));
 }
 return balls;
}
export function step(balls,dt=1/120){
 const pocketed=[],contacts=[];
 for(const b of balls){
  if(b.pocketed)continue;
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(pockets.some(p=>Math.hypot(b.x-p.x,b.y-p.y)<TABLE.pocketRadius)){
   b.pocketed=true;b.vx=0;b.vy=0;pocketed.push(b.id);continue;
  }
  const r=TABLE.radius;
  if(b.x<r){b.x=r;b.vx=Math.abs(b.vx)*RAIL}
  if(b.x>TABLE.width-r){b.x=TABLE.width-r;b.vx=-Math.abs(b.vx)*RAIL}
  if(b.y<r){b.y=r;b.vy=Math.abs(b.vy)*RAIL}
  if(b.y>TABLE.height-r){b.y=TABLE.height-r;b.vy=-Math.abs(b.vy)*RAIL}
  const f=Math.pow(FRICTION,dt*120);b.vx*=f;b.vy*=f;
  if(Math.hypot(b.vx,b.vy)<STOP){b.vx=0;b.vy=0}
 }
 for(let i=0;i<balls.length;i++){
  const a=balls[i];if(a.pocketed)continue;
  for(let j=i+1;j<balls.length;j++){
   const b=balls[j];if(b.pocketed)continue;
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=2*TABLE.radius;
   if(d>=min)continue;
   const nx=d>.0001?dx/d:1,ny=d>.0001?dy/d:0,overlap=min-d;
   a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;
   const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(relative<0){
    const impulse=-(1+RESTITUTION)*relative/2;
    a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;
    contacts.push([a.id,b.id]);
   }
  }
 }
 return{pocketed,contacts};
}
export function clearShot(balls,from,to,excluded=[]){
 const dx=to.x-from.x,dy=to.y-from.y,len2=dx*dx+dy*dy;if(!len2)return false;
 return balls.every(b=>{
  if(b.pocketed||excluded.includes(b.id))return true;
  const t=clamp(((b.x-from.x)*dx+(b.y-from.y)*dy)/len2,0,1);
  return Math.hypot(b.x-(from.x+t*dx),b.y-(from.y+t*dy))>TABLE.radius*2.15;
 });
}
