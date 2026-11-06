import {renderGameCards,rankedGames} from './game-catalog.js';
let ranking=null;
export function mountGameHub(root=globalThis.document){
 const list=root?.querySelector('#game-list'),note=root?.querySelector('#ranking-note');
 if(!list)return ()=>{};
 let disposed=false;
 renderGameCards(list);
 if(!ranking)ranking=fetch('/api/stats',{cache:'no-store'}).then(response=>{
  if(!response.ok)throw new Error('Stats unavailable');
  return response.json();
 }).then(data=>Array.isArray(data.games)?data.games:[]).catch(error=>{ranking=null;throw error;});
 ranking.then(games=>{
  if(disposed)return;
  renderGameCards(list,games);
  if(note)note.textContent=rankedGames(games).every(game=>game.tracked)
   ?'Ordered by recorded racks played.'
   :'All games have equal placement until every game reports rack counts. Live counts appear on games with tracking.';
 }).catch(()=>{if(!disposed&&note)note.textContent='All games available. Popularity data is temporarily unavailable.';});
 return ()=>{disposed=true;};
}
