/** One deliberately tiny, fixed-version, physics-backed Squatch Arcade challenge. */
import {ball} from './physics.js';
import {setTableSize,TABLE} from './table-geometry.js';
export const ARCADE_CHALLENGE=Object.freeze({
 id:'corner-pocket-1',version:1,title:'The First Corner',
 description:'Sink the 1-ball in the top-left corner in 3 shots or fewer. No scratches.',
 shots:3,tableSize:7,ballId:1,pocketId:'TL'
});
export function setupArcadeChallenge(){
 setTableSize(ARCADE_CHALLENGE.tableSize);
 // Aligned diagonally with a clear lane to top-left. The target is not in the pocket.
 return [ball(0,260,260),ball(1,112,112)];
}
export function judgeArcadeShot(events,shotsUsed){
 if(!Array.isArray(events)||!Number.isInteger(shotsUsed)||shotsUsed<1)throw new TypeError('Invalid shot events');
 const pocketed=events.filter(e=>e.type==='pocket');
 const scratch=pocketed.some(e=>e.ballId===0);
 const goal=pocketed.some(e=>e.ballId===ARCADE_CHALLENGE.ballId&&e.pocketId===ARCADE_CHALLENGE.pocketId);
 const wrong=pocketed.some(e=>e.ballId===ARCADE_CHALLENGE.ballId&&e.pocketId!==ARCADE_CHALLENGE.pocketId);
 if(scratch||wrong)return{status:'lost',reason:scratch?'Scratch! The cue ball went down.':'The 1-ball went in the wrong pocket.'};
 if(goal&&shotsUsed<=ARCADE_CHALLENGE.shots)return{status:'won',reason:'Perfect! The 1-ball found the top-left corner.'};
 if(shotsUsed>=ARCADE_CHALLENGE.shots)return{status:'lost',reason:'Out of shots. Reset and try another angle.'};
 return{status:'continue',reason:'Keep going — '+(ARCADE_CHALLENGE.shots-shotsUsed)+' shot(s) left.'};
}
export function arcadeAimAngle(balls){
 const cue=balls.find(b=>b.id===0),target=balls.find(b=>b.id===1);
 return Math.atan2(target.y-cue.y,target.x-cue.x);
}
