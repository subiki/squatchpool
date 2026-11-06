import {mountPressGame} from './press-your-luck-game.js';
import {attachStaticNavigation} from './static-navigation.js';
attachStaticNavigation(globalThis.window,{initialView:mountPressGame(document.querySelector('main')||document)});
