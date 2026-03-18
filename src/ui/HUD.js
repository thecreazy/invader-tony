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
      100% { opacity: 0; transform: translate(-50%,-50%) scale(0.95); }
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
      display: none; flex-direction: column; align-items: center; gap: 3px;
    }
    .hud-boss-label {
      color: #ff0044; font-size: 8px; letter-spacing: 0.12em;
      text-shadow: 0 0 6px #ff0044;
    }
    .hud-boss-bar-bg {
      width: 180px; height: 8px;
      background: #220010; border: 1px solid #ff0044;
    }
    .hud-boss-bar-fill {
      height: 100%; width: 100%;
      background: #ff0044;
      transition: width 0.1s linear;
    }
    .hud-message {
      position: absolute; top: 45%; left: 50%;
      transform: translate(-50%, -50%);
      color: #ffff00; font-size: clamp(12px, 3vw, 20px);
      text-shadow: 0 0 10px #ffff00, 0 0 20px #ffff00;
      letter-spacing: 0.15em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 30;
    }
  `;
  document.head.appendChild(s);
}

/**
 * @param {HTMLElement} container
 * @param {ReturnType<import('../game/GameState.js').createGameState>} gameState
 */
export function createHUD(container, gameState) {
  injectStyles();

  const hudRoot = document.createElement('div');
  hudRoot.className = 'hud-root';

  const scoreEl    = document.createElement('div');
  scoreEl.className = 'hud-score';
  scoreEl.textContent = 'SCORE: 00000';

  const hiEl    = document.createElement('div');
  hiEl.className = 'hud-hiscore';
  const initialHi = getScores()[0]?.score ?? 0;
  hiEl.textContent = `HI: ${String(initialHi).padStart(5, '0')}`;
  let _hiScore = initialHi;

  const livesEl = document.createElement('div');
  livesEl.className = 'hud-lives';

  const waveEl  = document.createElement('div');
  waveEl.className = 'hud-wave';
  waveEl.textContent = 'WAVE 1';

  // Boss HP bar (hidden until boss spawns)
  const bossBarWrap = document.createElement('div');
  bossBarWrap.className = 'hud-boss-bar-wrap';

  const bossLabel = document.createElement('div');
  bossLabel.className = 'hud-boss-label';
  bossLabel.textContent = '— CAGE PRIME —';

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

  function updateLives(lives) {
    livesEl.textContent = '\u25B2'.repeat(Math.max(0, lives));
  }

  function updateScore(score) {
    scoreEl.textContent = `SCORE: ${String(score).padStart(5, '0')}`;
    if (score > _hiScore) {
      _hiScore = score;
      hiEl.textContent = `HI: ${String(_hiScore).padStart(5, '0')}`;
    }
  }

  function updateWave(wave) {
    waveEl.textContent = `WAVE ${wave}`;
  }

  // Initialise display
  updateLives(gameState.lives);
  updateScore(gameState.score);

  // Event subscriptions
  const _onScore = s => updateScore(s);
  const _onLives = l => updateLives(l);
  const _onWave  = w => updateWave(w);

  gameState.on('score', _onScore);
  gameState.on('lives', _onLives);
  gameState.on('wave',  _onWave);

  /** @type {ReturnType<typeof setTimeout> | null} */
  let _msgTimeout = null;

  return {
    show() { hudRoot.style.display = ''; },
    hide() { hudRoot.style.display = 'none'; },

    /**
     * Show a centred overlay message for a duration.
     * @param {string} text
     * @param {number} duration ms
     */
    showMessage(text, duration) {
      const existing = hudRoot.querySelector('.hud-message');
      if (existing) existing.remove();
      if (_msgTimeout) { clearTimeout(_msgTimeout); _msgTimeout = null; }

      const msg = document.createElement('div');
      msg.className = 'hud-message';
      msg.textContent = text;
      msg.style.animation = `hud-msg-fade ${duration}ms ease-out forwards`;
      hudRoot.appendChild(msg);

      _msgTimeout = setTimeout(() => msg.remove(), duration);
    },

    /**
     * Show the boss HP bar.
     * @param {number} hp
     * @param {number} maxHp
     */
    showBossBar(hp, maxHp) {
      bossBarWrap.style.display = 'flex';
      bossBarFill.style.width = `${(hp / maxHp) * 100}%`;
    },

    /** @param {number} hp @param {number} maxHp */
    updateBossBar(hp, maxHp) {
      bossBarFill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
    },

    hideBossBar() {
      bossBarWrap.style.display = 'none';
    },

    dispose() {
      gameState.off('score', _onScore);
      gameState.off('lives', _onLives);
      gameState.off('wave',  _onWave);
      if (_msgTimeout) clearTimeout(_msgTimeout);
      container.removeChild(hudRoot);
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}
