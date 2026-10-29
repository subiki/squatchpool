/** Press Your Luck provisional scoring primitive, from 2024 brainstorming.
 * Original: opponent ball +1, 8 +2, bank final 8 doubles points,
 * failure to pocket the 8 forfeits unbanked points.
 * No invented canonical foul or rack-winning rules.
 */
export function startPressYourLuck(){
 return {unbanked:0,banked:0,finished:false,outcome:null};
}
export function pressYourLuckShot(state,{opponentBalls=0,eightPocketed=false,eightBanked=false,forfeit=false}={}){
 if(state.finished)throw new Error('Rack already resolved');
 if(!Number.isInteger(opponentBalls)||opponentBalls<0)throw new Error('Invalid opponent ball count');
 if(eightBanked&&!eightPocketed)throw new Error('Cannot bank an unpocketed 8');
 if(forfeit&&(eightPocketed||opponentBalls))throw new Error('Forfeit cannot also score');
 if(forfeit)return {...state,unbanked:0,finished:true,outcome:'forfeit'};
 const unbanked=state.unbanked+opponentBalls;
 if(!eightPocketed)return {...state,unbanked};
 const points=(unbanked+2)*(eightBanked?2:1);
 return {...state,unbanked:0,banked:state.banked+points,finished:true,
  outcome:eightBanked?'banked-eight':'eight'};
}
