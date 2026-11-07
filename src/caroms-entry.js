import {mountCaromsGame} from './caroms-game.js';
let controller;
function mount(){controller=mountCaromsGame(document.querySelector('main')||document);}
mount();
window.addEventListener('pagehide',()=>{controller?.dispose();controller=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
