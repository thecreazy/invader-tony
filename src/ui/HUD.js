/**
 * HUD — HTML overlay on top of the Three.js canvas.
 * Reacts to GameState events; does not poll each frame.
 */

import { getLocalScores } from '../services/leaderboard.js';
import styles from './HUD.css?inline';
import { injectStyle, removeStyle } from '../utils/dom.js';

const MUTE_KEY = 'invadertony_muted';

/**
 * @param {HTMLElement} container
 * @param {object} gameState
 * @param {{ onMuteToggle?: (muted: boolean) => void }} [opts]
 */
export function createHUD(container, gameState, opts = {}) {
  const _styleEl = injectStyle(styles);

  const hudRoot = document.createElement('div');
  hudRoot.className = 'hud-root';

  const scoreEl = document.createElement('div');
  scoreEl.className = 'hud-score';
  scoreEl.textContent = 'SCORE: 00000';

  const hiEl = document.createElement('div');
  hiEl.className = 'hud-hiscore';
  const initialHi = getLocalScores()[0]?.score ?? 0;
  hiEl.textContent = `HI: ${String(initialHi).padStart(5, '0')}`;
  let _hiScore = initialHi;

  const livesEl = document.createElement('div');
  livesEl.className = 'hud-lives';

  const waveEl = document.createElement('div');
  waveEl.className = 'hud-wave';
  waveEl.textContent = 'WAVE 1';

  // Boss HP bar
  const bossBarWrap = document.createElement('div');
  bossBarWrap.className = 'hud-boss-bar-wrap';

  const bossLabel = document.createElement('div');
  bossLabel.className = 'hud-boss-label';
  bossLabel.textContent = 'TONY HP';

  const bossBarBg   = document.createElement('div');
  bossBarBg.className = 'hud-boss-bar-bg';

  const bossBarFill = document.createElement('div');
  bossBarFill.className = 'hud-boss-bar-fill';

  bossBarBg.appendChild(bossBarFill);
  bossBarWrap.appendChild(bossLabel);
  bossBarWrap.appendChild(bossBarBg);

  // Mute button
  let _muted = localStorage.getItem(MUTE_KEY) === 'true';
  const muteBtn = document.createElement('button');
  muteBtn.className = 'hud-mute';
  muteBtn.textContent = _muted ? '\u266A OFF' : '\u266A ON';

  // Apply initial mute state on next tick (after chiptunePlayer is wired up)
  setTimeout(() => opts.onMuteToggle?.(_muted), 0);

  muteBtn.addEventListener('click', () => {
    _muted = !_muted;
    localStorage.setItem(MUTE_KEY, String(_muted));
    muteBtn.textContent = _muted ? '\u266A OFF' : '\u266A ON';
    opts.onMuteToggle?.(_muted);
  });

  hudRoot.appendChild(scoreEl);
  hudRoot.appendChild(hiEl);
  hudRoot.appendChild(livesEl);
  hudRoot.appendChild(waveEl);
  hudRoot.appendChild(bossBarWrap);
  hudRoot.appendChild(muteBtn);
  container.appendChild(hudRoot);

  // ── Helpers ─────────────────────────────────────────────────────────────
  function updateLives(n)  { livesEl.textContent = '\u25B2'.repeat(Math.max(0, n)); }
  function updateScore(s)  {
    scoreEl.textContent = `SCORE: ${String(s).padStart(5, '0')}`;
    if (s > _hiScore) {
      _hiScore = s;
      hiEl.textContent = `HI: ${String(_hiScore).padStart(5, '0')}`;
    }
  }
  function updateWave(w)   { waveEl.textContent = `WAVE ${w}`; }

  updateLives(gameState.lives);
  updateScore(gameState.score);

  const _onScore = s => updateScore(s);
  const _onLives = l => updateLives(l);
  const _onWave  = w => updateWave(w);
  gameState.on('score', _onScore);
  gameState.on('lives', _onLives);
  gameState.on('wave',  _onWave);

  let _msgTimeout   = null;
  let _quoteTimeout = null;
  let _tonyModeEl    = null;

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    show() { hudRoot.style.display = ''; },
    hide() { hudRoot.style.display = 'none'; },

    showMessage(text, duration) {
      hudRoot.querySelector('.hud-message')?.remove();
      if (_msgTimeout) { clearTimeout(_msgTimeout); _msgTimeout = null; }
      const msg = document.createElement('div');
      msg.className = 'hud-message';
      msg.textContent = text;
      msg.style.animation = `hud-msg-fade ${duration}ms ease-out forwards`;
      hudRoot.appendChild(msg);
      _msgTimeout = setTimeout(() => msg.remove(), duration);
    },

    /** Show a Tony quote in a smaller bar below the message area */
    showBossQuote(text) {
      hudRoot.querySelector('.hud-quote')?.remove();
      if (_quoteTimeout) { clearTimeout(_quoteTimeout); _quoteTimeout = null; }
      const q = document.createElement('div');
      q.className = 'hud-quote';
      q.textContent = `"${text}"`;
      q.style.animation = 'hud-quote-fade 3.8s ease-in-out forwards';
      hudRoot.appendChild(q);
      _quoteTimeout = setTimeout(() => q.remove(), 3800);
    },

    showBossBar(hp, maxHp) {
      bossBarWrap.style.display = 'flex';
      bossBarFill.style.width = `${(hp / maxHp) * 100}%`;
    },

    updateBossBar(hp, maxHp) {
      bossBarFill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
    },

    hideBossBar() { bossBarWrap.style.display = 'none'; },

    showTonyMode() {
      if (_tonyModeEl) return;
      _tonyModeEl = document.createElement('div');
      _tonyModeEl.className = 'hud-tony-mode';
      _tonyModeEl.textContent = '\uD83D\uDD25 TONY MODE \uD83D\uDD25';
      hudRoot.appendChild(_tonyModeEl);
    },

    hideTonyMode() {
      _tonyModeEl?.remove();
      _tonyModeEl = null;
    },

    dispose() {
      gameState.off('score', _onScore);
      gameState.off('lives', _onLives);
      gameState.off('wave',  _onWave);
      if (_msgTimeout)   clearTimeout(_msgTimeout);
      if (_quoteTimeout) clearTimeout(_quoteTimeout);
      container.removeChild(hudRoot);
      removeStyle(_styleEl);
    },
  };
}
