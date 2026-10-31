import {renderGameCards,rankedGames} from './game-catalog.js';
const list=document.getElementById('game-list'),note=document.getElementById('ranking-note');
renderGameCards(list);
fetch('/api/stats',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('Stats unavailable');return response.json();}).then(data=>{
 const games=Array.isArray(data.games)?data.games:[];
 renderGameCards(list,games);
 const tracked=rankedGames(games).filter(game=>game.tracked);
 if(note)note.textContent=tracked.length?'Ordered by recorded racks played. Games without tracking remain available below.':'All games shown equally; popularity will update when rack statistics are available.';
}).catch(()=>{if(note)note.textContent='All games available. Popularity data is temporarily unavailable.';});
