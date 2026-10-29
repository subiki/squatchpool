/**
 * Bounded, deterministic refinement of a geometric Caroms bot shot.
 * Uses the shared 120 Hz physics and rules on disposable ball copies;
 * never moves the live table or reports simulated shots to statistics.
 */
import {step,stationary,shotSpeed,applyCueSpin} from './physics.js';
import {caromsTurn,caromsEligible} from './caroms-rules.js';
import {planCaromsBotShot} from './caroms-bot-aim.js';

export function chooseCaromsBotShot({balls,eligible,cueBall,pockets,radius,groups,turn,level}) {
  const baseline=planCaromsBotShot({balls,eligible,cueBall,pockets,radius});
  if(!baseline)return null;
  const eightEligibleBefore=caromsEligible(balls,groups[turn]);
  let best=null;
  // Ten attempts, at most five seconds each. Never run in the render loop.
  for(const offset of [0,-0.008,0.008,-0.02,0.02])for(const power of [70,90]){
    const copy=balls.map(ball=>({...ball}));
    const striker=copy.find(ball=>ball.id===baseline.ballId);
    if(!striker||striker.pocketed)continue;
    const angle=baseline.angle+offset;
    striker.vx=Math.cos(angle)*shotSpeed(power,false);
    striker.vy=Math.sin(angle)*shotSpeed(power,false);
    applyCueSpin(striker,0,0);
    const events=[];
    for(let tick=0;tick<600;tick++){
      const result=step(copy,1/120);
      events.push(...result.shotEvents);
      if(tick>24&&stationary(copy))break;
    }
    // The bot can call the predicted pocket before taking its actual shot.
    const strikerPocket=events.find(e=>e.type==='pocket'&&e.ballId===baseline.ballId)?.pocketId;
    const pocketId=strikerPocket??baseline.pocketId;
    const decision=caromsTurn({balls:copy,groups,shooter:turn,
      shooterBall:baseline.ballId,shotEvents:events,level,
      calledBall:baseline.ballId,calledPocket:pocketId,
      eightEligibleBefore});
    const firstCueContact=decision.firstContact===0;
    const legalScore=decision.winner===turn?10000:
      decision.winner!==null?-10000:
      decision.keepTurn?3000:decision.foul?-600:300;
    const scored=decision.legalPocketed.filter(id=>id!==0).length;
    const object=copy.find(ball=>ball.id===baseline.ballId);
    const nearest=object?.pocketed?0:Math.min(...pockets.map(p=>
      Math.hypot(object.x-p.x,object.y-p.y)));
    const score=legalScore+scored*120+
      (firstCueContact?120:0)+(decision.railAfterContact?80:0)-nearest/20;
    if(!best||score>best.score)best={...baseline,angle,power,pocketId,score};
  }
  return best&&{ballId:best.ballId,pocketId:best.pocketId,
    angle:best.angle,power:best.power,impact:best.impact};
}
