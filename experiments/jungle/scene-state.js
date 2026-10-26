import {rack,step,stationary,findPlacement,clamp} from '../../src/physics.js';
export const WORLD={scale:100,ballHeight:1.53};
export const toWorld=ball=>({x:(ball.x-500)/100,y:WORLD.ballHeight,z:(ball.y-250)/100});
export const toTable=point=>({x:point.x*100+500,y:point.z*100+250});
export function makePreview(){
 return {balls:rack(),phase:'aim',angle:0,power:65,shots:0,stoppedFrames:0,shotTime:0,view:'cinematic',lastPots:[]};
}
export function changeView(state,next){
 if(next!=='cinematic'&&next!=='overhead')throw Error('Unknown view: '+next);
 state.view=next;
 return state;
}
export function shootPreview(state){
 if(state.phase!=='aim')return false;
 const cue=state.balls.find(b=>b.id===0);
 if(!cue||cue.pocketed)return false;
 const speed=240+11*clamp(state.power,15,100);
 cue.vx=Math.cos(state.angle)*speed;cue.vy=Math.sin(state.angle)*speed;
 state.phase='moving';state.shots++;state.stoppedFrames=0;state.shotTime=0;state.lastPots=[];
 return true;
}
export function advancePreview(state,dt=1/120){
 if(state.phase!=='moving')return {done:false,pocketed:[]};
 const result=step(state.balls,dt);
 state.lastPots.push(...result.pocketed);
 state.shotTime+=dt;
 state.stoppedFrames=stationary(state.balls)?state.stoppedFrames+1:0;
 const done=state.stoppedFrames>24||state.shotTime>20;
 if(done){
  for(const b of state.balls){b.vx=0;b.vy=0;}
  const cue=state.balls.find(b=>b.id===0);
  if(cue.pocketed){
   const preferred=findPlacement(state.balls,{x:250,y:250});
   if(preferred){cue.pocketed=false;cue.x=preferred.x;cue.y=preferred.y;}
  }
  state.phase='aim';
 }
 return {done,pocketed:result.pocketed};
}
