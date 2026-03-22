/**
 * End page — Game Over or Victory result screen.
 * Reads final score + result from sessionStorage (set by Game.js before routing).
 * Allows name input (max 8 chars) to save to leaderboard.
 */

import { navigate } from '../router.js';
import { saveScore, LeaderboardError } from '../services/leaderboard.js';
import styles from './EndPage.css?inline';
import { injectStyle, removeStyle } from '../utils/dom.js';
import { formatScore } from '../utils/formatScore.js';

const SESSION_SCORE_KEY  = 'tony_invaders_final_score';
const SESSION_RESULT_KEY = 'tony_invaders_result';
const SESSION_TOKEN_KEY  = 'cage_invaders_session_token';
const SESSION_HASH_KEY   = 'cage_invaders_score_hash';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {(() => void) | null} */
let _cleanupInput = null;
/** @type {HTMLStyleElement | null} */
let _styleEl = null;

// ─── Error messages ───────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  NICKNAME_PROFANITY:   'NAME NOT ALLOWED',
  INVALID_NAME:         'INVALID NAME',
  RATE_LIMIT:           'SLOW DOWN!',
  MISSING_TOKEN:        'PLAY THE GAME FIRST',
  INVALID_TOKEN:        'INVALID SESSION',
  TOKEN_EXPIRED:        'SESSION EXPIRED',
  SESSION_ALREADY_USED: 'SESSION ALREADY USED',
  DEFAULT:              'SAVE FAILED',
};

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM(score, isWin, meta = {}) {
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
  scoreValueEl.textContent = formatScore(score);

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
  let _submitting = false;

  function renderName() {
    nameDisplayEl.textContent = name.padEnd(8, '_');
  }
  renderName();

  async function submitScore() {
    if (submitted || _submitting) return;
    _submitting = true;

    cursorEl.style.display = 'none';
    savedMsg.textContent = 'SAVING...';
    savedMsg.className = 'end-saved-msg';
    hintEl.textContent = '';

    const finalName = name.trim() || 'AAA';

    try {
      await saveScore(finalName, score, meta);

      submitted = true;
      _submitting = false;
      nameInputWrap.style.borderColor = '#39ff14';
      nameInputWrap.style.boxShadow = '0 0 8px #39ff14';
      savedMsg.textContent = 'SCORE SAVED!';
      hintEl.textContent = 'PRESS ENTER TO PLAY AGAIN';

    } catch (err) {
      _submitting = false;
      cursorEl.style.display = '';

      const msg = err instanceof LeaderboardError
        ? (ERROR_MESSAGES[err.code] || ERROR_MESSAGES.DEFAULT)
        : ERROR_MESSAGES.DEFAULT;

      savedMsg.textContent = msg;
      savedMsg.className = 'end-saved-msg end-save-error';
      hintEl.textContent = 'TRY AGAIN';

      // Shake animation
      nameInputWrap.classList.add('end-shake');
      nameInputWrap.addEventListener('animationend', () => {
        nameInputWrap.classList.remove('end-shake');
      }, { once: true });
    }
  }

  function onKeyDown(e) {
    if (_submitting) return;
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
    // saveScore saves locally first (sync) then hits API in background — safe to navigate immediately
    if (!submitted && !_submitting) saveScore(name.trim() || 'AAA', score, meta).catch(() => {});
    navigate('/game');
  });

  leaderboardBtn.addEventListener('click', () => {
    if (!submitted && !_submitting) saveScore(name.trim() || 'AAA', score, meta).catch(() => {});
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
  const score        = scoreRaw ? parseInt(scoreRaw, 10) : 0;
  const isWin        = resultRaw === 'win' || resultRaw === 'victory';
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
  const scoreHash    = sessionStorage.getItem(SESSION_HASH_KEY)  || '';

  _styleEl = injectStyle(styles);
  root = buildDOM(score, isWin, { sessionToken, scoreHash });
  _container.appendChild(root);
}

export function unmount() {
  if (_cleanupInput) _cleanupInput();
  if (root && _container) _container.removeChild(root);
  root = null;
  _container = null;
  removeStyle(_styleEl);
  _styleEl = null;
}

export const EndPage = { mount, unmount };
