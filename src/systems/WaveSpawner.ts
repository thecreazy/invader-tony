// WaveSpawner.ts: Spawns and disposes the enemy grid for a given wave configuration

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import { createInvaderEntity, disposeInvaderResources } from '../entities/InvaderEntity.ts';
import type { IInvader } from '../types/entities.ts';
import type { IGridState, IWaveConfig } from '../types/game.ts';

export function spawnGrid(
  scene: THREE.Scene,
  waveConfig: IWaveConfig,
  grid: IGridState,
  existing: IInvader[],
): IInvader[] {
  for (const inv of existing) inv.dispose();
  disposeInvaderResources();

  const {
    cols,
    rows,
    enemyTypes,
    speedMultiplier,
    shootIntervalMin,
    shootIntervalMax,
    dropAmount,
  } = waveConfig;

  grid.speedMultiplier = speedMultiplier;
  grid.shootIntervalMin = shootIntervalMin;
  grid.shootIntervalMax = shootIntervalMax;
  grid.currentDropAmount = dropAmount;
  grid.direction = 1;
  grid.offsetX = 0;
  grid.offsetY = 0;
  grid.speed = CONFIG.ENEMY.BASE_SPEED * speedMultiplier;
  grid.shootTimer = 2.0;

  const hSpacing = cols <= 8 ? 1.25 : 1.1;
  const vSpacing = 1.1;
  const topY = 4.2;

  const invaders: IInvader[] = [];
  for (let row = 0; row < rows; row++) {
    const type = (enemyTypes[row] || 'basic') as 'basic' | 'elite';
    for (let col = 0; col < cols; col++) {
      invaders.push(createInvaderEntity(scene, { col, row, type, hSpacing, vSpacing, topY, cols }));
    }
  }
  return invaders;
}
