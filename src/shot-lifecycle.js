import {TABLE,canPlaceBreakCue,kitchenPoint,headStringX,canPlace} from './physics.js';

// Shared shot phases; mode-specific rules decide the outcome of each settled shot.
export function createShotLifecycle(){
 let phase='ready',breakShot=false;
 return {
  get phase(){return phase;},
  get breakShot(){return breakShot;},
  startRack(){phase='aim';breakShot=true;},
  startShot(){if(phase!=='aim')return false;phase='moving';return true;},
  settle({done=false,ballInHand=false}={}){
   if(phase!=='moving')return false;
   breakShot=false;
   phase=done?'done':ballInHand?'place':'aim';
   return true;
  },
  confirmPlacement(){if(phase!=='place')return false;phase='aim';return true;},
 };
}

// Pointer coordinates are in canvas/table units. Breaks never require a second
// confirmation: the cue starts legally positioned, and release returns to aim.
export function createCuePlacement({getBalls,getCue}){
 let dragging=false;
 function placeBreak(point){
  const p=kitchenPoint(point.x,point.y);
  if(!canPlaceBreakCue(getBalls(),p.x,p.y))return false;
  Object.assign(getCue(),p);
  return true;
 }
 function pointerDown(point){
  const cue=getCue();
  if(point.x>=headStringX()&&Math.hypot(point.x-cue.x,point.y-cue.y)>TABLE.radius*2.5)return false;
  dragging=true;
  placeBreak(point);
  return true;
 }
 function pointerMove(point){
  if(!dragging)return false;
  placeBreak(point);
  return true;
 }
 function pointerUp(){const wasDragging=dragging;dragging=false;return wasDragging;}
 function placeBallInHand(point){
  if(!canPlace(getBalls(),point.x,point.y,0))return false;
  Object.assign(getCue(),point);
  return true;
 }
 return {placeBreak,pointerDown,pointerMove,pointerUp,placeBallInHand};
}
