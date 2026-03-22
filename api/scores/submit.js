/**
 * POST /api/scores/submit — validates and inserts a new score into Supabase.
 *
 * Validation pipeline (in order):
 *   method → content-type → body shape → field presence → score finite →
 *   ip rate-limit → score bounds → name sanitize → name validity →
 *   profanity → session token → global db rate-limit → duplicate check →
 *   insert → return leaderboard
 */

import crypto from 'crypto';
import profanityPkg from '@2toad/profanity';

const { Profanity, ProfanityOptions } = profanityPkg;

// ─── Profanity filter ─────────────────────────────────────────────────────────

const _opts = new ProfanityOptions();
_opts.wholeWord = false; // catch partials: "fuckyou", "stronzetto", leet speak compounds

const filter = new Profanity(_opts);

// Italian words not covered by the built-in English/German/French lists
filter.addWords([
  'cazzo', 'minchia', 'merda', 'stronzo', 'stronza',
  'vaffanculo', 'puttana', 'troia', 'coglione', 'cogliona',
  'figa', 'fica', 'culetto', 'cornuto', 'bastardo', 'bastarda',
  'negro', 'negra', 'ritardato', 'mongoloide',
]);

// Whitelist common false positives triggered by wholeWord: false
filter.whitelist.addWords([
  'assassin', 'classic', 'bass', 'mass', 'glass', 'grass', 'brass', 'class', 'pass', 'sass',
]);

// ─── Session token verification ───────────────────────────────────────────────

const GAME_SECRET = process.env.GAME_SECRET;

/**
 * Parse and verify an HMAC-signed token.
 * Returns the payload object or null if invalid.
 * @param {string} token
 * @returns {{ sessionId: string, issuedAt: number, expiresAt: number } | null}
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;
  const b64  = token.slice(0, dotIdx);
  const sig  = token.slice(dotIdx + 1);
  try {
    const data = Buffer.from(b64, 'base64url').toString('utf-8');
    const expected = crypto
      .createHmac('sha256', GAME_SECRET)
      .update(data)
      .digest('hex');
    if (sig !== expected) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Verify that the session exists in Supabase, has not been used, and is not expired.
 * On success, atomically marks it as used.
 * @param {string} sessionId
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
async function validateAndConsumeSession(sessionId) {
  const headers = {
    'apikey':        process.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type':  'application/json',
  };

  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/game_sessions?session_id=eq.${sessionId}&select=id,used,expires_at`,
    { headers }
  );
  if (!res.ok) return { valid: false, reason: 'SESSION_LOOKUP_FAILED' };

  const rows = await res.json();
  if (!rows.length)        return { valid: false, reason: 'SESSION_NOT_FOUND' };

  const session = rows[0];
  if (session.used)        return { valid: false, reason: 'SESSION_ALREADY_USED' };
  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, reason: 'SESSION_EXPIRED' };
  }

  // Mark as used — one-time consumption
  const patchRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/game_sessions?session_id=eq.${sessionId}`,
    { method: 'PATCH', headers, body: JSON.stringify({ used: true }) }
  );
  if (!patchRes.ok) return { valid: false, reason: 'SESSION_CONSUME_FAILED' };

  return { valid: true };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCORE_MIN = 10;
const SCORE_MAX = 4500; // theoretical max: 20 invaders × 50pts × 3 waves + boss = ~3000; +20% buffer = 3600; round up
const IP_LIMIT   = 3;
const IP_WINDOW  = 60 * 1000;
const GLOBAL_LIMIT_PER_MIN = 30;
const DUPLICATE_WINDOW_SEC = 30;

const BLOCKED_NAMES = new Set(['ADMIN', 'ROOT', 'NULL', 'HACK', 'CHEAT', 'BOT', 'TEST']);

// ─── IP rate-limit (module-level, resets on cold start) ──────────────────────

/** @type {Map<string, { count: number, resetAt: number }>} */
const ipCounts = new Map();

function checkIpRateLimit(ip) {
  const now = Date.now();
  const entry = ipCounts.get(ip) || { count: 0, resetAt: now + IP_WINDOW };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + IP_WINDOW;
  }

  entry.count++;
  ipCounts.set(ip, entry);
  return entry.count <= IP_LIMIT;
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

function sanitizeName(raw) {
  return String(raw).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8).trim();
}

function isValidName(name) {
  if (!name || name.length < 1) return false;
  if (/^(.)\1*$/.test(name)) return false; // all same character (e.g. "AAAAAAAA")
  if (BLOCKED_NAMES.has(name)) return false;
  return true;
}

