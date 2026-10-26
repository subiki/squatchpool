/**
 * One shared physical + visual pool table geometry, scaled from WPA equipment
 * specifications: 100 x 50 in nose-to-nose 9-ft playing area, 2.25-in balls,
 * 4.5–4.625-in corner mouths, 5–5.125-in side mouths.
 * https://www.wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf
 *
 * Mouth widths are measured between cushion-nose tips, NOT hole diameters.
 * At the corner the measurement is diagonal. Pockets are capture planes
 * behind lips, never circles centered on the outside edge of the felt.
 * Scaled to the existing 1000 x 500 logical Canvas (100 x 50 playing area
 * between nose coordinates x/y = 11 and width/height-11, within 2%).
 */
export const TABLE={width:1000,height:500,radius:11};
export const PX_PER_IN=(TABLE.width-2*TABLE.radius)/100;
export const BALL_DIAMETER_IN=2.25;
export const CORNER_MOUTH_IN=4.56;
export const SIDE_MOUTH_IN=5.06;
export const CORNER_SHELF_IN=1.35;
export const SIDE_SHELF_IN=0.25;
const {width:W,height:H,radius:R}=TABLE;
const cornerProjection=CORNER_MOUTH_IN*PX_PER_IN/Math.SQRT2;
const sideHalf=SIDE_MOUTH_IN*PX_PER_IN/2;
const cornerLip=R+cornerProjection;
const cornerLine=cornerLip+R;
export const cushions=[
 {x1:cornerLip,y1:R,x2:W/2-sideHalf,y2:R},
 {x1:W/2+sideHalf,y1:R,x2:W-cornerLip,y2:R},
 {x1:cornerLip,y1:H-R,x2:W/2-sideHalf,y2:H-R},
 {x1:W/2+sideHalf,y1:H-R,x2:W-cornerLip,y2:H-R},
 {x1:R,y1:cornerLip,x2:R,y2:H-cornerLip},
 {x1:W-R,y1:cornerLip,x2:W-R,y2:H-cornerLip},
];
// IDs are stable rules/UI keys. Side pockets capture behind a narrow throat;
// corner pockets capture after crossing the diagonal between both cushion tips.
export const pockets=[
 {id:'TL',label:'Top left',kind:'corner',x:0,y:0,sx:1,sy:1,lip:cornerLip},
 {id:'TM',label:'Top middle',kind:'side',x:W/2,y:0,sy:1,half:sideHalf},
 {id:'TR',label:'Top right',kind:'corner',x:W,y:0,sx:-1,sy:1,lip:cornerLip},
 {id:'BL',label:'Bottom left',kind:'corner',x:0,y:H,sx:1,sy:-1,lip:cornerLip},
 {id:'BM',label:'Bottom middle',kind:'side',x:W/2,y:H,sy:-1,half:sideHalf},
 {id:'BR',label:'Bottom right',kind:'corner',x:W,y:H,sx:-1,sy:-1,lip:cornerLip},
];
export const jaws=cushions.flatMap(c=>[
 {x:c.x1,y:c.y1,radius:2.5},{x:c.x2,y:c.y2,radius:2.5},
]);
export function mouthWidth(p){
 return p.kind==='side'?2*p.half:Math.SQRT2*(p.lip-R);
}
export function pocketCaptureTime(ball,p,maxT){
 const vx=ball.vx,vy=ball.vy;
 if(p.kind==='side'){
  const inV=p.sy*vy;
  if(inV>=-1e-9)return null;
  // Crossing into the throat (roughly one-half ball radius behind the lip).
  const plane=R+R*0.5,t=(plane-p.sy*(ball.y-p.y))/inV;
  if(t<-1e-8||t>maxT+1e-8)return null;
  const x=ball.x+vx*Math.max(0,t);
  return Math.abs(x-p.x)<=p.half-R*0.63?Math.max(0,t):null;
 }
 const u=p.sx*(ball.x-p.x),v=p.sy*(ball.y-p.y);
 const du=p.sx*vx,dv=p.sy*vy,sum=du+dv;
 if(sum>=-1e-9)return null;
 const t=(cornerLine-u-v)/sum;
 if(t<-1e-8||t>maxT+1e-8)return null;
 const hitU=u+du*Math.max(0,t),hitV=v+dv*Math.max(0,t);
 // Avoid illegitimate pockets after travelling behind the lip outside jaws.
 const min=R*0.65,max=p.lip+R*0.35;
 if(hitU<min||hitV<min||hitU>max||hitV>max)return null;
 return Math.max(0,t);
}
export function renderPocket(ctx,p){
 // Dark holes live behind the actual cushion lips; never draw an oversized
 // circle over the playable felt.
 ctx.save();ctx.fillStyle='#05140e';ctx.strokeStyle='#9a7048';ctx.lineWidth=2;
 ctx.beginPath();
 if(p.kind==='side'){
  const left=p.x-p.half,right=p.x+p.half,y=p.sy>0?0:H,lip=y+p.sy*R;
  ctx.moveTo(left,lip);ctx.lineTo(right,lip);
  ctx.lineTo(right+p.half*0.07,y);ctx.lineTo(left-p.half*0.07,y);
 }else{
  const x=p.x,y=p.y;
  ctx.moveTo(x,y);
  ctx.lineTo(x+p.sx*p.lip,y+p.sy*R);
  ctx.quadraticCurveTo(x+p.sx*(R+4),y+p.sy*(R+4),x+p.sx*R,y+p.sy*p.lip);
 }
 ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
