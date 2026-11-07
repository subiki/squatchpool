import {TABLE,pockets,clearShot} from './physics.js';

// A scoring Caroms stroke glances off white, then the STRUCK ball follows
// the tangent towards its called pocket. White is never a combo source.
export function planCaromsPot(balls,candidates){
 const white=balls.find(b=>b.id===0&&!b.pocketed);
 if(!white)return null;
 const radius=TABLE.radius*2;
 let best=null;
 for(const ball of candidates){
  if(ball.id===0||ball.pocketed)continue;
  for(const pocket of pockets){
   const dx=pocket.x-white.x,dy=pocket.y-white.y,d2=dx*dx+dy*dy;
   if(d2<=radius*radius)continue;
   const a=radius*radius/d2,b=radius*Math.sqrt(d2-radius*radius)/d2;
   for(const sign of [-1,1]){
    const contact={x:white.x+a*dx-sign*b*dy,y:white.y+a*dy+sign*b*dx};
    if(contact.x<2*TABLE.radius||contact.y<2*TABLE.radius||
       contact.x>TABLE.width-2*TABLE.radius||contact.y>TABLE.height-2*TABLE.radius)continue;
    const ix=contact.x-ball.x,iy=contact.y-ball.y,length=Math.hypot(ix,iy);
    if(length<radius)continue;
    const ux=ix/length,uy=iy/length,nx=(white.x-contact.x)/radius,ny=(white.y-contact.y)/radius;
    const normal=ux*nx+uy*ny;
    if(normal<.15||normal>.9)continue;
    const tx=ux-normal*nx,ty=uy-normal*ny;
    const ox=pocket.x-contact.x,oy=pocket.y-contact.y,outLength=Math.hypot(ox,oy);
    const retained=(tx*ox+ty*oy)/outLength;
    if(retained<.4)continue;
    if(!clearShot(balls,ball,contact,[0,ball.id])||!clearShot(balls,contact,pocket,[0,ball.id]))continue;
    const score=length+outLength/(retained*retained);
    if(!best||score<best.score)best={ballId:ball.id,pocketId:pocket.id,
     // Glancing contact retains only part of the incoming speed.
     angle:Math.atan2(iy,ix),power:95,score};
   }
  }
 }
 return best;
}
