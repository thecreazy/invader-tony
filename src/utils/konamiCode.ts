// konamiCode.ts: Detects the Konami code key sequence and fires a callback

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

export function listenKonami(onActivate: () => void): () => void {
  let idx = 0;

  function onKeyDown(e: KeyboardEvent): void {
    if (e.code === SEQUENCE[idx]) {
      idx++;
      if (idx === SEQUENCE.length) {
        idx = 0;
        onActivate();
      }
    } else {
      idx = e.code === SEQUENCE[0] ? 1 : 0;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
