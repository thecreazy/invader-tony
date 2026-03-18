/**
 * Leaderboard data service.
 * Abstracted over localStorage so it can be swapped for a real API
 * by changing only this file.
 */

const STORAGE_KEY = 'cage_invaders_scores';
const MAX_ENTRIES = 10;

/**
 * @typedef {{ name: string, score: number, date: string }} ScoreEntry
 */

/**
 * Reads all scores from storage and returns them sorted by score descending.
 * // TODO API: replace this with fetch() call when backend is ready
 * @returns {ScoreEntry[]}
 */
export function getScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const scores = raw ? JSON.parse(raw) : [];
    return scores.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/**
 * Saves a new score entry, keeps only the top 10, and returns the updated array.
 * // TODO API: replace this with fetch() call when backend is ready
 * @param {string} name
 * @param {number} score
 * @returns {ScoreEntry[]}
 */
export function saveScore(name, score) {
  const existing = getScores();
  const entry = { name: name.trim().toUpperCase().slice(0, 10), score, date: new Date().toISOString() };
  const updated = [...existing, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Removes all stored scores. Debug use only.
 * // TODO API: replace this with fetch() call when backend is ready
 */
export function clearScores() {
  localStorage.removeItem(STORAGE_KEY);
}
