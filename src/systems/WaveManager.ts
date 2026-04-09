// WaveManager.ts: Orchestrates wave lifecycle — spawning, progression, boss transition, floor check

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import { GamePhase } from '../core/GameState.ts';
import { spawnGrid } from './WaveSpawner.ts';
import { updateGrid } from './GridMovement.ts';
import type { IInvader } from '../types/entities.ts';
import type {
  IGameState,
  IGridState,
  IBulletPool,
  IAudioManager,
  IHud,
  IPostProcessor,
} from '../types/game.ts';

export interface WaveManagerOpts {
  gameState: IGameState;
  grid: IGridState;
  hud: IHud;
  audioManager: IAudioManager;
  postProcessor: IPostProcessor;
  enemyBullets: IBulletPool;
  onBossSpawn: () => void;
}

export function createWaveManager(scene: THREE.Scene, opts: WaveManagerOpts) {
  const { gameState, grid, hud, audioManager, postProcessor, enemyBullets, onBossSpawn } = opts;

  let invaders: IInvader[] = [];
  let currentWaveIdx = 0;
  let waveTransitioning = false;
  let bossSpawned = false;

  return {
    init(): void {
      currentWaveIdx = 0;
      bossSpawned = false;
      waveTransitioning = false;
      invaders = spawnGrid(scene, CONFIG.WAVES[0], grid, invaders);
    },

    getInvaders(): IInvader[] {
      return invaders;
    },
    getCurrentWave(): number {
      return currentWaveIdx + 1;
    },
    isTransitioning(): boolean {
      return waveTransitioning;
    },
    isBossSpawned(): boolean {
      return bossSpawned;
    },
    markBossSpawned(): void {
      bossSpawned = true;
    },

    updateGrid(delta: number): void {
      updateGrid(delta, invaders, grid, enemyBullets);
    },

    checkWaveClear(floorY: number, onGameOver: () => void): void {
      if (waveTransitioning) return;

      for (const inv of invaders) {
        if (inv.alive && inv.mesh.position.y < floorY) {
          onGameOver();
          return;
        }
      }

      let alive = 0;
      for (const inv of invaders) if (inv.alive) alive++;

      if (alive === 0 && !bossSpawned) {
        waveTransitioning = true;
        if (currentWaveIdx < CONFIG.WAVES.length - 1) {
          currentWaveIdx++;
          const nextWave = CONFIG.WAVES[currentWaveIdx];
          hud.showMessage(nextWave.label, 2000);
          audioManager.playWaveClear();
          postProcessor.setWarpIntensity(1.0);
          setTimeout(() => {
            invaders = spawnGrid(scene, nextWave, grid, invaders);
            waveTransitioning = false;
            gameState.transition(GamePhase.PLAYING);
          }, 2200);
        } else {
          onBossSpawn();
          waveTransitioning = false;
        }
      }
    },

    dispose(): void {
      for (const inv of invaders) inv.dispose();
      invaders = [];
    },
  };
}
