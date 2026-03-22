/**
 * WaveManager — handles wave spawning, progression, and alive-count tracking.
 */
import { CONFIG } from '../config.js';
import { createTonyInvader, disposeInvaderResources } from './entities/TonyInvader.js';
import { STATES } from './GameState.js';

/**
 * @param {THREE.Scene} scene
 * @param {{
 *   gameState: object,
 *   grid: object,
 *   hud: object,
 *   audioManager: object,
 *   postProcessor: { setWarpIntensity: (v: number) => void },
 *   enemyBullets: object,
 *   onBossSpawn: () => void,
 * }} opts
 */
export function createWaveManager(scene, opts) {
  const { gameState, grid, hud, audioManager, postProcessor, enemyBullets, onBossSpawn } = opts;

  let invaders = [];
  let currentWaveIndex = 0;
  let waveTransitioning = false;
  let bossSpawned = false;

  function spawnGrid(waveConfig) {
    for (const inv of invaders) inv.dispose();
    invaders = [];
    disposeInvaderResources();

    const {
      cols, rows, enemyTypes,
      speedMultiplier, shootIntervalMin, shootIntervalMax, dropAmount,
    } = waveConfig;

    grid.speedMultiplier   = speedMultiplier;
    grid.shootIntervalMin  = shootIntervalMin;
    grid.shootIntervalMax  = shootIntervalMax;
    grid.currentDropAmount = dropAmount;
    grid.direction         = 1;
    grid.offsetX           = 0;
    grid.offsetY           = 0;
    grid.speed             = CONFIG.ENEMY.BASE_SPEED * speedMultiplier;
    grid.shootTimer        = 2.0;

    const hSpacing = cols <= 8 ? 1.25 : 1.1;
    const vSpacing = 1.1;
    const topY     = 4.2;

    for (let row = 0; row < rows; row++) {
      const type = enemyTypes[row] || 'basic';
      for (let col = 0; col < cols; col++) {
        invaders.push(createTonyInvader(scene, { col, row, type, hSpacing, vSpacing, topY, cols }));
      }
    }

    bossSpawned = false;
  }

  return {
    /** Initialize with wave 1 */
    init() {
      currentWaveIndex = 0;
      bossSpawned = false;
      waveTransitioning = false;
      spawnGrid(CONFIG.WAVES[0]);
    },

    /** @returns {object[]} current invaders array */
    getInvaders() { return invaders; },

    /** @returns {number} */
    getCurrentWave() { return currentWaveIndex + 1; },

    /** @returns {boolean} */
    isTransitioning() { return waveTransitioning; },

    /** @returns {boolean} */
    isBossSpawned() { return bossSpawned; },

    /** Mark boss as spawned (called by Game.js after spawnBoss()) */
    markBossSpawned() { bossSpawned = true; },

    /**
     * Update grid movement and shooting.
     * @param {number} delta
     */
    updateGrid(delta) {
      const EDGE_RIGHT = CONFIG.GAMEPLAY.EDGE_RIGHT;
      const EDGE_LEFT  = CONFIG.GAMEPLAY.EDGE_LEFT;
      let aliveCount = 0;
      let maxBaseX   = -Infinity;
      let minBaseX   =  Infinity;

      for (const inv of invaders) {
        if (!inv.alive) continue;
        aliveCount++;
        if (inv.baseX > maxBaseX) maxBaseX = inv.baseX;
        if (inv.baseX < minBaseX) minBaseX = inv.baseX;
      }

      if (aliveCount === 0) return;

      // Speed ramps only after 70% of wave is cleared
      const aliveRatio = aliveCount / invaders.length;
      const dynamicSpeed = aliveRatio > 0.3
        ? CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier
        : CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier * (1.0 + ((0.3 - aliveRatio) / 0.3) * 2.5);
      grid.speed = dynamicSpeed;

      grid.offsetX += grid.direction * grid.speed * delta;

      const rightEdge = maxBaseX + grid.offsetX;
      const leftEdge  = minBaseX + grid.offsetX;

      if (rightEdge > EDGE_RIGHT || leftEdge < EDGE_LEFT) {
        grid.direction *= -1;
        grid.offsetY   -= grid.currentDropAmount;
        grid.offsetX   += grid.direction * 0.05;
      }

      for (const inv of invaders) {
        inv.update(delta, grid.offsetX, grid.offsetY);
      }

      // Random shooting with wave-specific intervals
      grid.shootTimer -= delta;
      if (grid.shootTimer <= 0) {
        let attempts = 0;
        while (attempts < 10) {
          const idx = Math.floor(Math.random() * invaders.length);
          if (invaders[idx].alive) {
            invaders[idx].shoot(enemyBullets);
            break;
          }
          attempts++;
        }
        const min = grid.shootIntervalMin / 1000;
        const max = grid.shootIntervalMax / 1000;
        grid.shootTimer = min + Math.random() * (max - min);
      }
    },

    /**
     * Check wave clear and advance to next wave or boss.
     * Must only be called when state === STATES.PLAYING.
     * @param {number} INVADER_FLOOR_Y
     * @param {() => void} onGameOver
     */
    checkWaveClear(INVADER_FLOOR_Y, onGameOver) {
      if (waveTransitioning) return;

      for (const inv of invaders) {
        if (inv.alive && inv.mesh.position.y < INVADER_FLOOR_Y) {
          onGameOver();
          return;
        }
      }

      let alive = 0;
      for (const inv of invaders) { if (inv.alive) alive++; }

      if (alive === 0 && !bossSpawned) {
        waveTransitioning = true;
        if (currentWaveIndex < CONFIG.WAVES.length - 1) {
          currentWaveIndex++;
          const nextWave = CONFIG.WAVES[currentWaveIndex];
          hud.showMessage(nextWave.label, 2000);
          audioManager.playWaveClear();
          postProcessor.setWarpIntensity(1.0);
          setTimeout(() => {
            spawnGrid(nextWave);
            waveTransitioning = false;
            gameState.transition(STATES.PLAYING);
          }, 2200);
        } else {
          onBossSpawn();
          waveTransitioning = false;
        }
      }
    },

    dispose() {
      for (const inv of invaders) inv.dispose();
      disposeInvaderResources();
      invaders = [];
    },
  };
}
