// leaderboard.ts: REST API calls to /api/scores with localStorage fallback

import type { ScoreEntry } from '../types/game.ts';

const API_BASE = '/api/scores';
const LOCAL_KEY = 'invadertony_scores_local';

export class LeaderboardError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const USER_VISIBLE_ERRORS = new Set([
  'NICKNAME_PROFANITY',
  'INVALID_NAME',
  'RATE_LIMIT',
  'MISSING_TOKEN',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'SESSION_ALREADY_USED',
]);

export async function getScores(): Promise<ScoreEntry[]> {
  try {
    const res = await fetch(API_BASE, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('API error');
    const data = (await res.json()) as ScoreEntry[];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Leaderboard API unavailable:', (err as Error).message);
    return getLocalScores();
  }
}

export async function saveScore(
  name: string,
  score: number,
  meta: { sessionToken?: string; scoreHash?: string } = {},
): Promise<ScoreEntry[]> {
  saveLocalScore(name, score);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        score,
        sessionToken: meta.sessionToken ?? '',
        scoreHash: meta.scoreHash ?? '',
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('Score submit network error:', (err as Error).message);
    return getLocalScores();
  }

  if (!res.ok) {
    let code = 'UNKNOWN';
    try {
      const d = (await res.json()) as { error?: string };
      code = d.error ?? code;
    } catch {}
    if (USER_VISIBLE_ERRORS.has(code)) throw new LeaderboardError(code);
    console.warn(`Score submit API error ${res.status} (${code})`);
    return getLocalScores();
  }

  const data = (await res.json()) as { leaderboard?: ScoreEntry[] };
  if (Array.isArray(data.leaderboard)) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data.leaderboard));
    return data.leaderboard;
  }
  return getLocalScores();
}

export function getLocalScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocalScore(name: string, score: number): void {
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

export function clearScores(): void {
  localStorage.removeItem(LOCAL_KEY);
}
