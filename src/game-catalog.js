// Shared game catalog and data-driven popularity ranking for the homepage.
// Unknown or uninstrumented games retain editorial order; never invent popularity.
export const GAMES=[
 {id:'but-wait-theres-more',name:"But Wait, There's More",icon:'🎱',url:'/but-wait.html',players:'2 players · local',description:'Clear your group, then survive the surprise ball your opponent places.',highlight:'The original Squatch twist'},
 {id:'caroms',name:'Caroms · Whacky Pool',icon:'🌲',url:'/caroms.html',players:'Solo bot or 2 players',description:'Shoot an object ball into the white first. Three difficulty levels.',highlight:'Play against Squatch Bot'},
 {id:'cutthroat',name:'Coin-Op Cutthroat',icon:'🦍',url:'/cutthroat.html',players:'3 players · local',description:'Three groups. Scratches can bring an eliminated player back.',highlight:'Three-way rivalry'},
 {id:'press-your-luck',name:'Press Your Luck',icon:'🎲',url:'/press-your-luck.html',players:'2 players · local',description:'Pocket your opponent’s balls to build a bonus, then bank the 8.',highlight:'Risk it for double points'},
 {id:'tuna',name:'Big Tuna Casserole',icon:'🐟',url:'/tuna.html',players:'2 players · local',description:'Two number sequences, called pockets, and money balls.',highlight:'Race to the winning 10'}
];
export function rankedGames(stats){
 const counts=new Map((stats||[]).filter(g=>Number.isFinite(g.racks)&&g.racks>=0).map(g=>[g.id,g.racks]));
 // Don't call a partially instrumented leaderboard 'popularity'.
 const comparable=GAMES.every(game=>counts.has(game.id));
 return GAMES.map((game,index)=>({...game,index,racks:counts.get(game.id)||0,tracked:counts.has(game.id)}))
  .sort((a,b)=>comparable?b.racks-a.racks||a.index-b.index:a.index-b.index);
}
export function renderGameCards(container,stats){
 if(!container)return;
 container.replaceChildren();
 for(const game of rankedGames(stats)){
  const card=document.createElement('article');card.className='hub-game';
  const title=document.createElement('h3');title.textContent=game.icon+' '+game.name;
  const tag=document.createElement('span');tag.className='hub-meta';tag.textContent=game.players;
  const desc=document.createElement('p');desc.textContent=game.description;
  const highlight=document.createElement('p');highlight.className='hub-highlight';highlight.textContent=game.highlight;
  const link=document.createElement('a');link.className='hub-play';link.href=game.url;link.textContent='Play '+game.name.replace(' · Whacky Pool','');link.setAttribute('aria-label','Play '+game.name);
  if(game.tracked&&game.racks>0){const popular=document.createElement('span');popular.className='hub-count';popular.textContent=game.racks.toLocaleString()+' racks played';card.append(popular);}
  card.append(tag,title,desc,highlight,link);container.append(card);
 }
}
