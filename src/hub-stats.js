// Lightweight read-only site statistics for pages without a game controller.
const players=document.getElementById('site-stats-players');
const racks=document.getElementById('site-stats-racks');
const balls=document.getElementById('site-stats-balls');
const breakdown=document.getElementById('site-stats-breakdown');
const status=document.getElementById('stats-status');
if(players&&racks&&balls){
  fetch('/api/stats',{cache:'no-store'}).then(r=>{
    if(!r.ok)throw new Error('Stats unavailable');
    return r.json();
  }).then(data=>{
    const site=data?.site||{};
    players.textContent=Number.isFinite(site.players)?site.players.toLocaleString():'—';
    racks.textContent=Number.isFinite(site.racks)?site.racks.toLocaleString():'—';
    balls.textContent=Number.isFinite(site.balls)?site.balls.toLocaleString():'—';
    if(breakdown&&Array.isArray(data.games)){
      breakdown.replaceChildren();
      for(const game of data.games){
        const line=document.createElement('p');
        line.textContent=(game.title||game.game||'Game')+': '+(game.racks??0)+' racks';
        breakdown.append(line);
      }
    }
    if(status)status.textContent='Live totals';
  }).catch(()=>{if(status)status.textContent='Statistics temporarily unavailable · games still playable';});
}
