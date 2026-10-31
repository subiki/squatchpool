import {renderGameCards,rankedGames} from './game-catalog.js';
const list=document.getElementById('game-list'),note=document.getElementById('ranking-note');
renderGameCards(list);
fetch('/api/stats',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('Stats unavailable');return response.json();}).then(data=>{
 const games=Array.isArray(data.games)?data.games:[];
 renderGameCards(list,games);
 const tracked=rankedGames(games).filter(game=>game.tracked);
 if(note)note.textContent=tracked.length===rankedGames(games).length?'Ordered by recorded racks played.':'All games have equal placement until every game reports rack counts. Live counts appear on games with tracking.';
}).catch(()=>{if(note)note.textContent='All games available. Popularity data is temporarily unavailable.';});
