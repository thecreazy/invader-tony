/**
 * Home page — authentic 90s arcade cabinet CRT title screen.
 * Pure HTML + CSS, no Three.js.
 */

import { navigate } from '../router.js';
import { getScores } from '../services/leaderboard.js';

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {HTMLElement | null} */
let root = null;

/** @type {HTMLElement | null} */
let _container = null;

/** @type {number} */
let selectedIndex = 0;

/** @type {AudioContext | null} */
let audioCtx = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let attractTimer = null;

/** @type {ReturnType<typeof setInterval> | null} */
let glitchInterval = null;

/** @type {string} */
let originalAscii = '';

/** @type {HTMLElement | null} */
let asciiEl = null;

/** @type {HTMLElement | null} */
let portraitOverlay = null;

/** @type {HTMLElement[]} */
let menuEls = [];

// ─── Constants ────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { label: 'PLAY GAME',   route: '#game' },
  { label: 'HIGH SCORES', route: '#leaderboard' },
];

const ASCII_ART = `▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄  ▄▄  ▄  ▄  ▄  ▀█
█ █  █  █ █ █  █  █  ▄█
█ █  █  █ █ █  █  ████
█ █  █  ██  ██ █  █  ▀█
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█▄ ██ ▄█ ▄▄  ▄  ██  █ █
█  ██  █ █ █  █  █  █ █
█  ██  █ ██   █  █████
█  ▀▀  █ █ █ ██  █  █ █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`;

