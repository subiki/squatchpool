import {mountButWaitGame} from './game.js';
let controller;
function mount(){controller=mountButWaitGame(document.querySelector('main')||document);}
mount();
window.addEventListener('pagehide',()=>{controller?.dispose();controller=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
