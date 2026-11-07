import {mountCutthroatGame} from './cutthroat-game.js';
import {attachStaticNavigation} from './static-navigation.js';
attachStaticNavigation(globalThis.window,{initialView:mountCutthroatGame(document.querySelector('main')||document)});
