import {mountCutthroatGame} from './cutthroat-game.js';
let controller;
function mount(){controller=mountCutthroatGame(document.querySelector('main')||document);}
mount();
window.addEventListener('pagehide',()=>{controller?.dispose();controller=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)mount();});