const GLITCH_CHARS = ['█', '▓', '▒', '▀', '▄'];
const STYLE_ID = 'home-page-styles';

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    :root {
      --color-bg:      #000000;
      --color-green:   #39ff14;
      --color-cyan:    #00ffff;
      --color-yellow:  #ffff00;
      --color-magenta: #ff00ff;
      --color-orange:  #ff6600;
      --color-red:     #ff0044;
      --color-white:   #ffffff;
      --color-dim:     #333333;
    }

    @keyframes crt-power-on {
      0%   { clip-path: inset(49% 0 49% 0); filter: brightness(3); }
      35%  { clip-path: inset(2% 0 2% 0);  filter: brightness(1.5); }
      100% { clip-path: inset(0% 0 0% 0);  filter: brightness(1); }
    }

    @keyframes home-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes insert-coin-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    @keyframes glow-pulse-cyan {
      from { text-shadow: 0 0 4px var(--color-cyan), 0 0 8px var(--color-cyan); }
      to   { text-shadow: 0 0 10px var(--color-cyan), 0 0 24px var(--color-cyan),
                          0 0 48px var(--color-cyan), 0 0 2px #fff; }
    }

    @keyframes glow-pulse-magenta {
      from { text-shadow: 0 0 4px var(--color-magenta), 0 0 8px var(--color-magenta); }
      to   { text-shadow: 0 0 10px var(--color-magenta), 0 0 24px var(--color-magenta),
                          0 0 48px var(--color-magenta), 0 0 2px #fff; }
    }

    @keyframes ascii-pulse {
      from { transform: scale(1.0); }
      to   { transform: scale(1.02); }
    }

    @keyframes glitch-flicker {
      0%   { opacity: 1; }
      15%  { opacity: 0; }
      30%  { opacity: 1; }
      45%  { opacity: 0; }
      60%  { opacity: 1; }
      75%  { opacity: 0; }
      90%  { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes rotate-hint {
      0%   { transform: rotate(0deg); }
      50%  { transform: rotate(90deg); }
      100% { transform: rotate(0deg); }
    }

    .home-root {
      position: fixed;
      inset: 0;
      font-family: 'Press Start 2P', monospace;
      animation: crt-power-on 320ms ease-out forwards,
                 home-fade-in 600ms ease-out forwards;
      overflow: hidden;
    }

    .home-scanlines {
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 2px,
        rgba(0,0,0,0.18) 2px,
        rgba(0,0,0,0.18) 4px
      );
      pointer-events: none;
      z-index: 100;
    }

    .home-vignette {
      position: fixed;
      inset: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 55%,
        rgba(0,0,0,0.55) 83%,
        rgba(0,0,0,0.85) 100%
      );
      pointer-events: none;
      z-index: 99;
    }

    .home-content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
      gap: 0;
    }

    .home-insert-coin {
      color: var(--color-yellow);
      font-size: 10px;
      letter-spacing: 0.15em;
      animation: insert-coin-blink 0.8s steps(1) infinite;
      margin-bottom: 16px;
    }

    .home-title-line1 {
      color: var(--color-cyan);
      font-size: clamp(28px, 6vw, 52px);
      line-height: 1.1;
      animation: glow-pulse-cyan 3s ease-in-out infinite alternate;
      text-align: center;
    }

    .home-title-invaders {
      color: var(--color-magenta);
      font-size: clamp(28px, 6vw, 52px);
      line-height: 1.1;
      animation: glow-pulse-magenta 3s ease-in-out infinite alternate;
      text-align: center;
    }

    .home-title-sep {
      color: var(--color-dim);
      font-size: clamp(8px, 1.2vw, 11px);
      letter-spacing: 0.02em;
      margin: 10px 0;
      user-select: none;
    }

    .home-ascii {
      color: var(--color-orange);
      font-size: clamp(6px, 1.2vw, 11px);
      line-height: 1.2;
      letter-spacing: 0.05em;
      margin: 6px 0;
      animation: ascii-pulse 2s ease-in-out infinite alternate;
      display: block;
      white-space: pre;
      font-family: monospace;
      user-select: none;
    }

    .home-menu {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
    }

    .home-menu-item {
      font-size: clamp(10px, 2vw, 14px);
      letter-spacing: 0.1em;
      cursor: pointer;
      user-select: none;
      padding: 4px 0;
    }

    .home-menu-item[data-selected="true"] {
      color: var(--color-green);
      text-shadow: 0 0 6px var(--color-green);
    }

    .home-menu-item[data-selected="false"] {
      color: var(--color-white);
    }

    .home-menu-item.glitch-select {
      animation: glitch-flicker 200ms steps(1) forwards;
    }

    .home-bottom {
      position: fixed;
      bottom: 12px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 8px;
      z-index: 10;
      pointer-events: none;
    }

    .home-bottom-left,
    .home-bottom-right { color: var(--color-dim); }
    .home-bottom-center { color: var(--color-yellow); }

    .home-portrait-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 200;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      font-family: 'Press Start 2P', monospace;
    }

    .home-portrait-overlay .rotate-icon {
      font-size: 48px;
      animation: rotate-hint 2s ease-in-out infinite;
      display: inline-block;
    }

    .home-portrait-overlay .rotate-text {
      color: var(--color-yellow);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-align: center;
      line-height: 1.8;
      white-space: pre;
    }
  `;
  document.head.appendChild(s);
}

function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playClick() {
  try {
    const ctx = ensureAudioCtx();
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
  } catch (_) {
    // Silently ignore — AudioContext blocked until first user gesture
  }
}

// ─── Attract mode ─────────────────────────────────────────────────────────────

function startAttractMode() {
  if (!asciiEl || glitchInterval) return;
  glitchInterval = setInterval(() => {
    if (!asciiEl) return;
    const chars = originalAscii.split('');
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
    asciiEl.textContent = chars.join('');
    setTimeout(() => {
      if (asciiEl) asciiEl.textContent = originalAscii;
    }, 80);
  }, 150);
}

function stopAttractMode() {
  if (glitchInterval) { clearInterval(glitchInterval); glitchInterval = null; }
  if (asciiEl) asciiEl.textContent = originalAscii;
}

function resetAttractTimer() {
  stopAttractMode();
  if (attractTimer) clearTimeout(attractTimer);
  attractTimer = setTimeout(startAttractMode, 10_000);
}

// ─── Portrait ─────────────────────────────────────────────────────────────────

function isPortrait() { return window.innerWidth < window.innerHeight; }

function updatePortraitOverlay() {
  if (!portraitOverlay) return;
  portraitOverlay.style.display = isPortrait() ? 'flex' : 'none';
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function renderMenuCursor() {
  menuEls.forEach((el, i) => {
    const active = i === selectedIndex;
    el.dataset.selected = active ? 'true' : 'false';
    el.textContent = active ? `\u25BA ${MENU_ITEMS[i].label}` : `  ${MENU_ITEMS[i].label}`;
  });
}

async function selectItem(index) {
  const el = menuEls[index];
  if (!el) return;
  el.classList.add('glitch-select');
  await new Promise(r => setTimeout(r, 200));
  el.classList.remove('glitch-select');
  navigate(MENU_ITEMS[index].route);
}

// ─── Event handlers ───────────────────────────────────────────────────────────

function onKeyDown(e) {
  resetAttractTimer();
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    playClick();
    selectedIndex = e.key === 'ArrowUp'
      ? (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length
      : (selectedIndex + 1) % MENU_ITEMS.length;
    renderMenuCursor();
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    selectItem(selectedIndex);
  }
}

function onResize() { updatePortraitOverlay(); }

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM() {
  const rootEl = document.createElement('div');
  rootEl.className = 'home-root';

  // Layers
  const scanlines = document.createElement('div');
  scanlines.className = 'home-scanlines';

  const vignette = document.createElement('div');
  vignette.className = 'home-vignette';

  // Content
  const content = document.createElement('div');
  content.className = 'home-content';

  // A — Insert coin
  const insertCoin = document.createElement('div');
  insertCoin.className = 'home-insert-coin';
  insertCoin.textContent = 'INSERT COIN';

  // B — Title
  const titleLine1 = document.createElement('div');
  titleLine1.className = 'home-title-line1';
  titleLine1.textContent = 'INVADER';

  const titleInvaders = document.createElement('div');
  titleInvaders.className = 'home-title-invaders';
  titleInvaders.textContent = 'TONY';

  const sep = document.createElement('div');
  sep.className = 'home-title-sep';
  sep.textContent = '══════════════════════════════════';

  // C — ASCII art
  asciiEl = document.createElement('pre');
  asciiEl.className = 'home-ascii';
  asciiEl.textContent = ASCII_ART;
  originalAscii = ASCII_ART;

  // D — Menu
  const menu = document.createElement('div');
  menu.className = 'home-menu';
  menuEls = [];

  MENU_ITEMS.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'home-menu-item';
    el.dataset.index = String(i);
    menuEls.push(el);
    menu.appendChild(el);

    el.addEventListener('click', () => {
      resetAttractTimer();
      playClick();
      selectedIndex = i;
      renderMenuCursor();
      selectItem(i);
    });
  });

  renderMenuCursor();

  // E — Bottom bar
  const bottom = document.createElement('div');
  bottom.className = 'home-bottom';

  const bleft = document.createElement('span');
  bleft.className = 'home-bottom-left';
  bleft.textContent = '\u00A9 1994 TONY CORP';

  const bcenter = document.createElement('span');
  bcenter.className = 'home-bottom-center';
  const scores = getScores();
  const hi = scores.length > 0 ? scores[0].score : 0;
  bcenter.textContent = `HI-SCORE: ${String(hi).padStart(6, '0')}`;

  const bright = document.createElement('span');
  bright.className = 'home-bottom-right';
  bright.textContent = 'V1.0';

  bottom.appendChild(bleft);
  bottom.appendChild(bcenter);
  bottom.appendChild(bright);

  // Portrait overlay
  portraitOverlay = document.createElement('div');
  portraitOverlay.className = 'home-portrait-overlay';

  const rotateIcon = document.createElement('span');
  rotateIcon.className = 'rotate-icon';
  rotateIcon.textContent = '\uD83D\uDCF1'; // 📱

  const rotateText = document.createElement('div');
  rotateText.className = 'rotate-text';
  rotateText.textContent = 'ROTATE YOUR\nDEVICE';

  portraitOverlay.appendChild(rotateIcon);
  portraitOverlay.appendChild(rotateText);

  // Assemble
  content.appendChild(insertCoin);
  content.appendChild(titleLine1);
  content.appendChild(titleInvaders);
  content.appendChild(sep);
  content.appendChild(asciiEl);
  content.appendChild(menu);

  rootEl.appendChild(scanlines);
  rootEl.appendChild(vignette);
  rootEl.appendChild(content);
  rootEl.appendChild(bottom);
  rootEl.appendChild(portraitOverlay);

  return rootEl;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;
  selectedIndex = 0;

  injectStyles();
  root = buildDOM();
  _container.appendChild(root);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  updatePortraitOverlay();
  resetAttractTimer();
}

export function unmount() {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('orientationchange', onResize);

  stopAttractMode();
  if (attractTimer) { clearTimeout(attractTimer); attractTimer = null; }

  if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }

  if (root && _container) _container.removeChild(root);

  root = null;
  _container = null;
  asciiEl = null;
  originalAscii = '';
  portraitOverlay = null;
  menuEls = [];

  removeStyles();
}

export const HomePage = { mount, unmount };
