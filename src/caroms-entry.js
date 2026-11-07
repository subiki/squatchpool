import {mountCaromsGame} from './caroms-game.js';
import {attachStaticNavigation} from './static-navigation.js';
attachStaticNavigation(globalThis.window,{initialView:mountCaromsGame(document.querySelector('main')||document)});
