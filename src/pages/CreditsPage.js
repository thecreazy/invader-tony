/**
 * Credits page — arcade-aesthetic scrolling credits with legal disclaimer.
 */

import { navigate } from '../router.js';

const STYLE_ID = 'credits-page-styles';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {(() => void) | null} */
let _removeKey = null;

// ─── Konami code ──────────────────────────────────────────────────────────────

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];
let konamiProgress = 0;

/** @type {HTMLElement | null} */
let easterEggEl = null;

function playKonamiSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = [523, 659, 784];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.08);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.08);
    });
    setTimeout(() => ctx.close(), 500);
  } catch (_) {}
}

function revealEasterEgg() {
  if (!easterEggEl) return;
  easterEggEl.style.display = 'block';
}

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

    @keyframes cr-glow-cyan {
      from { text-shadow: 0 0 4px var(--color-cyan), 0 0 8px var(--color-cyan); }
      to   { text-shadow: 0 0 12px var(--color-cyan), 0 0 28px var(--color-cyan), 0 0 2px #fff; }
    }
    @keyframes cr-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes cr-scroll-up {
      0%   { transform: translateY(100%); }
      100% { transform: translateY(-100%); }
    }
    @keyframes cr-border-pulse {
      from { border-color: var(--color-yellow); }
      to   { border-color: var(--color-magenta); }
    }
    @keyframes cr-egg-pop {
      0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
      70%  { transform: scale(1.1) rotate(2deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    .cr-root {
      position: fixed;
      inset: 0;
      font-family: 'Press Start 2P', monospace;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .cr-scanlines {
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0px, transparent 2px,
        rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
      );
      pointer-events: none;
      z-index: 100;
    }

    .cr-vignette {
      position: fixed;
      inset: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 55%,
        rgba(0,0,0,0.6) 85%,
        rgba(0,0,0,0.9) 100%
      );
      pointer-events: none;
      z-index: 99;
    }

    .cr-content {
      position: relative;
      z-index: 10;
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 20px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
    }

    /* ── Title ── */
    .cr-title {
      color: var(--color-cyan);
      font-size: clamp(16px, 3vw, 28px);
      letter-spacing: 0.1em;
      text-align: center;
      animation: cr-glow-cyan 2.5s ease-in-out infinite alternate;
      margin-bottom: 32px;
    }

    /* ── Sections ── */
    .cr-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;
    }

    .cr-label {
      letter-spacing: 0.15em;
      font-size: 8px;
      margin-bottom: 8px;
    }

    .cr-value {
      letter-spacing: 0.08em;
      text-align: center;
      line-height: 2;
    }

    .cr-sub {
      font-size: 7px;
      letter-spacing: 0.12em;
      margin-top: 12px;
      text-align: center;
    }

    .cr-sep {
      color: var(--color-dim);
      font-size: 8px;
      letter-spacing: 0.02em;
      text-align: center;
      margin-bottom: 32px;
      user-select: none;
    }

    /* ── Tech list ── */
    .cr-tech-list {
      list-style: none;
      padding: 0;
      margin: 0;
      color: var(--color-white);
      font-size: 9px;
      line-height: 2.2;
      text-align: center;
    }

    /* ── Disclaimer ── */
    .cr-disclaimer-title {
      color: var(--color-yellow);
      font-size: 10px;
      letter-spacing: 0.12em;
      animation: cr-blink 1s steps(1) infinite;
      margin-bottom: 16px;
      text-align: center;
    }

    .cr-disclaimer-box {
      background: rgba(255, 220, 0, 0.04);
      border: 2px solid var(--color-yellow);
      padding: 20px 24px;
      max-width: 580px;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      height: 240px;
      position: relative;
      animation: cr-border-pulse 2s ease-in-out infinite alternate;
    }

    .cr-disclaimer-box:hover .cr-scroll-text {
      animation-play-state: paused;
    }

    .cr-scroll-text {
      position: absolute;
      width: 100%;
      left: 0;
      padding: 0 24px;
      box-sizing: border-box;
      animation: cr-scroll-up 28s linear infinite;
    }

    .cr-scroll-text p {
      color: var(--color-white);
      font-size: 8px;
      line-height: 2.4;
      text-align: center;
      margin: 0;
    }

    .cr-scroll-text a {
      color: var(--color-cyan);
      text-decoration: none;
      border-bottom: 1px solid var(--color-cyan);
      display: inline-block;
      margin: 4px 0;
      transition: color 0.15s, border-color 0.15s;
    }

    .cr-scroll-text a:hover {
      color: var(--color-magenta);
      border-color: var(--color-magenta);
    }

    /* ── Easter egg ── */
    .cr-egg {
      display: none;
      border: 2px dashed var(--color-magenta);
      padding: 20px;
      margin-top: 24px;
      text-align: center;
      animation: cr-egg-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      width: 100%;
      box-sizing: border-box;
    }

    .cr-egg-ascii {
      color: var(--color-magenta);
      font-size: 8px;
      line-height: 1.4;
      display: block;
      white-space: pre;
      font-family: monospace;
      margin-bottom: 12px;
    }

    .cr-egg-found {
      color: var(--color-magenta);
      font-size: 9px;
      animation: cr-blink 0.8s steps(1) infinite;
      margin-bottom: 8px;
    }

    .cr-egg-sub1 { color: var(--color-yellow); font-size: 8px; margin-bottom: 6px; }
    .cr-egg-sub2 { color: var(--color-dim);    font-size: 7px; }

    /* ── Buttons ── */
    .cr-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 60px;
    }

    .cr-btn {
      background: transparent;
      border: 2px solid var(--color-green);
      color: var(--color-green);
      font-family: 'Press Start 2P', monospace;
      font-size: 9px;
      padding: 12px 16px;
      cursor: pointer;
      letter-spacing: 0.08em;
      transition: background 0.1s, color 0.1s;
    }

    .cr-btn:hover {
      background: var(--color-green);
      color: #000;
    }
  `;
  document.head.appendChild(s);
}

function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM() {
  const rootEl = document.createElement('div');
  rootEl.className = 'cr-root';

  // Overlays
  const scanlines = document.createElement('div');
  scanlines.className = 'cr-scanlines';

  const vignette = document.createElement('div');
  vignette.className = 'cr-vignette';

  const content = document.createElement('div');
  content.className = 'cr-content';

  // ── A: Title ──
  const title = document.createElement('div');
  title.className = 'cr-title';
  title.textContent = '< CREDITS />';
  content.appendChild(title);

  // ── B: Made by ──
  const madeBy = document.createElement('div');
  madeBy.className = 'cr-section';

  const madeByLabel = document.createElement('div');
  madeByLabel.className = 'cr-label';
  madeByLabel.style.color = 'var(--color-dim)';
  madeByLabel.textContent = 'GAME DESIGN & CODE';

  const madeByValue = document.createElement('div');
  madeByValue.className = 'cr-value';
  madeByValue.style.color = 'var(--color-green)';
  madeByValue.style.fontSize = '14px';
  madeByValue.textContent = 'RICCARDO CANELLA';

  madeBy.appendChild(madeByLabel);
  madeBy.appendChild(madeByValue);
  content.appendChild(madeBy);

  // ── C: Tech stack ──
  const tech = document.createElement('div');
  tech.className = 'cr-section';

  const techLabel = document.createElement('div');
  techLabel.className = 'cr-label';
  techLabel.style.color = 'var(--color-yellow)';
  techLabel.textContent = 'POWERED BY';

  const techList = document.createElement('ul');
  techList.className = 'cr-tech-list';
  [
    '\u25B8 THREE.JS \u2014 3D & SHADERS',
    '\u25B8 VITE \u2014 BUILD TOOL',
    '\u25B8 GLSL \u2014 SHADER MAGIC',
    '\u25B8 WEB AUDIO API \u2014 PROCEDURAL SOUNDS',
    '\u25B8 VANILLA JS \u2014 NO FRAMEWORKS WERE HARMED',
  ].forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    techList.appendChild(li);
  });

  tech.appendChild(techLabel);
  tech.appendChild(techList);
  content.appendChild(tech);

  // ── D: Separator ──
  const sep = document.createElement('p');
  sep.className = 'cr-sep';
  sep.textContent = '\u2500'.repeat(40);
  content.appendChild(sep);

  // ── E: Disclaimer ──
  const disclaimerSection = document.createElement('div');
  disclaimerSection.className = 'cr-section';

  const disclaimerTitle = document.createElement('div');
  disclaimerTitle.className = 'cr-disclaimer-title';
  disclaimerTitle.textContent = '\u26A0  AVVISO LEGALE  \u26A0';

  const disclaimerBox = document.createElement('div');
  disclaimerBox.className = 'cr-disclaimer-box';

  const scrollText = document.createElement('div');
  scrollText.className = 'cr-scroll-text';

  const disclaimerP = document.createElement('p');
  disclaimerP.innerHTML = [
    'TONY PITONY,',
    'PER FAVURI NON MI DENUNCIARE.',
    '<br><br>',
    'CHISTU JOCU \u00C8 SULU UN TRIBUTU,',
    'IO NON TENGO NIENTE.',
    '<br><br>',
    'AL MASSIMO TI POSSO DARI U CULU,',
    'MA NON LO DICIAMO A NISCIUNU.',
    '<br><br>',
    'TI GIURU CA TUTTU CHISTU',
    'LU FAZZU SULU PI GOLIARDIA.',
    'NON CI STAJU GUADAGNANDO UN EURO,',
    'ANZI SI VUOI TI PAGU NA BIRRA.',
    '<br><br>',
    'TORNU IN SICILIA SULU PI OFFRITILLA \u2014',
    'TE LO GIUROOOO, COMP\u00C0.',
    '<br><br>',
    '\u00C8 TUTTU GRATUITU.',
    'PURU U CODICI SORGENTI \u00C8 GRATIS',
    'E SI TROVA SU GITHUB:',
    '<br><br>',
    '<a href="#" target="_blank" rel="noopener">GITHUB — VIENI A GUARDARE</a>',
    '<br><br>',
    'VUOI LA BIRRA?',
    'SCRIVIMI:',
    '<br><br>',
    '<a href="#" target="_blank" rel="noopener">LINKEDIN</a>',
    '<br>',
    '<a href="#" target="_blank" rel="noopener">INSTAGRAM</a>',
    '<br><br>',
    'TI PREGU COMP\u00C0,',
    'NON MI DENUNCIARI... \uD83D\uDE4F',
  ].join('<br>');

  scrollText.appendChild(disclaimerP);
  disclaimerBox.appendChild(scrollText);

  disclaimerSection.appendChild(disclaimerTitle);
  disclaimerSection.appendChild(disclaimerBox);
  content.appendChild(disclaimerSection);

  // ── F: Easter egg ──
  easterEggEl = document.createElement('div');
  easterEggEl.className = 'cr-egg';

  const eggAscii = document.createElement('pre');
  eggAscii.className = 'cr-egg-ascii';
  eggAscii.textContent = [
    '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588  \u2588\u2588 \u2588\u2588    \u2588\u2588',
    '  \u2588\u2588    \u2588\u2588    \u2588\u2588 \u2588\u2588\u2588\u2588 \u2588\u2588  \u2588\u2588  \u2588\u2588',
    '  \u2588\u2588    \u2588\u2588    \u2588\u2588 \u2588\u2588 \u2588\u2588\u2588\u2588   \u2588\u2588\u2588\u2588',
    '  \u2588\u2588     \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588   \u2588\u2588    \u2588\u2588',
  ].join('\n');

  const eggFound = document.createElement('div');
  eggFound.className = 'cr-egg-found';
  eggFound.textContent = '\uD83D\uDC23 HAI TROVATO L\'EASTER EGG! \uD83D\uDC23';

  const eggSub1 = document.createElement('div');
  eggSub1.className = 'cr-egg-sub1';
  eggSub1.textContent = 'TONY APPREZZEREBBE.';

  const eggSub2 = document.createElement('div');
  eggSub2.className = 'cr-egg-sub2';
  eggSub2.textContent = '(O FORSE NO. MA ALMENO CI HAI PROVATO.)';

  easterEggEl.appendChild(eggAscii);
  easterEggEl.appendChild(eggFound);
  easterEggEl.appendChild(eggSub1);
  easterEggEl.appendChild(eggSub2);
  content.appendChild(easterEggEl);

  // ── G: Buttons ──
  const buttons = document.createElement('div');
  buttons.className = 'cr-buttons';

  const backBtn = document.createElement('button');
  backBtn.className = 'cr-btn';
  backBtn.textContent = '\u25BA BACK TO MENU';
  backBtn.addEventListener('click', () => navigate('/home'));

  const playBtn = document.createElement('button');
  playBtn.className = 'cr-btn';
  playBtn.textContent = '\u25BA PLAY AGAIN';
  playBtn.addEventListener('click', () => navigate('/game'));

  buttons.appendChild(backBtn);
  buttons.appendChild(playBtn);
  content.appendChild(buttons);

  rootEl.appendChild(scanlines);
  rootEl.appendChild(vignette);
  rootEl.appendChild(content);

  return rootEl;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;
  konamiProgress = 0;
  easterEggEl = null;

  injectStyles();
  root = buildDOM();
  _container.appendChild(root);

  function onKey(e) {
    const key = e.key;
    if (key === KONAMI[konamiProgress]) {
      konamiProgress++;
      if (konamiProgress === KONAMI.length) {
        konamiProgress = 0;
        playKonamiSound();
        revealEasterEgg();
      }
    } else {
      konamiProgress = key === KONAMI[0] ? 1 : 0;
    }
  }

  window.addEventListener('keydown', onKey);
  _removeKey = () => { window.removeEventListener('keydown', onKey); _removeKey = null; };
}

export function unmount() {
  if (_removeKey) _removeKey();
  if (root && _container) _container.removeChild(root);
  root = null;
  _container = null;
  easterEggEl = null;
  konamiProgress = 0;
  removeStyles();
}

export const CreditsPage = { mount, unmount };
