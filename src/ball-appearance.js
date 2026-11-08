/**
 * Presentation-only billiard ball palettes.
 *
 * Big Tuna uses the real numbered 1–15 solids/stripes.
 * But Wait uses a deliberately simple two-team palette so the special
 * solids/stripes strategy is readable at a glance.
 * Keep the cue ball and 8-ball neutral in either game.
 */
export const REAL_BALL_COLORS=Object.freeze([
 '#f7f5e9', // cue
 '#f2c43c', // 1 yellow
 '#286bc0', // 2 blue
 '#ce353c', // 3 red
 '#663a9c', // 4 purple
 '#ed812b', // 5 orange
 '#218653', // 6 green
 '#80314b', // 7 maroon
 '#16191d', // 8 black
 '#f2c43c', // 9 yellow stripe
 '#286bc0', // 10 blue stripe
 '#ce353c', // 11 red stripe
 '#663a9c', // 12 purple stripe
 '#ed812b', // 13 orange stripe
 '#218653', // 14 green stripe
 '#80314b', // 15 maroon stripe
]);
export const TEAM_BALL_COLORS=Object.freeze({
 solid:'#eaba3f',stripe:'#337ad2',eight:'#16191d',cue:'#f7f5e9'
});
export function ballFillColor(id,palette='realistic'){
 if(id===0)return REAL_BALL_COLORS[0];
 if(id===8)return REAL_BALL_COLORS[8];
 if(!Number.isInteger(id)||id<1||id>15)return REAL_BALL_COLORS[0];
 return palette==='teams'?(id<=7?TEAM_BALL_COLORS.solid:TEAM_BALL_COLORS.stripe):
  REAL_BALL_COLORS[id];
}
/**
 * Draw one numbered ball, using Canvas state so subsequent aiming guides,
 * pocket highlights and overlays are never affected by this style.
 */
export function drawPoolBall(ctx,ball,radius,palette='realistic'){
 if(!ball||ball.pocketed||!(radius>0))return;
 const {x,y,id}=ball,r=radius;
 ctx.save();
 // Felt shadow grounds each ball while preserving the physical diameter.
 ctx.fillStyle='#07140e88';
 ctx.beginPath();ctx.ellipse(x+1.8,y+2.7,r+1.1,r*.81,0,0,Math.PI*2);ctx.fill();
 ctx.translate(x,y);
 ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);
 ctx.fillStyle=ballFillColor(id,palette);ctx.fill();
 ctx.save();ctx.clip();
 if(id>=9){
  // Both the simplified team stripe and the real stripe stay legible.
  ctx.fillStyle='#faf8ef';
  ctx.fillRect(-r,-r*.45,r*2,r*.9);
 }
 const shade=ctx.createRadialGradient(-r*.35,-r*.48,r*.05,-r*.08,-r*.1,r*1.37);
 shade.addColorStop(0,'#ffffffa4');
 shade.addColorStop(.34,'#ffffff15');
 shade.addColorStop(.7,'#00000004');
 shade.addColorStop(1,'#00000080');
 ctx.fillStyle=shade;ctx.fillRect(-r,-r,r*2,r*2);
 ctx.restore();
 if(id!==0){
  const disk=r*.41;
  ctx.fillStyle='#fdfbef';ctx.beginPath();ctx.arc(0,0,disk,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#17181b';
  ctx.font='bold '+Math.max(8,r*(id>=10?.62:.83))+'px system-ui';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(String(id),0,r*.035);
 }
 ctx.restore();
}
