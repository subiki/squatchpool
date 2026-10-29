// Secondary pages share the same live sitewide D1 statistics as the home page.
// The home page already initializes its stats in game.js.
import {initStats} from './stats.js';
import './deployment.js';
try {
 initStats();
} catch (error) {
 console.error('Shared Squatch header statistics failed',error);
 const status=document.getElementById('stats-status');
 if(status)status.textContent='Statistics temporarily unavailable; games still work.';
}
