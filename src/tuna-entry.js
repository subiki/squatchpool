import {mountTunaGame} from './tuna-game.js';
import {attachStaticNavigation} from './static-navigation.js';
attachStaticNavigation(globalThis.window,{initialView:mountTunaGame(document.querySelector('main')||document)});
