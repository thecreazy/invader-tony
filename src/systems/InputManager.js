/**
 * Input manager — keyboard and touch controls.
 * Maintains a map of currently pressed keys and touch state.
 * Attach to any container element to get on-screen touch controls.
 */

/**
 * @param {HTMLElement} [touchContainer] - Optional element to render touch buttons into.
 */
export function createInputManager(touchContainer) {
  /** @type {Record<string, boolean>} */
  const keys = {};

  let _touchLeft  = false;
  let _touchRight = false;
  let _touchFire  = false;

  // ── Keyboard ──────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    keys[e.code] = true;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ── Touch controls ────────────────────────────────────────────────────────

  const _touchEls = [];

  if (touchContainer) {
    // Overlay wrapper — sits above canvas, fills the game area
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:15;pointer-events:none;';

    // Left zone
    const leftZone = document.createElement('div');
    leftZone.style.cssText = `
      position:absolute;left:0;top:0;width:40%;height:75%;
      pointer-events:auto;
    `;
    leftZone.addEventListener('touchstart', e => { _touchLeft = true;  e.preventDefault(); }, { passive: false });
    leftZone.addEventListener('touchend',   () => { _touchLeft = false; });
    leftZone.addEventListener('touchcancel',() => { _touchLeft = false; });

    // Right zone
    const rightZone = document.createElement('div');
    rightZone.style.cssText = `
      position:absolute;right:0;top:0;width:40%;height:75%;
      pointer-events:auto;
    `;
    rightZone.addEventListener('touchstart', e => { _touchRight = true;  e.preventDefault(); }, { passive: false });
    rightZone.addEventListener('touchend',   () => { _touchRight = false; });
    rightZone.addEventListener('touchcancel',() => { _touchRight = false; });

    // Fire button
    const fireBtn = document.createElement('div');
    fireBtn.style.cssText = `
      position:absolute;left:50%;bottom:8%;
      transform:translateX(-50%);
      width:64px;height:64px;border-radius:50%;
      background:rgba(57,255,20,0.2);
      border:2px solid #39ff14;
      display:flex;align-items:center;justify-content:center;
      font-family:'Press Start 2P',monospace;
      font-size:8px;color:#39ff14;letter-spacing:0.05em;
      pointer-events:auto;user-select:none;
    `;
    fireBtn.textContent = 'FIRE';
    fireBtn.addEventListener('touchstart', e => { _touchFire = true;  e.preventDefault(); }, { passive: false });
    fireBtn.addEventListener('touchend',   () => { _touchFire = false; });
    fireBtn.addEventListener('touchcancel',() => { _touchFire = false; });

    // Direction label hints
    const leftHint = document.createElement('div');
    leftHint.style.cssText = `
      position:absolute;left:8%;bottom:8%;
      font-family:'Press Start 2P',monospace;font-size:20px;
      color:rgba(0,255,255,0.4);pointer-events:none;user-select:none;
    `;
    leftHint.textContent = '◄';

    const rightHint = document.createElement('div');
    rightHint.style.cssText = `
      position:absolute;right:8%;bottom:8%;
      font-family:'Press Start 2P',monospace;font-size:20px;
      color:rgba(0,255,255,0.4);pointer-events:none;user-select:none;
    `;
    rightHint.textContent = '►';

    overlay.appendChild(leftZone);
    overlay.appendChild(rightZone);
    overlay.appendChild(fireBtn);
    overlay.appendChild(leftHint);
    overlay.appendChild(rightHint);
    touchContainer.appendChild(overlay);
    _touchEls.push(overlay);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    isLeft()        { return !!(keys['ArrowLeft']  || keys['KeyA'] || _touchLeft);  },
    isRight()       { return !!(keys['ArrowRight'] || keys['KeyD'] || _touchRight); },
    isFirePressed() { return !!(keys['Space']                      || _touchFire);  },

    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      for (const el of _touchEls) el.remove();
      _touchEls.length = 0;
    },
  };
}
