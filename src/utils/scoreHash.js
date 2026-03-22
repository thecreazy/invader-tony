/**
 * Score hash utilities — deterministic djb2-style chain hash.
 * Each score increment is folded into the running hash, creating a
 * verifiable trail that proves the score was accumulated incrementally.
 *
 * Must produce identical output in browser (Game.js) and Node.js (server verify).
 * No external dependencies — pure JS.
 */

/**
 * Fold one score event into the running hash chain.
 * @param {string} prevHash  - previous hash in the chain (starts as '0')
 * @param {number} points    - points added this event
 * @param {string} source    - event source identifier (e.g. 'hit', 'boss')
 * @param {number} total     - cumulative score after this event
 * @returns {string} 8-char hex hash
 */
export function hashScore(prevHash, points, source, total) {
  const input = `${prevHash}:${points}:${source}:${total}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash, 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Replay a full event log and verify the final hash matches.
 * Used server-side for deep score verification (optional, future use).
 * @param {{ points: number, source: string, total: number }[]} events
 * @param {string} finalHash
 * @returns {boolean}
 */
export function verifyScoreHash(events, finalHash) {
  let hash = '0';
  for (const e of events) {
    hash = hashScore(hash, e.points, e.source, e.total);
  }
  return hash === finalHash;
}
