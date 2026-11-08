import {sameOriginWrite,revokeSession,clearCookieHeader} from '../../_passport-session.js';
export async function onRequestPost({env,request}) {
  if (!sameOriginWrite(request)) return new Response('Forbidden',{status:403});
  if (!env.PLAYER_DB) return new Response('Player accounts unavailable',{status:503});
  try {
    await revokeSession(env.PLAYER_DB,request);
    return new Response(JSON.stringify({ok:true}),{
      headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':clearCookieHeader()}
    });
  } catch (error) {
    console.error('Passport logout failed',error);
    return new Response('Logout unavailable',{status:503});
  }
}
