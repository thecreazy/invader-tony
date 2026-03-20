/**
 * Leaderboard page — top 10 scores with rank colouring.
 * Reads from leaderboard service (localStorage-backed, API-ready).
 */

import { navigate } from '../router.js';
import { getScores } from '../services/leaderboard.js';

const STYLE_ID = 'leaderboard-page-styles';
const SESSION_SCORE_KEY = 'tony_invaders_final_score';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {(() => void) | null} */
let _removeKey = null;

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes lb-row-in {
      from { transform: translateX(-20px); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }
    @keyframes lb-gold-glow {
      from { text-shadow: 0 0 4px #ffd700; }
      to   { text-shadow: 0 0 14px #ffd700, 0 0 28px #ffd700; }
    }
    @keyframes lb-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    .lb-root {
      position: fixed;
      inset: 0;
      font-family: 'Press Start 2P', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .lb-scanlines {
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

    .lb-vignette {
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

    .lb-content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
      width: 100%;
      max-width: 560px;
      box-sizing: border-box;
    }

    .lb-title {
      color: #ffff00;
      font-size: clamp(14px, 3vw, 22px);
      letter-spacing: 0.15em;
      text-shadow: 0 0 8px #ffff00, 0 0 20px #ffff00;
    }

    .lb-sep {
      color: #333;
      font-size: clamp(7px, 1.2vw, 10px);
      letter-spacing: 0.02em;
      user-select: none;
    }

    .lb-table {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .lb-row {
      display: grid;
      grid-template-columns: 2.5ch 1fr auto;
      gap: 8px;
      align-items: baseline;
      font-size: clamp(8px, 1.6vw, 12px);
      letter-spacing: 0.08em;
      padding: 4px 8px;
      animation: lb-row-in 0.25s ease-out both;
    }

    .lb-row-empty {
      color: #333;
      text-align: center;
      font-size: clamp(8px, 1.4vw, 11px);
      letter-spacing: 0.1em;
      padding: 20px 0;
    }

    .lb-row.rank-1 { color: #ffd700; animation: lb-row-in 0.25s ease-out both, lb-gold-glow 1.5s ease-in-out infinite alternate; }
    .lb-row.rank-2 { color: #c0c0c0; }
    .lb-row.rank-3 { color: #cd7f32; }
    .lb-row.rank-other { color: #39ff14; }

    .lb-row.highlight {
      background: rgba(57,255,20,0.08);
      box-shadow: inset 0 0 0 1px rgba(57,255,20,0.2);
    }

    .lb-rank  { text-align: right; opacity: 0.7; }
    .lb-name  { text-align: left; }
    .lb-score { text-align: right; font-variant-numeric: tabular-nums; }

    .lb-you-tag {
      color: #00ffff;
      font-size: 0.7em;
      margin-left: 6px;
      animation: lb-blink 1s steps(1) infinite;
    }

    .lb-back {
      background: none;
      border: none;
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(9px, 1.8vw, 12px);
      letter-spacing: 0.12em;
      color: #555;
      cursor: pointer;
      padding: 6px 2px;
      margin-top: 4px;
    }
    .lb-back:hover { color: #aaa; }

    .lb-hint {
      color: #333;
      font-size: clamp(6px, 1vw, 8px);
      letter-spacing: 0.1em;
    }
  `;
  document.head.appendChild(s);
}

function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM() {
  const scores = getScores();
  const justPlayed = sessionStorage.getItem(SESSION_SCORE_KEY);
  const justPlayedScore = justPlayed ? parseInt(justPlayed, 10) : null;

  const rootEl = document.createElement('div');
  rootEl.className = 'lb-root';

  const scanlines = document.createElement('div');
  scanlines.className = 'lb-scanlines';

  const vignette = document.createElement('div');
  vignette.className = 'lb-vignette';

  const content = document.createElement('div');
  content.className = 'lb-content';

  const titleEl = document.createElement('div');
  titleEl.className = 'lb-title';
  titleEl.textContent = 'HIGH SCORES';

  const sepEl = document.createElement('div');
  sepEl.className = 'lb-sep';
  sepEl.textContent = '══════════════════════════════════';

  const tableEl = document.createElement('div');
  tableEl.className = 'lb-table';

  if (scores.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'lb-row-empty';
    empty.textContent = 'NO SCORES YET';
    tableEl.appendChild(empty);
  } else {
    // Find index of the just-played score to highlight it
    let highlightIdx = -1;
    if (justPlayedScore !== null) {
      for (let i = scores.length - 1; i >= 0; i--) {
        if (scores[i].score === justPlayedScore) { highlightIdx = i; break; }
      }
    }

    scores.forEach((entry, i) => {
      const row = document.createElement('div');
      const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
      row.className = `lb-row ${rankClass}${i === highlightIdx ? ' highlight' : ''}`;
      row.style.animationDelay = `${i * 0.05}s`;

      const rankEl = document.createElement('span');
      rankEl.className = 'lb-rank';
      rankEl.textContent = String(i + 1).padStart(2, '0') + '.';

      const nameEl = document.createElement('span');
      nameEl.className = 'lb-name';
      nameEl.textContent = entry.name.slice(0, 8).padEnd(8, ' ');
      if (i === highlightIdx) {
        const youTag = document.createElement('span');
        youTag.className = 'lb-you-tag';
        youTag.textContent = '◄YOU';
        nameEl.appendChild(youTag);
      }

      const scoreEl = document.createElement('span');
      scoreEl.className = 'lb-score';
      scoreEl.textContent = String(entry.score).padStart(6, '0');

      row.appendChild(rankEl);
      row.appendChild(nameEl);
      row.appendChild(scoreEl);
      tableEl.appendChild(row);
    });
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'lb-back';
  backBtn.textContent = '◄ BACK';
  backBtn.addEventListener('click', () => navigate('/home'));

  const hintEl = document.createElement('div');
  hintEl.className = 'lb-hint';
  hintEl.textContent = 'ESC — BACK TO MENU';

  content.appendChild(titleEl);
  content.appendChild(sepEl);
  content.appendChild(tableEl);
  content.appendChild(backBtn);
  content.appendChild(hintEl);

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

  injectStyles();
  root = buildDOM();
  _container.appendChild(root);

  function onKey(e) {
    if (e.key === 'Escape') navigate('/home');
  }
  window.addEventListener('keydown', onKey);
  _removeKey = () => { window.removeEventListener('keydown', onKey); _removeKey = null; };
}

export function unmount() {
  if (_removeKey) _removeKey();
  if (root && _container) _container.removeChild(root);
  root = null;
  _container = null;
  removeStyles();
}

export const LeaderboardPage = { mount, unmount };
