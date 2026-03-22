/**
 * Konami code detector.
 */

const SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

/**
 * Listens for the Konami code sequence on the window.
 * Uses e.key to match (lowercase b/a for compatibility with existing pages).
 * @param {() => void} onSuccess
 * @returns {() => void} cleanup function
 */
export function listenKonami(onSuccess) {
  let index = 0;
  const handler = (e) => {
    if (e.key === SEQUENCE[index]) {
      index++;
      if (index === SEQUENCE.length) {
        index = 0;
        onSuccess();
      }
    } else {
      index = e.key === SEQUENCE[0] ? 1 : 0;
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
