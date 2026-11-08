import {GAME_GUIDES} from './game-guides.js';
// Source of truth for homepage promotion and playable, local house rules.
// Keep rules visible in the site, not in external documents or retired pages.
export const GAMES=[
 {id:'but-wait-theres-more',name:"But Wait, There's More",icon:'🎱',url:'/but-wait.html',
  players:'Solo vs Speed Squatch · or local two-player',
  highlight:'A surprise ball turns a sure win into a trap.',
  description:'Classic 8-ball with one solid and one stripe held back. When you clear your group, your opponent gets one last move to make your 8-ball finish miserable.',
  rules:[
   'One solid and one stripe start off the table; clear your visible group first.',
   'Before your 8, the opponent chooses either held ball—even their own—and places it in a legal spot.',
   'If they return your group ball, you must pocket it before legally calling the 8.',
   'The other held ball can come back when the other player reaches the 8.'
  ],strategy:'The best defensive placement might be your own ball. Think ahead before anyone reaches the 8.'},
 {id:'caroms',name:'Caroms · Whacky Pool',icon:'🌲',url:'/caroms.html',
  players:'Solo vs Squatch Bot or 2 local players',
  highlight:'Hit the white with an object ball. Yes, really.',
  description:'Turn pool inside out: shoot your object ball into the white cue ball and carom toward a pocket. Choose how strictly you call your shots.',
  rules:[
   'The 1-ball breaks from the kitchen; the cue ball sits at the head position.',
   'Strike an object ball into the cue ball first, then carom toward a pocket.',
   'A miss on the cue ball or missing required rail contact is a foul.',
   'Beginner allows slop, intermediate calls the 8, and advanced calls every shot.'
  ],strategy:'Learn the rebound angles and challenge yourself with stricter calling levels.'},
 {id:'cutthroat',name:'Coin-Op Cutthroat',icon:'🦍',url:'/cutthroat.html',
  players:'Three-way · local players or Squatch bots',
  highlight:'Three colors. One survivor. Nasty scratch strategy.',
  description:'Red, yellow, or blue: defend your set while wiping the others out. Scratches let opponents steal control—and can revive a player who was out.',
  rules:[
   'Each of three players claims one color after making a legal ball.',
   'Pocket any object ball, including your own, to continue your turn.',
   'On a cue-ball scratch, the next active player gets ball-in-hand while the third player may claim an unpocketed ball.',
   'An eliminated player may return through a claim. Last player with a ball wins.'
  ],strategy:'Numbers are not the point. Keep your color alive, and use the scratch rules tactically.'},
 {id:'press-your-luck',name:'Press Your Luck',icon:'🎲',url:'/press-your-luck.html',
  players:'Solo vs Squatch Bot · or local two-player',
  highlight:'Bank points, gamble on bonus balls, double the 8.',
  description:'Clear your group and decide how much to risk before the 8. Every own ball builds the rack, while opponent balls add a provisional bonus you can lose.',
  rules:[
   'Every ball of your own group that you pocket earns one rack point if you win.',
   'Once your group is clear, pocket opponent balls to earn bonus points while pressing.',
   'A missed 8 or scratch while pressing loses the provisional bonus, not prior banked racks.',
   'A legal called 8 adds two; a successful declared bank or kick doubles this rack award.'
  ],strategy:'Watch banked, current-rack, and at-risk points separately before deciding whether to press.'},
 {id:'tuna',name:'Big Tuna Casserole',icon:'🐟',url:'/tuna.html',
  players:'Solo vs Squatch Bot · or local two-player',
  highlight:'Two numbered races. Three money balls. One winning 10.',
  description:'Play two lowest-ball sequences at once, call your shot, and collect money-ball points while setting up the winning 10.',
  rules:[
   'Call the ball and pocket; first contact must be the lowest remaining ball in either sequence: 1–10 or 11–15.',
   'Clear the 9 and balls 11–15 before legally pocketing the 10 to win.',
   '15 is worth one game point, 9 is worth two, and the winning 10 is worth three.',
   'Illegal balls are spotted; fouls give ball-in-hand and the rack winner breaks next.'
  ],strategy:'You can win on the 10 even if some lower solids remain. Plan both sequences.'}
];
export function rankedGames(stats){
 const counts=new Map((stats||[]).filter(g=>Number.isFinite(g.racks)&&g.racks>=0).map(g=>[g.id,g.racks]));
 const comparable=GAMES.every(game=>counts.has(game.id));
 return GAMES.map((game,index)=>({...game,index,racks:counts.get(game.id)||0,tracked:counts.has(game.id)}))
  .sort((a,b)=>comparable?b.racks-a.racks||a.index-b.index:a.index-b.index);
}
export function renderGameCards(container,stats){
 if(!container)return;
 const expanded=new Set(Array.from(container.querySelectorAll?.('.hub-game .hub-rules[open]')||[],node=>node.closest('.hub-game')?.dataset.game));
 container.replaceChildren();
 for(const game of rankedGames(stats)){
  const card=document.createElement('article');card.className='hub-game';
  card.id='game-'+game.id;card.dataset.game=game.id;
  const kicker=document.createElement('span');kicker.className='hub-meta';kicker.textContent=game.players;
  const title=document.createElement('h3');title.textContent=game.icon+' '+game.name;
  const tagline=document.createElement('p');tagline.className='hub-highlight';tagline.textContent=game.highlight;
  const desc=document.createElement('p');desc.className='hub-description';desc.textContent=game.description;
  const rules=document.createElement('details');rules.className='hub-rules';
  if(expanded.has(game.id))rules.open=true;
  const summary=document.createElement('summary');summary.textContent='Explore the rules & strategy';
  const guide=GAME_GUIDES[game.id];
  const lead=document.createElement('p');lead.className='hub-rule-lead';lead.textContent=guide.intro;
  rules.append(summary,lead);
  for(const section of guide.sections){
   const block=document.createElement('section');block.className='hub-rule-section';
   const heading=document.createElement('h4');heading.textContent=section.title;
   const list=document.createElement('ol');
   for(const item of section.items){const li=document.createElement('li');li.textContent=item;list.append(li);}
   block.append(heading,list);rules.append(block);
  }
  const example=document.createElement('p');example.className='hub-rule-example';
  example.textContent='Example: '+guide.example;
  const controls=document.createElement('p');controls.className='hub-rule-controls';
  controls.textContent='Playing on this site: '+guide.controls;
  const strategy=document.createElement('p');strategy.className='hub-strategy';
  strategy.textContent='The Squatch edge: '+game.strategy;
  rules.append(example,controls,strategy);
  const link=document.createElement('a');link.className='hub-play';
  link.href=game.url;link.textContent='Play '+game.name.replace(' · Whacky Pool','');
  link.setAttribute('aria-label','Play '+game.name);
  card.append(kicker,title,tagline,desc,rules);
  if(game.tracked&&game.racks>0){
   const played=document.createElement('span');played.className='hub-count';
   played.textContent=game.racks.toLocaleString()+' racks played';card.append(played);
  }
  card.append(link);container.append(card);
 }
}
