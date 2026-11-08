import {resolveSession} from '../_passport-session.js';
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequestGet({env,request}) {
  if (!env.PLAYER_DB) return json({error:'Player accounts are not configured.'},503);
  try {
    const player = await resolveSession(env.PLAYER_DB, request);
    if (!player) return json({authenticated:false},401);
    return json({authenticated:true,player:{
      id:player.id,handle:player.handle,displayName:player.display_name,
      visibility:player.visibility,leaderboardOptIn:!!player.leaderboard_opt_in
    }});
  } catch (error) {
    console.error('Passport profile read failed',error);
    return json({error:'Player profile unavailable.'},503);
  }
}
