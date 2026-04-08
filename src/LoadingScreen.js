/**
 * Loading screen — shown on first load while critical assets are preloaded.
 * Arcade-cabinet aesthetic: CRT scanlines, neon green progress bar, Press Start 2P font.
 *
 * Preloads in parallel:
 *   - Google Fonts (fonts.ready)
 *   - Enemy / boss sprites (Image)
 *   - Background music OGG via XHR (byte-level progress, stored as blob URL)
 *   - JS chunks: HomePage, GamePage, Game engine, AudioManager, InputManager
 */

// ── Audio blob URL ─────────────────────────────────────────────────────────────

/** Fallback to original path until XHR completes */
let _audioBlobUrl = '/assets/donne_ricche.ogg';

/**
 * Returns the preloaded audio blob URL (or the original path on error).
 * Called lazily by ChiptunePlayer on first play — always resolves after loading screen.
 * @returns {string}
 */
export function getAudioUrl() {
  return _audioBlobUrl;
}

// ── Progress tracking ──────────────────────────────────────────────────────────

/** Weights must sum to 100 */
const WEIGHTS = {
  fonts:   5,
  images:  5,
  audio:   40,
  home:    15,
  game:    30,
  systems: 5,
};

const TOTAL = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 100

/** Current contribution of each task toward TOTAL (partial for audio, 0/weight for rest) */
const _done = { fonts: 0, images: 0, audio: 0, home: 0, game: 0, systems: 0 };

function calcPercent() {
  const sum = Object.values(_done).reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round((sum / TOTAL) * 100));
}

// ── DOM refs ──────────────────────────────────────────────────────────────────

/** @type {HTMLElement | null} */
let _overlay = null;
/** @type {HTMLElement | null} */
let _barFill = null;
/** @type {HTMLElement | null} */
let _percentEl = null;
/** @type {HTMLElement | null} */
let _statusEl = null;

function updateUI(status) {
  const pct = calcPercent();
  if (_barFill)    _barFill.style.width       = `${pct}%`;
  if (_percentEl)  _percentEl.textContent      = `${pct}%`;
  if (_statusEl && status) _statusEl.textContent = status;
}

