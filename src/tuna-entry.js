import {mountTunaGame} from './tuna-game.js';
let controller;
function mount(){controller=mountTunaGame(document.querySelector('main')||document);}
mount();
window.addEventListener('pagehide',()=>{controller?.dispose();controller=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
