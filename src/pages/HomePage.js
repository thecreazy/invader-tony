/**
 * Home page — authentic 90s arcade cabinet CRT title screen.
 * Pure HTML + CSS, no Three.js.
 */

import { navigate } from '../router.js';
import { getLocalScores } from '../services/leaderboard.js';
import styles from './HomePage.css?inline';
import { injectStyle, removeStyle } from '../utils/dom.js';

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {HTMLElement | null} */
let root = null;

/** @type {HTMLElement | null} */
let _container = null;

/** @type {number} */
let selectedIndex = 0;

/** @type {AudioContext | null} */
let audioCtx = null;

/** @type {HTMLStyleElement | null} */
let _styleEl = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let attractTimer = null;

/** @type {ReturnType<typeof setInterval> | null} */
let glitchInterval = null;

/** @type {HTMLElement | null} */
let asciiEl = null;

/** @type {HTMLElement | null} */
let portraitOverlay = null;

/** @type {HTMLElement[]} */
let menuEls = [];

// ─── Constants ────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { label: 'PLAY GAME',   route: '/game' },
  { label: 'HIGH SCORES', route: '/leaderboard', external: true },
  { label: 'CREDITS',     route: '/credits',     external: true },
];

const GLITCH_FILTER_BASE = 'drop-shadow(0 0 8px #ff6600)';

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
    const brightness = 1.2 + Math.random() * 0.5;
    const blur = 4 + Math.random() * 10;
    asciiEl.style.filter = `drop-shadow(0 0 ${blur}px #ff6600) brightness(${brightness})`;
    setTimeout(() => {
      if (asciiEl) asciiEl.style.filter = GLITCH_FILTER_BASE;
    }, 80);
  }, 150);
}

function stopAttractMode() {
  if (glitchInterval) { clearInterval(glitchInterval); glitchInterval = null; }
  if (asciiEl) asciiEl.style.filter = GLITCH_FILTER_BASE;
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
  const item = MENU_ITEMS[index];
  if (item.external) {
    window.location.href = item.route;
  } else {
    navigate(item.route);
  }
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

  // C — Sprite
  asciiEl = document.createElement('img');
  asciiEl.className = 'home-ascii';
  asciiEl.src = '/assets/tony_enemy1.png';
  asciiEl.alt = 'Tony Pitony';

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
  const scores = getLocalScores();
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

  _styleEl = injectStyle(styles);
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
  portraitOverlay = null;
  menuEls = [];

  removeStyle(_styleEl);
  _styleEl = null;
}

export const HomePage = { mount, unmount };
