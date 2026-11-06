// Lightweight read-only site statistics for pages without a game controller.
import {renderStats} from './stats.js';
const players=document.getElementById('site-stats-players');
const racks=document.getElementById('site-stats-racks');
const balls=document.getElementById('site-stats-balls');
const status=document.getElementById('stats-status');
if(players&&racks&&balls){
  fetch('/api/stats',{cache:'no-store'}).then(r=>{
    if(!r.ok)throw new Error('Stats unavailable');
    return r.json();
  }).then(data=>{
    if(!data?.site||!Array.isArray(data.games))throw new Error('Invalid stats data');
    renderStats(data);
    if(status)status.textContent='Live totals · players = distinct anonymous browsers that played; shared devices count once.';
  }).catch(()=>{if(status)status.textContent='Statistics temporarily unavailable · games still playable';});
}
