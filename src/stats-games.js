// Shared by browser telemetry and the Cloudflare Pages statistics Function.
// Register each NEW PLAYABLE/instrumented game here; archived rules are not plays.
export const GAME_CATALOG=Object.freeze([
 Object.freeze({id:'but-wait-theres-more',title:"But Wait, There's More",maxBallsPerRack:14}),
 Object.freeze({id:'caroms',title:'Caroms (Whacky Pool)',maxBallsPerRack:16}),
 Object.freeze({id:'cutthroat',title:'Coin-Op Cutthroat',maxBallsPerRack:15}),
 Object.freeze({id:'press-your-luck',title:'Press Your Luck',maxBallsPerRack:15}),
]);
export const CURRENT_GAME='but-wait-theres-more';
