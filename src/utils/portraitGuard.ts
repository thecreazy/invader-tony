// portraitGuard.ts: Shared "rotate your device" overlay — shown whenever the viewport is
// taller than it is wide, since the game is landscape-only. Used by every page (home, game, end).

import styles from '../ui/PortraitGuard.css?inline';
import { injectStyle, removeStyle } from './dom.ts';

export interface PortraitGuard {
  destroy(): void;
}

export function createPortraitGuard(root: HTMLElement): PortraitGuard {
  const styleEl = injectStyle(styles);

  const overlay = document.createElement('div');
  overlay.className = 'portrait-guard-overlay';

  const icon = document.createElement('span');
  icon.className = 'rotate-icon';
  icon.textContent = '📱';

  const text = document.createElement('div');
  text.className = 'rotate-text';
  text.textContent = 'ROTATE YOUR\nDEVICE';

  overlay.appendChild(icon);
  overlay.appendChild(text);
  root.appendChild(overlay);

  function update(): void {
    overlay.style.display = window.innerWidth < window.innerHeight ? 'flex' : 'none';
  }

  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);

  return {
    destroy(): void {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      overlay.remove();
      removeStyle(styleEl);
    },
  };
}
