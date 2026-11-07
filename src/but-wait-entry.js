import {mountButWaitGame} from './game.js';
import {attachStaticNavigation} from './static-navigation.js';
attachStaticNavigation(globalThis.window,{initialView:mountButWaitGame(document.querySelector('main')||document)});
