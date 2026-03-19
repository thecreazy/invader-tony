/**
 * HUD — HTML overlay on top of the Three.js canvas.
 * Reacts to GameState events; does not poll each frame.
 */

import { getScores } from '../services/leaderboard.js';

const STYLE_ID = 'hud-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes hud-msg-fade {
      0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.1); }
      70%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(0.9); }
    }
    @keyframes hud-quote-fade {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.9); }
      10%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
      80%  { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes tony-rainbow {
      0%   { filter: hue-rotate(0deg)   drop-shadow(0 0 8px #ff0044); }
      25%  { filter: hue-rotate(90deg)  drop-shadow(0 0 8px #ffff00); }
      50%  { filter: hue-rotate(180deg) drop-shadow(0 0 8px #00ffff); }
      75%  { filter: hue-rotate(270deg) drop-shadow(0 0 8px #ff00ff); }
      100% { filter: hue-rotate(360deg) drop-shadow(0 0 8px #ff0044); }
    }
    @keyframes tony-pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1);   }
      50%       { transform: translate(-50%, -50%) scale(1.08); }
    }
    .hud-root {
      position: absolute; inset: 0;
      pointer-events: none;
      font-family: 'Press Start 2P', monospace;
      z-index: 20;
    }
    .hud-score {
      position: absolute; top: 12px; left: 16px;
      color: #39ff14; font-size: 12px;
      text-shadow: 0 0 6px #39ff14;
    }
    .hud-hiscore {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      color: #ffff00; font-size: 10px;
      text-shadow: 0 0 6px #ffff00;
      white-space: nowrap;
    }
    .hud-lives {
      position: absolute; top: 12px; right: 16px;
      color: #00ffff; font-size: 14px;
      text-shadow: 0 0 6px #00ffff;
      letter-spacing: 0.15em;
    }
    .hud-wave {
      position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
      color: #ffffff; font-size: 10px;
      letter-spacing: 0.12em;
      text-shadow: 0 0 4px #ffffff;
      white-space: nowrap;
    }
    .hud-boss-bar-wrap {
      position: absolute; top: 36px; left: 50%; transform: translateX(-50%);
      display: none; flex-direction: column; align-items: center; gap: 4px;
    }
    .hud-boss-label {
      color: #ff0044; font-size: 8px; letter-spacing: 0.12em;
      text-shadow: 0 0 6px #ff0044;
    }
    .hud-boss-bar-bg {
      width: 220px; height: 10px;
      background: #220010; border: 1px solid #ff0044;
    }
    .hud-boss-bar-fill {
      height: 100%; width: 100%;
      background: linear-gradient(90deg, #ff0044, #ff6600);
      transition: width 0.12s linear;
    }
    .hud-message {
      position: absolute; top: 45%; left: 50%;
      transform: translate(-50%, -50%);
      color: #ffff00; font-size: clamp(12px, 3vw, 20px);
      text-shadow: 0 0 10px #ffff00, 0 0 20px #ffff00;
      letter-spacing: 0.15em;
      white-space: pre;
      text-align: center;
      pointer-events: none;
      z-index: 30;
    }
    .hud-quote {
      position: absolute; top: 58%; left: 50%;
      transform: translate(-50%, -50%);
      color: #ff6600; font-size: clamp(7px, 1.2vw, 10px);
      text-shadow: 0 0 6px #ff6600;
      letter-spacing: 0.08em;
      white-space: pre;
      text-align: center;
      pointer-events: none;
      z-index: 28;
    }
    .hud-tony-mode {
      position: absolute; top: 30%; left: 50%;
      transform: translate(-50%, -50%);
      color: #ff00ff;
      font-size: clamp(14px, 3.5vw, 24px);
      letter-spacing: 0.12em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 35;
      animation: tony-rainbow 0.6s linear infinite,
                 tony-pulse   1.0s ease-in-out infinite;
    }
  `;
  document.head.appendChild(s);
}

export function createHUD(container, gameState) {
  injectStyles();

  const hudRoot = document.createElement('div');
  hudRoot.className = 'hud-root';

  const scoreEl = document.createElement('div');
  scoreEl.className = 'hud-score';
  scoreEl.textContent = 'SCORE: 00000';

  const hiEl = document.createElement('div');
  hiEl.className = 'hud-hiscore';
  const initialHi = getScores()[0]?.score ?? 0;
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

  hudRoot.appendChild(scoreEl);
  hudRoot.appendChild(hiEl);
  hudRoot.appendChild(livesEl);
  hudRoot.appendChild(waveEl);
  hudRoot.appendChild(bossBarWrap);
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
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}
