// HomeController.ts: Keyboard navigation, attract mode glitch timer, and portrait overlay logic

import { navigate } from '../../router.ts';
import { MENU_ITEMS } from './HomeDOM.ts';

const GLITCH_BASE = 'drop-shadow(0 0 8px #ff6600)';

export function createHomeController(
  menuEls: HTMLElement[],
  asciiEl: HTMLImageElement,
  portraitOverlay: HTMLElement,
) {
  let selectedIndex = 0;
  let attractTimer: ReturnType<typeof setTimeout> | null = null;
  let glitchInterval: ReturnType<typeof setInterval> | null = null;
  let audioCtx: AudioContext | null = null;

  function ensureAudio(): AudioContext {
    if (!audioCtx)
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    return audioCtx;
  }

  function playClick(): void {
    try {
      const ctx = ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (_) {}
  }

  function renderCursor(): void {
    menuEls.forEach((el, i) => {
      const active = i === selectedIndex;
      el.dataset['selected'] = active ? 'true' : 'false';
      el.textContent = active ? `\u25BA ${MENU_ITEMS[i].label}` : `  ${MENU_ITEMS[i].label}`;
    });
  }

  async function selectItem(index: number): Promise<void> {
    const el = menuEls[index];
    if (!el) return;
    el.classList.add('glitch-select');
    await new Promise<void>((r) => setTimeout(r, 200));
    el.classList.remove('glitch-select');
    const item = MENU_ITEMS[index];
    if (item.external) {
      window.location.href = item.route;
    } else {
      navigate(item.route);
    }
  }

  function stopAttract(): void {
    if (glitchInterval) {
      clearInterval(glitchInterval);
      glitchInterval = null;
    }
    asciiEl.style.filter = GLITCH_BASE;
  }

  function startAttract(): void {
    if (glitchInterval) return;
    glitchInterval = setInterval(() => {
      const b = 1.2 + Math.random() * 0.5;
      const bl = 4 + Math.random() * 10;
      asciiEl.style.filter = `drop-shadow(0 0 ${bl}px #ff6600) brightness(${b})`;
      setTimeout(() => {
        asciiEl.style.filter = GLITCH_BASE;
      }, 80);
    }, 150);
  }

  function resetAttract(): void {
    stopAttract();
    if (attractTimer) clearTimeout(attractTimer);
    attractTimer = setTimeout(startAttract, 10_000);
  }

  function updatePortrait(): void {
    portraitOverlay.style.display = window.innerWidth < window.innerHeight ? 'flex' : 'none';
  }

  function onKeyDown(e: KeyboardEvent): void {
    resetAttract();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      playClick();
      selectedIndex =
        e.key === 'ArrowUp'
          ? (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length
          : (selectedIndex + 1) % MENU_ITEMS.length;
      renderCursor();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void selectItem(selectedIndex);
    }
  }

  function onResize(): void {
    updatePortrait();
  }

  return {
    mount(): void {
      selectedIndex = 0;
      renderCursor();
      updatePortrait();
      resetAttract();
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
    },

    onItemClick(index: number): void {
      resetAttract();
      playClick();
      selectedIndex = index;
      renderCursor();
      void selectItem(index);
    },

    unmount(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      stopAttract();
      if (attractTimer) {
        clearTimeout(attractTimer);
        attractTimer = null;
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    },
  };
}
