/**
 * Shared Canvas 2D presentation for the five original games.
 * Physics, legal shot selection, and mode-specific overlays live elsewhere.
 * Pass the mutable TABLE/pockets/cushions references so 7/8/9-ft resizing
 * remains authoritative in table-geometry.js.
 */
export function createTableRenderer({table,pockets,cushions,renderPocket}){
 // Shared surface accepts mode-specific paint without duplicating regulation geometry.
 // The afterPockets hook keeps But Wait's detailed pocket facings below the cushions.
 function drawSurface(ctx,{cloth='#155f49',rail='#76563a',cushion='#c59a61',cushionWidth=2,afterPockets}={}){
  const {width:w,height:h,radius:r}=table;
  ctx.fillStyle=cloth;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=rail;
  ctx.fillRect(0,0,w,r);ctx.fillRect(0,h-r,w,r);
  ctx.fillRect(0,0,r,h);ctx.fillRect(w-r,0,r,h);
  for(const pocket of pockets)renderPocket(ctx,pocket);
  afterPockets?.(ctx);
  ctx.strokeStyle=cushion;ctx.lineWidth=cushionWidth;ctx.beginPath();
  for(const edge of cushions){
   ctx.moveTo(edge.x1,edge.y1);ctx.lineTo(edge.x2,edge.y2);
  }
  ctx.stroke();
 }
 // A game may supply detailed ball artwork; hidden/pocketed balls never render.
 function drawBalls(ctx,balls,customDrawBall){
  for(const ball of balls){
   if(ball.pocketed)continue;
   if(customDrawBall){customDrawBall(ball,ctx);continue;}
   const r=table.radius;
   ctx.beginPath();ctx.arc(ball.x,ball.y,r,0,Math.PI*2);
   ctx.fillStyle=ball.id===0?'#fff':ball.id===8?'#111':ball.id<=7?'#ddac4b':'#477fc0';
   ctx.fill();ctx.strokeStyle='#ffffff99';ctx.stroke();
   if(ball.id){
    ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 11px system-ui';ctx.fillText(ball.id,ball.x,ball.y);
   }
  }
 }
 function drawTable(ctx,balls){drawSurface(ctx);drawBalls(ctx,balls);}
 // Explicit striker supports Caroms object-ball shots (not always ball 0).
 function drawAim(ctx,striker,angle){
  if(!striker||striker.pocketed)return;
  const r=table.radius,dx=Math.cos(angle),dy=Math.sin(angle);
  ctx.strokeStyle='#f4e1a3';ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(striker.x+dx*r,striker.y+dy*r);
  ctx.lineTo(striker.x+dx*240,striker.y+dy*240);ctx.stroke();
  ctx.strokeStyle='#d6aa70';ctx.lineWidth=5;ctx.beginPath();
  ctx.moveTo(striker.x-dx*(r+15),striker.y-dy*(r+15));
  ctx.lineTo(striker.x-dx*(r+140),striker.y-dy*(r+140));ctx.stroke();
 }
 return {drawSurface,drawBalls,drawTable,drawAim};
}
