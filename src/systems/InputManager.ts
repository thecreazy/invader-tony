// InputManager.ts: Keyboard input and mobile touch controls.
// Touch devices get drag-anywhere-to-move plus always-on auto-fire — no on-screen buttons.

import type { IInputManager } from '../types/game.ts';

export function createInputManager(touchContainer?: HTMLElement): IInputManager {
  const keys: Record<string, boolean> = {};
  let _dragX: number | null = null;

  function onKeyDown(e: KeyboardEvent): void {
    keys[e.code] = true;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e: KeyboardEvent): void {
    keys[e.code] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const _touchEls: HTMLElement[] = [];
  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  function updateDragFromTouch(e: TouchEvent, container: HTMLElement): void {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = container.getBoundingClientRect();
    const rel = (touch.clientX - rect.left) / rect.width;
    _dragX = Math.max(-1, Math.min(1, rel * 2 - 1));
  }

  if (touchContainer && isTouchDevice) {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:15;pointer-events:auto;touch-action:none;';

    overlay.addEventListener(
      'touchstart',
      (e) => {
        updateDragFromTouch(e, overlay);
        e.preventDefault();
      },
      { passive: false },
    );
    overlay.addEventListener(
      'touchmove',
      (e) => {
        updateDragFromTouch(e, overlay);
        e.preventDefault();
      },
      { passive: false },
    );
    overlay.addEventListener('touchend', () => {
      _dragX = null;
    });
    overlay.addEventListener('touchcancel', () => {
      _dragX = null;
    });

    const hint = document.createElement('div');
    hint.style.cssText = `
      position:absolute;left:50%;bottom:10%;transform:translateX(-50%);
      font-family:'Press Start 2P',monospace;font-size:9px;letter-spacing:0.05em;
      color:rgba(57,255,20,0.55);pointer-events:none;user-select:none;
      white-space:nowrap;transition:opacity 1s ease;
    `;
    hint.textContent = 'DRAG TO MOVE';
    overlay.appendChild(hint);
    setTimeout(() => {
      hint.style.opacity = '0';
    }, 2500);

    touchContainer.appendChild(overlay);
    _touchEls.push(overlay);
  }

  return {
    isLeft() {
      return !!(keys['ArrowLeft'] || keys['KeyA']);
    },
    isRight() {
      return !!(keys['ArrowRight'] || keys['KeyD']);
    },
    isFirePressed() {
      return !!(keys['Space'] || isTouchDevice);
    },
    getDragX() {
      return _dragX;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const el of _touchEls) el.remove();
      _touchEls.length = 0;
    },
  };
}
