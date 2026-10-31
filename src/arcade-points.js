/** Squatch Points Arcade M1 — browser-local PLAYTEST economy, not a currency. */
export const ARCADE_STORAGE_KEY='squatch-arcade-local-v1';
export const ARCADE_COST=10;
export const ARCADE_JACKPOT_SHARE=7;
export const ARCADE_CREATOR_SHARE=2;
export const ARCADE_BURN_SHARE=1;
export const PRACTICE_REWARD=5;
export const PRACTICE_DAILY_CAP=5;
const whole=n=>Number.isSafeInteger(n)&&n>=0&&n<=1_000_000_000;
const valid=s=>s&&s.version===1&&
 ['open','won'].includes(s.edition)&&
 ['balance','jackpot','creator','retired','entries','wins','practiceEarned','practiceCount'].every(k=>whole(s[k]))&&
 typeof s.practiceDay==='string'&&/^\d{4}-\d{2}-\d{2}$|^$/.test(s.practiceDay);
export function newArcadeState(){
 return {version:1,edition:'open',balance:100,jackpot:20,creator:0,
  retired:0,entries:0,wins:0,practiceEarned:0,practiceDay:'',practiceCount:0};
}
export function loadArcadeState(storage){
 try{
  const raw=JSON.parse(storage?.getItem(ARCADE_STORAGE_KEY)||'null');
  return valid(raw)?raw:newArcadeState();
 }catch{return newArcadeState();}
}
export function saveArcadeState(storage,state){
 if(!valid(state))throw new TypeError('Invalid local arcade state');
 try{storage?.setItem(ARCADE_STORAGE_KEY,JSON.stringify(state));return Boolean(storage);}
 catch{return false;}
}
export function enterArcade(state){
 if(!valid(state))throw new TypeError('Invalid local arcade state');
 if(state.edition!=='open')throw new Error('This local edition has been conquered. Practice is still free.');
 if(state.balance<ARCADE_COST)throw new Error('Not enough points. Beat the free practice challenge to earn more.');
 return {...state,balance:state.balance-ARCADE_COST,
  jackpot:state.jackpot+ARCADE_JACKPOT_SHARE,
  creator:state.creator+ARCADE_CREATOR_SHARE,
  retired:state.retired+ARCADE_BURN_SHARE,
  entries:state.entries+1};
}
export function conquerArcade(state){
 if(!valid(state))throw new TypeError('Invalid local arcade state');
 if(state.edition!=='open'||state.entries<1)throw new Error('No eligible local jackpot to award');
 return {...state,edition:'won',balance:state.balance+state.jackpot,jackpot:0,wins:state.wins+1};
}
export function awardPractice(state,day){
 if(!valid(state))throw new TypeError('Invalid local arcade state');
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new TypeError('Expected UTC calendar day');
 const count=state.practiceDay===day?state.practiceCount:0;
 if(count>=PRACTICE_DAILY_CAP)return {...state,practiceDay:day,practiceCount:count};
 return {...state,practiceDay:day,practiceCount:count+1,
  practiceEarned:state.practiceEarned+PRACTICE_REWARD,
  balance:state.balance+PRACTICE_REWARD};
}
