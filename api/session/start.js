/**
 * POST /api/session/start — issues a signed game session token.
 * Called when the player starts a game. The returned token must be sent
 * with POST /api/scores/submit to prove the score was earned in-game.
 */

import crypto from 'crypto';

const SECRET = process.env.GAME_SECRET;

/** @param {{ sessionId: string, issuedAt: number, expiresAt: number }} payload */
function signToken(payload) {
  const data = JSON.stringify(payload);
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + sig;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // If GAME_SECRET is not configured (local dev with plain vite), return a placeholder
  if (!SECRET) {
    console.warn('/api/session/start: GAME_SECRET not set — returning dev token');
    return res.status(200).json({ token: null, dev: true });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('/api/session/start: Supabase env vars missing');
    return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  }

  const sessionId  = crypto.randomUUID();
  const issuedAt   = Date.now();
  const expiresAt  = issuedAt + 30 * 60 * 1000; // 30-minute max game duration

  // Persist session before returning token — if the insert fails, the token
  // would be unverifiable, so we must fail here.
  try {
    const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/game_sessions`, {
      method: 'POST',
      headers: {
        'apikey':        process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        session_id: sessionId,
        issued_at:  new Date(issuedAt).toISOString(),
        expires_at: new Date(expiresAt).toISOString(),
        used:       false,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error('game_sessions insert failed:', err);
      return res.status(500).json({ error: 'SESSION_CREATE_FAILED' });
    }
  } catch (err) {
    console.error('game_sessions insert error:', err);
    return res.status(500).json({ error: 'SESSION_CREATE_FAILED' });
  }

  const token = signToken({ sessionId, issuedAt, expiresAt });
  return res.status(200).json({ token });
}
