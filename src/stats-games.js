// Shared by browser telemetry and the Cloudflare Pages statistics Function.
// Register each NEW PLAYABLE/instrumented game here; archived rules are not plays.
export const GAME_CATALOG=Object.freeze([
 Object.freeze({id:'but-wait-theres-more',title:"But Wait, There's More",maxBallsPerRack:14}),
 Object.freeze({id:'caroms',title:'Caroms (Whacky Pool)',maxBallsPerRack:16}),
 Object.freeze({id:'cutthroat',title:'Coin-Op Cutthroat',maxBallsPerRack:15}),
 // Both games can re-spot balls; the per-rack cap bounds physical pockets, not unique ball IDs.
 Object.freeze({id:'press-your-luck',title:'Press Your Luck',maxBallsPerRack:30}),
 Object.freeze({id:'tuna',title:'Big Tuna Casserole',maxBallsPerRack:30}),
]);
export const CURRENT_GAME='but-wait-theres-more';
