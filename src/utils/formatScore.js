/**
 * Score formatting utilities.
 */

/**
 * Returns a zero-padded 6-digit score string.
 * @param {number} n
 * @returns {string}
 */
export function formatScore(n) {
  return String(Math.max(0, Math.floor(n))).padStart(6, '0');
}
