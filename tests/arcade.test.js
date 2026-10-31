import test from 'node:test';
import assert from 'node:assert/strict';
import {ARCADE_COST,ARCADE_JACKPOT_SHARE,ARCADE_CREATOR_SHARE,ARCADE_BURN_SHARE,
 newArcadeState,loadArcadeState,saveArcadeState,enterArcade,conquerArcade,
 awardPractice,PRACTICE_REWARD,PRACTICE_DAILY_CAP} from '../src/arcade-points.js';
import {ARCADE_CHALLENGE,setupArcadeChallenge,judgeArcadeShot,arcadeAimAngle} from '../src/arcade-challenge.js';
import {TABLE,step,shotSpeed,stationary} from '../src/physics.js';

test('points-only arcade uses a conservative 7/2/1 split without going negative',()=>{
 let state=newArcadeState();
 assert.equal(state.balance,100);assert.equal(state.jackpot,20);
 const total=s=>s.balance+s.jackpot+s.creator+s.retired;
 const initial=total(state);
 state=enterArcade(state);
 assert.equal(state.balance,100-ARCADE_COST);
 assert.equal(state.jackpot,20+ARCADE_JACKPOT_SHARE);
 assert.equal(state.creator,ARCADE_CREATOR_SHARE);
 assert.equal(state.retired,ARCADE_BURN_SHARE);
 assert.equal(total(state),initial);
 assert.equal(state.entries,1);
 const prize=state.jackpot;
 state=conquerArcade(state);
 assert.equal(state.balance,100-ARCADE_COST+prize);
 assert.equal(state.jackpot,0);assert.equal(state.edition,'won');
 assert.equal(total(state),initial);
 assert.throws(()=>conquerArcade(state),/eligible/);
 assert.throws(()=>enterArcade(state),/conquered/);
});
test('no points entry without enough balance and no jackpot awarded before an entry',()=>{
 assert.throws(()=>conquerArcade(newArcadeState()),/eligible/);
 let state=newArcadeState();
 for(let i=0;i<10;i++)state=enterArcade(state);
 assert.equal(state.balance,0);
 assert.throws(()=>enterArcade(state),/Not enough points/);
 assert.equal(state.jackpot,90);
});
test('practice grants are capped at five per UTC day, and credits remain local',()=>{
 let s=newArcadeState();
 for(let i=0;i<10;i++)s=awardPractice(s,'2026-10-30');
 assert.equal(s.practiceCount,PRACTICE_DAILY_CAP);
 assert.equal(s.practiceEarned,PRACTICE_REWARD*PRACTICE_DAILY_CAP);
 assert.equal(s.balance,125);
 s=awardPractice(s,'2026-10-31');
 assert.equal(s.practiceCount,1);assert.equal(s.balance,130);
 assert.throws(()=>awardPractice(s,'not-a-date'),/UTC calendar day/);
});
test('browser-local persistence rejects corrupted values and restores a points wallet',()=>{
 const memory=new Map();
 const storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 const s=enterArcade(newArcadeState());
 assert.equal(saveArcadeState(storage,s),true);
 assert.deepEqual(loadArcadeState(storage),s);
 memory.set('squatch-arcade-local-v1',JSON.stringify({...s,balance:-10000}));
 assert.equal(loadArcadeState(storage).balance,100);
 assert.equal(loadArcadeState({getItem(){throw new Error('blocked');}}).balance,100);
});
test('one fixed seven-foot challenge judges pocket, wrong pocket, scratch and stroke budget',()=>{
 const balls=setupArcadeChallenge();
 assert.equal(TABLE.size,7);
 assert.deepEqual(balls.map(b=>b.id),[0,1]);
 assert.ok(arcadeAimAngle(balls)<0);
 assert.equal(ARCADE_CHALLENGE.shots,3);
 assert.equal(judgeArcadeShot([{type:'pocket',ballId:1,pocketId:'TL'}],1).status,'won');
 assert.equal(judgeArcadeShot([{type:'pocket',ballId:1,pocketId:'BR'}],1).status,'lost');
 assert.equal(judgeArcadeShot([{type:'pocket',ballId:1,pocketId:'TL'},{type:'pocket',ballId:0,pocketId:'TL'}],1).status,'lost');
 assert.equal(judgeArcadeShot([],2).status,'continue');
 assert.equal(judgeArcadeShot([],3).status,'lost');
});
test('the seeded first-corner challenge can be beaten using real shared ball physics',()=>{
 const balls=setupArcadeChallenge();
 const cue=balls.find(b=>b.id===0),angle=arcadeAimAngle(balls),velocity=shotSpeed(68);
 cue.vx=Math.cos(angle)*velocity;cue.vy=Math.sin(angle)*velocity;cue.motion='sliding';
 const events=[];
 for(let i=0;i<2400;i++){
  events.push(...step(balls,1/120).shotEvents);
  if(balls.find(b=>b.id===1).pocketed||i>40&&stationary(balls))break;
 }
 const outcome=judgeArcadeShot(events,1);
 assert.equal(outcome.status,'won','default diagonal shot should pocket the one in TL; goal must be solvable');
});
