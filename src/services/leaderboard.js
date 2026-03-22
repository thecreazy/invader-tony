/**
 * Leaderboard data service — API-first with localStorage fallback.
 * All reads/writes go to /api/scores; localStorage is used when the API
 * is unavailable (offline, local dev without vercel dev, etc.).
 */

const API_BASE = '/api/scores';
const LOCAL_KEY = 'invadertony_scores_local';

/**
 * @typedef {{ name: string, score: number, created_at: string }} ScoreEntry
 */

/**
 * Error thrown when the API rejects the submission with a user-visible reason.
 * Callers should catch this and show the appropriate message to the player.
 */
export class LeaderboardError extends Error {
  /** @param {string} code */
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Error codes that must be shown to the user (not silently swallowed). */
const USER_VISIBLE_ERRORS = new Set([
  'NICKNAME_PROFANITY',
  'INVALID_NAME',
  'RATE_LIMIT',
  'MISSING_TOKEN',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'SESSION_ALREADY_USED',
]);

/**
 * Fetch top 10 scores from the API.
 * Falls back to localStorage if the API is unavailable.
 * @returns {Promise<ScoreEntry[]>}
 */
export async function getScores() {
  try {
    const res = await fetch(API_BASE, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Leaderboard API unavailable, using local cache:', err.message);
    return getLocalScores();
  }
}

/**
 * Submit a new score to the API.
 * Always saves to localStorage immediately, regardless of API result.
 * Throws a LeaderboardError for user-visible validation failures (profanity, rate limit, etc.).
 * @param {string} name
 * @param {number} score
 * @param {{ sessionToken?: string, scoreHash?: string }} [meta]
 * @returns {Promise<ScoreEntry[]>} updated leaderboard
 */
export async function saveScore(name, score, meta = {}) {
  // Always save locally first — synchronous, never lost
  saveLocalScore(name, score);

  let res;
  try {
    res = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        score,
        sessionToken: meta.sessionToken ?? '',
        scoreHash:    meta.scoreHash    ?? '',
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('Score submit network error, saved locally:', err.message);
    return getLocalScores();
  }

  if (!res.ok) {
    let code = 'UNKNOWN';
    try {
      const data = await res.json();
      code = data.error || code;
    } catch {}

    if (USER_VISIBLE_ERRORS.has(code)) {
      throw new LeaderboardError(code);
    }

    // Non-user-visible API errors: fall back to local silently
    console.warn(`Score submit API error ${res.status} (${code}), saved locally`);
    return getLocalScores();
  }

  const data = await res.json();
  // Update local cache with the server's authoritative leaderboard
  if (Array.isArray(data.leaderboard)) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data.leaderboard));
    return data.leaderboard;
  }
  return getLocalScores();
}

/**
 * Get scores from localStorage cache (synchronous).
 * @returns {ScoreEntry[]}
 */
export function getLocalScores() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save a score to localStorage (synchronous).
 * @param {string} name
 * @param {number} score
 */
function saveLocalScore(name, score) {
  try {
    const scores = getLocalScores();
    scores.push({
      name: name.toUpperCase().slice(0, 8),
      score,
      created_at: new Date().toISOString(),
    });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(scores.slice(0, 10)));
  } catch {}
}

/**
 * Clear all local scores. Debug use only.
 */
export function clearScores() {
  localStorage.removeItem(LOCAL_KEY);
}