// Normalize common leet speak substitutions before the profanity check.
// Names are already uppercase (A-Z, 0-9, space) at this point.
function normalizeLeet(str) {
  return str
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/3/g, 'E')
    .replace(/4/g, 'A')
    .replace(/5/g, 'S')
    .replace(/7/g, 'T')
    .replace(/8/g, 'B');
}

function containsProfanity(name) {
  return filter.exists(name) || filter.exists(normalizeLeet(name));
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

function supabaseHeaders(key) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/** Returns true if global submissions in the last minute are below the limit. */
async function checkGlobalRateLimit() {
  try {
    const since = new Date(Date.now() - 60 * 1000).toISOString();
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores?select=id&created_at=gte.${since}&limit=${GLOBAL_LIMIT_PER_MIN + 1}`,
      { headers: supabaseHeaders(process.env.SUPABASE_ANON_KEY) }
    );
    if (!res.ok) return true; // fail open — don't block on check failure
    const data = await res.json();
    return data.length <= GLOBAL_LIMIT_PER_MIN;
  } catch {
    return true; // fail open
  }
}

/** Returns true if this exact name+score was already submitted recently. */
async function isDuplicateSubmission(name, score) {
  try {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_SEC * 1000).toISOString();
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores?select=id&name=eq.${encodeURIComponent(name)}&score=eq.${score}&created_at=gte.${since}&limit=1`,
      { headers: supabaseHeaders(process.env.SUPABASE_ANON_KEY) }
    );
    if (!res.ok) return false; // fail open
    const data = await res.json();
    return data.length > 0;
  } catch {
    return false; // fail open
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  // 2. Content-Type
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) {
    return res.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
  }

  // 3. Body shape
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'INVALID_BODY' });
  }

  // 4. Field presence
  const { name, score } = body;
  if (name === undefined || score === undefined) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }

  // 5. Score is a finite number
  if (typeof score !== 'number' || !Number.isFinite(score) || !Number.isInteger(score)) {
    return res.status(400).json({ error: 'INVALID_SCORE' });
  }

  // 6. IP rate-limit
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
  if (!checkIpRateLimit(ip)) {
    return res.status(429).json({ error: 'RATE_LIMIT' });
  }

  // 7. Score bounds
  if (score < SCORE_MIN || score > SCORE_MAX) {
    return res.status(400).json({ error: 'INVALID_SCORE' });
  }

  // 8. Name sanitize
  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'INVALID_NAME' });
  }
  const cleanName = sanitizeName(name);

  // 9. Name validity
  if (!isValidName(cleanName)) {
    return res.status(400).json({ error: 'INVALID_NAME' });
  }

  // 10. Profanity
  if (containsProfanity(cleanName)) {
    return res.status(400).json({ error: 'NICKNAME_PROFANITY' });
  }

  // 11. Session token verification
  if (GAME_SECRET) {
    const { sessionToken } = body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'MISSING_TOKEN' });
    }

    const payload = verifyToken(sessionToken);
    if (!payload) {
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }

    if (Date.now() > payload.expiresAt) {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }

    const sessionCheck = await validateAndConsumeSession(payload.sessionId);
    if (!sessionCheck.valid) {
      return res.status(401).json({ error: sessionCheck.reason });
    }
  } else {
    console.warn('GAME_SECRET not set — skipping session token verification (dev mode)');
  }

  // 12. Global DB rate-limit (circuit breaker)
  const globalOk = await checkGlobalRateLimit();
  if (!globalOk) {
    return res.status(429).json({ error: 'RATE_LIMIT' });
  }

  // 13. Duplicate submission guard
  const isDuplicate = await isDuplicateSubmission(cleanName, score);
  if (isDuplicate) {
    // Return 200 with current leaderboard — silent dedup, no error shown to user
    try {
      const lb = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/scores?select=name,score,created_at&order=score.desc&limit=10`,
        { headers: supabaseHeaders(process.env.SUPABASE_ANON_KEY) }
      );
      const leaderboard = await lb.json();
      return res.status(200).json({ entry: null, leaderboard, duplicate: true });
    } catch {
      return res.status(200).json({ entry: null, leaderboard: [], duplicate: true });
    }
  }

  // 13. Insert into Supabase
  try {
    const insertRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders(process.env.SUPABASE_SERVICE_KEY),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ name: cleanName, score }),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Supabase insert error:', errText);
      return res.status(500).json({ error: 'INSERT_FAILED' });
    }

    const inserted = await insertRes.json();

    // 14. Return updated leaderboard
    const lbRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores?select=name,score,created_at&order=score.desc&limit=10`,
      { headers: supabaseHeaders(process.env.SUPABASE_ANON_KEY) }
    );
    const leaderboard = await lbRes.json();

    return res.status(201).json({ entry: inserted[0], leaderboard });

  } catch (error) {
    console.error('POST score error:', error);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
