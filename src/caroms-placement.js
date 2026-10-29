/** Safe placement for Caroms' white-ball scratches and option fouls.
 * Temporarily hide the ball from collision checks, but never lose a live ball
 * when a legal center placement cannot be found.
 */
import {TABLE,findPlacement} from './physics.js';

export function respotCaromsBall(balls,id,placementFinder=findPlacement){
 const b=balls.find(ball=>ball.id===id);
 if(!b)return false;
 const wasPocketed=b.pocketed;
 b.pocketed=true;
 let point;
 try{
  point=placementFinder(balls,{x:TABLE.width/2,y:TABLE.height/2});
 }catch(error){
  b.pocketed=wasPocketed;
  throw error;
 }
 if(!point){
  b.pocketed=wasPocketed;
  return false;
 }
 Object.assign(b,{...point,pocketed:false,vx:0,vy:0,wx:0,wy:0,wz:0,motion:'stationary'});
 return true;
}
