import {mountPressGame} from './press-your-luck-game.js';
const root=document.querySelector('main')||document;
let controller=mountPressGame(root);
// A restored native history entry starts one fresh match, never a stale bot.
globalThis.window?.addEventListener('pagehide',()=>controller.dispose());
globalThis.window?.addEventListener('pageshow',event=>{
 if(event.persisted)controller=mountPressGame(root);
});
