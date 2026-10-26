// Pure coordinate adapter shared by the Classic and Jungle presentations.
// No physics or rule state is copied, owned or advanced by this file.
export const WORLD_SCALE=50;
export const BALL_COLORS=[
 '#fffdf3','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39',
 '#161819','#e6be36','#2f67c5','#d34440','#663f96','#e59538','#267b50','#762f39'
];
export function tableToWorld(ball){
 if(!Number.isFinite(ball.x)||!Number.isFinite(ball.y))throw new TypeError('Invalid table position');
 return{x:(ball.x-500)/WORLD_SCALE,z:(ball.y-250)/WORLD_SCALE};
}
export function worldToTable(world){
 if(!Number.isFinite(world.x)||!Number.isFinite(world.z))throw new TypeError('Invalid world position');
 return{x:world.x*WORLD_SCALE+500,y:world.z*WORLD_SCALE+250};
}
export function ballFingerprint(state){
 // Useful for verifying presentation switches do not touch canonical state.
 return JSON.stringify({
  balls:state.balls.map(b=>[b.id,b.x,b.y,b.vx,b.vy,b.pocketed]),
  turn:state.turn,groups:state.groups,phase:state.phase,shotNumber:state.shotNumber,
  deployed:state.deployed,pendingStash:state.pendingStash,winner:state.winner
 });
}
