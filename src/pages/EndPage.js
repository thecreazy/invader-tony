/**
 * End page — Game Over or Victory result screen.
 * Reads final score + result from sessionStorage (set by Game.js before routing).
 * Allows name input (max 8 chars) to save to leaderboard.
 */

import { navigate } from '../router.js';
import { saveScore } from '../services/leaderboard.js';

const STYLE_ID = 'end-page-styles';
const SESSION_SCORE_KEY  = 'tony_invaders_final_score';
const SESSION_RESULT_KEY = 'tony_invaders_result';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {(() => void) | null} */
let _cleanupInput = null;

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes end-flicker {
      0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
      20%, 22%, 24%, 55% { opacity: 0; }
    }
    @keyframes end-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes end-slide-in {
      from { transform: translateY(30px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .end-root {
      position: fixed;
      inset: 0;
      font-family: 'Press Start 2P', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      overflow: hidden;
    }

    .end-scanlines {
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0px, transparent 2px,
        rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px
      );
      pointer-events: none;
      z-index: 100;
    }

    .end-vignette {
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

    .end-content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 24px;
      text-align: center;
    }

    .end-result-gameover {
      color: #ff0044;
      font-size: clamp(20px, 5vw, 40px);
      letter-spacing: 0.1em;
      text-shadow: 0 0 12px #ff0044, 0 0 30px #ff0044;
      animation: end-flicker 3s infinite;
    }

    .end-result-win {
      color: #ffff00;
      font-size: clamp(20px, 5vw, 38px);
      letter-spacing: 0.1em;
      text-shadow: 0 0 12px #ffff00, 0 0 30px #ffff00;
      animation: end-slide-in 0.4s ease-out forwards;
    }

    .end-score-label {
      color: #888;
      font-size: clamp(8px, 1.5vw, 11px);
      letter-spacing: 0.15em;
      margin-top: 4px;
    }

    .end-score-value {
      color: #39ff14;
      font-size: clamp(18px, 4vw, 32px);
      letter-spacing: 0.12em;
      text-shadow: 0 0 8px #39ff14, 0 0 20px #39ff14;
      animation: end-slide-in 0.4s 0.1s ease-out both;
    }

    .end-name-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      animation: end-slide-in 0.4s 0.2s ease-out both;
    }

    .end-name-label {
      color: #00ffff;
      font-size: clamp(7px, 1.2vw, 10px);
      letter-spacing: 0.15em;
    }

    .end-name-input-wrap {
      display: flex;
      align-items: center;
      gap: 0;
      border: 2px solid #00ffff;
      box-shadow: 0 0 8px #00ffff;
      padding: 6px 10px;
      background: #001a1a;
    }

    .end-name-display {
      color: #00ffff;
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(14px, 3vw, 22px);
      letter-spacing: 0.2em;
      min-width: 9ch;
      text-align: left;
    }

    .end-cursor {
      display: inline-block;
      width: 0.6ch;
      height: 1.1em;
      background: #00ffff;
      margin-left: 2px;
      vertical-align: middle;
      animation: end-blink 0.7s steps(1) infinite;
    }

    .end-hint {
      color: #555;
      font-size: clamp(6px, 1vw, 8px);
      letter-spacing: 0.1em;
    }

    .end-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      animation: end-slide-in 0.4s 0.3s ease-out both;
    }

    .end-btn {
      background: none;
      border: none;
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(9px, 1.8vw, 13px);
      letter-spacing: 0.12em;
      cursor: pointer;
      padding: 6px 2px;
      transition: text-shadow 0.1s;
    }

    .end-btn-primary {
      color: #39ff14;
      text-shadow: 0 0 6px #39ff14;
    }
    .end-btn-primary:hover {
      text-shadow: 0 0 14px #39ff14, 0 0 28px #39ff14;
    }

    .end-btn-secondary {
      color: #555;
    }
    .end-btn-secondary:hover {
      color: #aaa;
    }

    .end-saved-msg {
      color: #ffff00;
      font-size: clamp(7px, 1.2vw, 10px);
      letter-spacing: 0.12em;
      text-shadow: 0 0 6px #ffff00;
      height: 1.4em;
    }
  `;
  document.head.appendChild(s);
}

function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM(score, isWin) {
  const rootEl = document.createElement('div');
  rootEl.className = 'end-root';

  const scanlines = document.createElement('div');
  scanlines.className = 'end-scanlines';

  const vignette = document.createElement('div');
  vignette.className = 'end-vignette';

  const content = document.createElement('div');
  content.className = 'end-content';

  // Result banner
  const resultEl = document.createElement('div');
  if (isWin) {
    resultEl.className = 'end-result-win';
    resultEl.textContent = 'YOU WIN!';
  } else {
    resultEl.className = 'end-result-gameover';
    resultEl.textContent = 'GAME OVER';
  }

  // Score
  const scoreLabelEl = document.createElement('div');
  scoreLabelEl.className = 'end-score-label';
  scoreLabelEl.textContent = 'FINAL SCORE';

  const scoreValueEl = document.createElement('div');
  scoreValueEl.className = 'end-score-value';
  scoreValueEl.textContent = String(score).padStart(6, '0');

  // Name input section
  const nameSection = document.createElement('div');
  nameSection.className = 'end-name-section';

  const nameLabelEl = document.createElement('div');
  nameLabelEl.className = 'end-name-label';
  nameLabelEl.textContent = 'ENTER YOUR NAME';

  const nameInputWrap = document.createElement('div');
  nameInputWrap.className = 'end-name-input-wrap';

  const nameDisplayEl = document.createElement('span');
  nameDisplayEl.className = 'end-name-display';

  const cursorEl = document.createElement('span');
  cursorEl.className = 'end-cursor';

  nameInputWrap.appendChild(nameDisplayEl);
  nameInputWrap.appendChild(cursorEl);

  const hintEl = document.createElement('div');
  hintEl.className = 'end-hint';
  hintEl.textContent = 'MAX 8 CHARS — ENTER TO CONFIRM';

  nameSection.appendChild(nameLabelEl);
  nameSection.appendChild(nameInputWrap);
  nameSection.appendChild(hintEl);

  // Saved message
  const savedMsg = document.createElement('div');
  savedMsg.className = 'end-saved-msg';
  savedMsg.textContent = '';

  // Buttons
  const buttons = document.createElement('div');
  buttons.className = 'end-buttons';

  const playAgainBtn = document.createElement('button');
  playAgainBtn.className = 'end-btn end-btn-primary';
  playAgainBtn.textContent = '► PLAY AGAIN';

  const leaderboardBtn = document.createElement('button');
  leaderboardBtn.className = 'end-btn end-btn-secondary';
  leaderboardBtn.textContent = '  HIGH SCORES';

  buttons.appendChild(playAgainBtn);
  buttons.appendChild(leaderboardBtn);

  content.appendChild(resultEl);
  content.appendChild(scoreLabelEl);
  content.appendChild(scoreValueEl);
  content.appendChild(nameSection);
  content.appendChild(savedMsg);
  content.appendChild(buttons);

  rootEl.appendChild(scanlines);
  rootEl.appendChild(vignette);
  rootEl.appendChild(content);

  // ── Name input logic ──────────────────────────────────────────────────────
  let name = '';
  let submitted = false;

  function renderName() {
    nameDisplayEl.textContent = name.padEnd(8, '_');
  }
  renderName();

  function submitScore() {
    if (submitted) return;
    submitted = true;
    const finalName = name.trim() || 'AAA';
    saveScore(finalName, score);
    cursorEl.style.display = 'none';
    nameInputWrap.style.borderColor = '#39ff14';
    nameInputWrap.style.boxShadow = '0 0 8px #39ff14';
    savedMsg.textContent = 'SCORE SAVED!';
    hintEl.textContent = 'PRESS ENTER TO PLAY AGAIN';
  }

  function onKeyDown(e) {
    if (submitted) {
      if (e.key === 'Enter' || e.key === ' ') navigate('/game');
      return;
    }
    if (e.key === 'Backspace') {
      name = name.slice(0, -1);
      renderName();
    } else if (e.key === 'Enter') {
      submitScore();
    } else if (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key) && name.length < 8) {
      name += e.key.toUpperCase();
      renderName();
    }
  }

  window.addEventListener('keydown', onKeyDown);

  playAgainBtn.addEventListener('click', () => {
    if (!submitted) submitScore();
    navigate('/game');
  });

  leaderboardBtn.addEventListener('click', () => {
    if (!submitted) submitScore();
    window.location.href = '/leaderboard';
  });

  _cleanupInput = () => {
    window.removeEventListener('keydown', onKeyDown);
    _cleanupInput = null;
  };

  return rootEl;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;

  const scoreRaw  = sessionStorage.getItem(SESSION_SCORE_KEY);
  const resultRaw = sessionStorage.getItem(SESSION_RESULT_KEY);
  const score  = scoreRaw  ? parseInt(scoreRaw, 10) : 0;
  const isWin  = resultRaw === 'win';

  injectStyles();
  root = buildDOM(score, isWin);
  _container.appendChild(root);
}

export function unmount() {
  if (_cleanupInput) _cleanupInput();
  if (root && _container) _container.removeChild(root);
  root = null;
  _container = null;
  removeStyles();
}

export const EndPage = { mount, unmount };
