// InputManager.ts: Keyboard input and mobile touch controls.
// Touch devices get drag-anywhere-to-move plus always-on auto-fire — no on-screen buttons.

import type { IInputManager } from '../types/game.ts';

// Relative drag: how much normalized ship travel (-1..1 range) a full-width
// finger swipe produces. >1 means a swipe shorter than the full screen width
// is enough to cross the whole play field.
const DRAG_SENSITIVITY = 2.2;

export function createInputManager(touchContainer?: HTMLElement): IInputManager {
  const keys: Record<string, boolean> = {};
  let _dragX: number | null = null;
  // Last live drag value, kept as the reference point for the next touch so a
  // new drag continues from wherever the ship currently is instead of snapping.
  let _lastDragX = 0;
  let _activeTouchId: number | null = null;
  let _touchStartClientX = 0;
  let _touchStartDragX = 0;

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

  function findTouchById(list: TouchList, id: number): Touch | null {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

  // Only ever tracks a single finger (the one that started the current drag),
  // identified by its touch id — extra fingers on screen are ignored until
  // the tracked one lifts. Movement is relative to where that finger started,
  // not mapped to its absolute screen position, so re-touching after a lift
  // doesn't teleport the ship.
  function onTouchStart(e: TouchEvent): void {
    if (_activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    _activeTouchId = touch.identifier;
    _touchStartClientX = touch.clientX;
    _touchStartDragX = _lastDragX;
    _dragX = _lastDragX;
  }

  function onTouchMove(e: TouchEvent, container: HTMLElement): void {
    if (_activeTouchId === null) return;
    const touch = findTouchById(e.touches, _activeTouchId);
    if (!touch) return;
    const rect = container.getBoundingClientRect();
    const deltaNorm = ((touch.clientX - _touchStartClientX) / rect.width) * DRAG_SENSITIVITY * 2;
    const next = Math.max(-1, Math.min(1, _touchStartDragX + deltaNorm));
    _dragX = next;
    _lastDragX = next;
  }

  function onTouchEnd(e: TouchEvent): void {
    if (_activeTouchId === null) return;
    const ended = findTouchById(e.changedTouches, _activeTouchId);
    if (!ended) return;
    _activeTouchId = null;
    _dragX = null;
  }

  if (touchContainer && isTouchDevice) {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:15;pointer-events:auto;touch-action:none;';

    overlay.addEventListener(
      'touchstart',
      (e) => {
        onTouchStart(e);
        e.preventDefault();
      },
      { passive: false },
    );
    overlay.addEventListener(
      'touchmove',
      (e) => {
        onTouchMove(e, overlay);
        e.preventDefault();
      },
      { passive: false },
    );
    overlay.addEventListener('touchend', onTouchEnd);
    overlay.addEventListener('touchcancel', onTouchEnd);

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
    isTouchDevice() {
      return isTouchDevice;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const el of _touchEls) el.remove();
      _touchEls.length = 0;
    },
  };
}
