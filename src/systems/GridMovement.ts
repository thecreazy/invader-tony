// GridMovement.ts: Enemy grid horizontal sweep, edge-drop, speed ramp, and shoot timer

import { CONFIG } from '../config.ts';
import type { IInvader } from '../types/entities.ts';
import type { IBulletPool, IGridState } from '../types/game.ts';

export function updateGrid(
  delta: number,
  invaders: IInvader[],
  grid: IGridState,
  enemyBullets: IBulletPool,
): void {
  const EDGE_RIGHT = CONFIG.GAMEPLAY.EDGE_RIGHT;
  const EDGE_LEFT = CONFIG.GAMEPLAY.EDGE_LEFT;

  let aliveCount = 0;
  let maxBaseX = -Infinity;
  let minBaseX = Infinity;

  for (const inv of invaders) {
    if (!inv.alive) continue;
    aliveCount++;
    if (inv.baseX > maxBaseX) maxBaseX = inv.baseX;
    if (inv.baseX < minBaseX) minBaseX = inv.baseX;
  }

  if (aliveCount === 0) return;

  const aliveRatio = aliveCount / invaders.length;
  const dynamicSpeed =
    aliveRatio > 0.3
      ? CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier
      : CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier * (1.0 + ((0.3 - aliveRatio) / 0.3) * 2.5);
  grid.speed = dynamicSpeed;

  grid.offsetX += grid.direction * grid.speed * delta;

  const rightEdge = maxBaseX + grid.offsetX;
  const leftEdge = minBaseX + grid.offsetX;

  if (rightEdge > EDGE_RIGHT || leftEdge < EDGE_LEFT) {
    grid.direction *= -1;
    grid.offsetY -= grid.currentDropAmount;
    grid.offsetX += grid.direction * 0.05;
  }

  for (const inv of invaders) {
    inv.update(delta, grid.offsetX, grid.offsetY);
  }

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
}