// ── Overlay builder ───────────────────────────────────────────────────────────

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loading-screen';
  Object.assign(overlay.style, {
    position:       'fixed',
    inset:          '0',
    background:     '#000',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         '9999',
    fontFamily:     '"Press Start 2P", monospace',
    color:          '#39ff14',
    overflow:       'hidden',
  });

  // ── Keyframes ──
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ls-glow {
      from { text-shadow: 0 0 10px #ff6600, 0 0 20px #ff6600; }
      to   { text-shadow: 0 0 20px #ff6600, 0 0 40px #ff6600, 0 0 60px #ff6600; }
    }
    @keyframes ls-blink {
      0%, 49%  { opacity: 1; }
      50%, 100%{ opacity: 0; }
    }
    @keyframes ls-march {
      0%   { letter-spacing: 10px; }
      50%  { letter-spacing: 14px; }
      100% { letter-spacing: 10px; }
    }
  `;
  overlay.appendChild(style);

  // ── CRT scanlines ──
  const scanlines = document.createElement('div');
  Object.assign(scanlines.style, {
    position:       'absolute',
    inset:          '0',
    pointerEvents:  'none',
    zIndex:         '1',
    background:     'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)',
  });
  overlay.appendChild(scanlines);

  // ── Vignette ──
  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position:       'absolute',
    inset:          '0',
    pointerEvents:  'none',
    zIndex:         '1',
    background:     'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%)',
  });
  overlay.appendChild(vignette);

  // ── Content ──
  const content = document.createElement('div');
  Object.assign(content.style, {
    position:       'relative',
    zIndex:         '2',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '22px',
    width:          'min(90vw, 480px)',
    padding:        '0 16px',
  });
  overlay.appendChild(content);

  // Title
  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize:   'clamp(16px, 4vw, 28px)',
    color:      '#ff6600',
    letterSpacing: '6px',
    textAlign:  'center',
    animation:  'ls-glow 1.5s ease-in-out infinite alternate',
  });
  title.textContent = 'INVADER TONY';
  content.appendChild(title);

  // Decorative invader row (block-char sprites)
  const invaderRow = document.createElement('div');
  Object.assign(invaderRow.style, {
    display:    'flex',
    gap:        '18px',
    color:      '#ffaa00',
    fontSize:   'clamp(10px, 2vw, 14px)',
    textShadow: '0 0 6px #ffaa00',
    animation:  'ls-march 2s ease-in-out infinite',
  });
  // Each "sprite": two block chars that form a tiny invader silhouette
  ['\u2588\u2584\u2588', '\u2584\u2588\u2584', '\u2588\u2584\u2588', '\u2584\u2588\u2584', '\u2588\u2584\u2588'].forEach(ch => {
    const sp = document.createElement('span');
    sp.textContent = ch;
    invaderRow.appendChild(sp);
  });
  content.appendChild(invaderRow);

  // Separator line
  const sep = document.createElement('div');
  Object.assign(sep.style, {
    width:     '100%',
    height:    '2px',
    background: '#39ff14',
    boxShadow: '0 0 8px #39ff14',
  });
  content.appendChild(sep);

  // Progress bar
  const barWrap = document.createElement('div');
  Object.assign(barWrap.style, {
    width:      '100%',
    height:     '18px',
    border:     '2px solid #39ff14',
    boxShadow:  '0 0 8px #39ff14, inset 0 0 6px rgba(57,255,20,0.06)',
    position:   'relative',
    overflow:   'hidden',
  });

  _barFill = document.createElement('div');
  Object.assign(_barFill.style, {
    position:   'absolute',
    left:       '0',
    top:        '0',
    height:     '100%',
    width:      '0%',
    background: '#39ff14',
    boxShadow:  '0 0 14px #39ff14',
    transition: 'width 0.25s ease-out',
  });
  barWrap.appendChild(_barFill);
  content.appendChild(barWrap);

  // Percentage counter
  _percentEl = document.createElement('div');
  Object.assign(_percentEl.style, {
    fontSize:      'clamp(12px, 3vw, 18px)',
    color:         '#39ff14',
    textShadow:    '0 0 8px #39ff14',
    letterSpacing: '4px',
  });
  _percentEl.textContent = '0%';
  content.appendChild(_percentEl);

  // Status text
  _statusEl = document.createElement('div');
  Object.assign(_statusEl.style, {
    fontSize:      'clamp(6px, 1.5vw, 9px)',
    color:         '#00ffff',
    textShadow:    '0 0 6px #00ffff',
    letterSpacing: '2px',
    minHeight:     '2em',
    textAlign:     'center',
  });
  _statusEl.textContent = 'INITIALIZING...';
  content.appendChild(_statusEl);

  // Footer
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    fontSize:      '7px',
    color:         '#333',
    letterSpacing: '1px',
    textAlign:     'center',
  });
  footer.textContent = '\u00A9 1994 TONY CORP';
  content.appendChild(footer);

  return overlay;
}

// ── Asset preloaders ──────────────────────────────────────────────────────────

function loadFonts() {
  return document.fonts.ready.then(() => {
    _done.fonts = WEIGHTS.fonts;
    updateUI('LOADING...');
  });
}

function loadImages() {
  const srcs = ['/assets/tony_enemy1.png', '/assets/tony_enemy2.png', '/assets/tony_boss.png'];
  return Promise.all(
    srcs.map(src => new Promise(res => {
      const img = new Image();
      img.onload = img.onerror = res;
      img.src = src;
    }))
  ).then(() => {
    _done.images = WEIGHTS.images;
    updateUI('LOADING...');
  });
}

function loadAudio() {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/assets/donne_ricche.ogg');
    xhr.responseType = 'blob';

    xhr.onprogress = e => {
      if (e.lengthComputable && e.total > 0) {
        _done.audio = Math.min(WEIGHTS.audio, (e.loaded / e.total) * WEIGHTS.audio);
        updateUI('LOADING AUDIO...');
      }
    };

    xhr.onload = () => {
      _audioBlobUrl = URL.createObjectURL(xhr.response);
      _done.audio = WEIGHTS.audio;
      updateUI('LOADING...');
      resolve();
    };

    xhr.onerror = () => {
      // Fallback: original path will still be used by ChiptunePlayer
      _done.audio = WEIGHTS.audio;
      updateUI('LOADING...');
      resolve();
    };

    xhr.send();
  });
}

function loadHomeChunk() {
  return import('./pages/HomePage.js').then(() => {
    _done.home = WEIGHTS.home;
    updateUI('LOADING...');
  });
}

function loadGameChunks() {
  return Promise.all([
    import('./game/Game.js'),
    import('./pages/GamePage.js'),
  ]).then(() => {
    _done.game = WEIGHTS.game;
    updateUI('LOADING...');
  });
}

function loadSystemChunks() {
  return Promise.all([
    import('./systems/AudioManager.js'),
    import('./systems/ChiptunePlayer.js'),
    import('./systems/InputManager.js'),
  ]).then(() => {
    _done.systems = WEIGHTS.systems;
    updateUI('LOADING...');
  });
}

// ── Fade out ──────────────────────────────────────────────────────────────────

function fadeOut() {
  return new Promise(resolve => {
    if (!_overlay) { resolve(); return; }
    Object.assign(_overlay.style, {
      transition: 'opacity 0.4s ease-out',
      opacity:    '0',
    });
    setTimeout(() => {
      _overlay?.remove();
      _overlay = _barFill = _percentEl = _statusEl = null;
      resolve();
    }, 420);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Shows the loading overlay and preloads all critical assets in parallel.
 * Resolves once loading is complete and the overlay has faded out.
 * Safe to call only once (on app startup).
 * @returns {Promise<void>}
 */
export async function showLoadingScreen() {
  _overlay = createOverlay();
  document.body.appendChild(_overlay);
  updateUI('INITIALIZING...');

  await Promise.all([
    loadFonts(),
    loadImages(),
    loadAudio(),
    loadHomeChunk(),
    loadGameChunks(),
    loadSystemChunks(),
  ]);

  // Force 100% display so user sees the bar fill completely
  Object.values(WEIGHTS).forEach((w, i) => {
    const key = Object.keys(WEIGHTS)[i];
    _done[key] = w;
  });
  if (_barFill)   _barFill.style.width    = '100%';
  if (_percentEl) _percentEl.textContent  = '100%';
  updateUI('READY');

  // Brief hold at 100% before fading
  await new Promise(r => setTimeout(r, 350));
  await fadeOut();
}
