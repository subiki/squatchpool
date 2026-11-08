// Rock & Roll-only composable Chaos mechanics. Declarative toggles, never user code.
export const NIGHTMARE_MODS=['blackHole','portals','roulette','multiball','infection','split','sabotage','gauntlet'];
export const NIGHTMARE_PRESET={name:"Squatch's Nightmare",mods:Object.fromEntries(NIGHTMARE_MODS.map(k=>[k,true]))};
export const MAX_BALLS=70;
export const colors=['#ffb833','#e64e50','#4ca4ef','#d66de0','#76d68d'];
export function randomMods(random=Math.random){return Object.fromEntries(NIGHTMARE_MODS.map(k=>[k,random()>.35]));}
export function onCollision(world,a,b,random=Math.random){
 const m=world.mods;
 if(m.infection && a.c!=='#f6f3e7' && b.c!=='#f6f3e7')b.c=a.c;
 if(m.split && world.balls.length<MAX_BALLS && random()<.035 && b.c!=='#f6f3e7' && !b.fragment){
  const child={...b,x:Math.max(32,Math.min(928,b.x+27)),y:Math.max(32,Math.min(488,b.y+12)),vx:-b.vy*.5,vy:b.vx*.5,fragment:true};
  b.fragment=true;world.balls.push(child);world.events.push('Split shot! A ball duplicated.');
 }
}
export function onPocket(world,ball,isCue,random=Math.random){
 const m=world.mods;
 if(m.portals && !isCue && random()<.65){
  const target=world.pockets[Math.floor(random()*world.pockets.length)]||[480,260];
  const x=Math.max(50,Math.min(910,target[0]+(target[0]<480?48:-48)));
  const y=Math.max(50,Math.min(470,target[1]+(target[1]<260?48:-48)));
  world.balls.push({...ball,x,y,vx:(random()-.5)*12,vy:(random()-.5)*12,portalCooldown:90});
  world.events.push('Portal pocket! Ball teleported.');return;
 }
 if(m.multiball && !isCue && world.balls.length<MAX_BALLS-2){
  for(let i=0;i<2;i++)world.balls.push({x:470+i*32,y:230+i*32,vx:(random()-.5)*8,vy:(random()-.5)*8,c:colors[Math.floor(random()*colors.length)]});
  world.events.push('MULTIBALL! Two new balls spawned.');
 }
 if(m.gauntlet && !isCue){world.stage++;world.events.push('Gauntlet stage '+world.stage+'!');}
}
export function onShot(world,random=Math.random){
 const m=world.mods;
 if(m.roulette){
  const keys=['bounce','gravity','magnet','pinball','blackHole','portals','multiball','infection','split'];
  const key=keys[Math.floor(random()*keys.length)];m[key]=!m[key];
  world.events.push('Chaos roulette: '+key+' '+(m[key]?'ON':'OFF'));
 }
 if(m.sabotage && world.shots%2===0 && world.bumpers.length<40){
  world.bumpers.push({x:150+random()*660,y:70+random()*380,r:16+random()*15});
  world.events.push('Sabotage! A bumper appeared.');
 }
}
export function applyForces(world,b,dt){
 if(!world.mods.blackHole||b.eight)return;
 const eight=world.balls.find(x=>x.eight);
 if(!eight)return;
 const dx=eight.x-b.x,dy=eight.y-b.y,d=Math.max(35,Math.hypot(dx,dy));
 const force=Math.min(.26,200/(d*d))*dt;b.vx+=dx/d*force;b.vy+=dy/d*force;
}
