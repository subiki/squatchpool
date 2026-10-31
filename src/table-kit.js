const stage=document.getElementById('table-stage');
const button=document.getElementById('kit-fullscreen');
if(stage&&button){
 const refresh=()=>{const active=document.fullscreenElement===stage;button.textContent=active?'⛶ Exit fullscreen':'⛶ Fullscreen';button.setAttribute('aria-pressed',String(active));};
 button.addEventListener('click',async()=>{try{if(document.fullscreenElement===stage)await document.exitFullscreen();else await stage.requestFullscreen();}catch{button.textContent='Fullscreen unavailable';}});
 document.addEventListener('fullscreenchange',refresh);
 refresh();
}
