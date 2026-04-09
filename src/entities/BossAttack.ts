// BossAttack.ts: All boss shooting patterns and the per-phase shoot dispatcher

import * as THREE from 'three';
import type { IBulletPool } from '../types/game.ts';

const DEG = Math.PI / 180;
const SCALE = 3.0;

export interface BossAttackState {
  spiralAngle: number;
  shootTimer: number;
}

export function createBossAttackState(): BossAttackState {
  return { spiralAngle: 0, shootTimer: 2.0 };
}

function fireFan(group: THREE.Group, pool: IBulletPool, speedMult: number): void {
  for (const deg of [-30, -15, 0, 15, 30]) {
    const b = pool.acquire();
    if (!b) continue;
    const rad = deg * DEG;
    b.activate(
      group.position.x,
      group.position.y - SCALE * 0.4,
      Math.sin(rad) * 7 * speedMult,
      -Math.cos(rad) * 7 * speedMult,
    );
  }
}

function fireSpiral(
  group: THREE.Group,
  pool: IBulletPool,
  state: BossAttackState,
  speedMult: number,
): void {
  const b = pool.acquire();
  if (!b) return;
  b.activate(
    group.position.x,
    group.position.y - SCALE * 0.4,
    Math.sin(state.spiralAngle) * 7 * speedMult,
    -Math.cos(state.spiralAngle) * 7 * speedMult,
  );
  state.spiralAngle += 15 * DEG;
}

function fireCircle(group: THREE.Group, pool: IBulletPool, speedMult: number): void {
  for (let i = 0; i < 8; i++) {
    const b = pool.acquire();
    if (!b) continue;
    const rad = i * ((Math.PI * 2) / 8);
    b.activate(
      group.position.x,
      group.position.y,
      Math.sin(rad) * 7 * speedMult,
      Math.cos(rad) * 7 * speedMult,
    );
  }
}

function fireAimed(
  group: THREE.Group,
  pool: IBulletPool,
  playerPos: THREE.Vector3,
  count: number,
  speedMult: number,
): void {
  const dx = playerPos.x - group.position.x;
  const dy = playerPos.y - group.position.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  for (let i = 0; i < count; i++) {
    const b = pool.acquire();
    if (!b) continue;
    const spread = (i - (count - 1) / 2) * 0.18;
    b.activate(
      group.position.x + spread,
      group.position.y - SCALE * 0.3,
      (dx / len) * 8 * speedMult + spread,
      (dy / len) * 8 * speedMult,
    );
  }
}

export function doShoot(
  group: THREE.Group,
  pool: IBulletPool,
  state: BossAttackState,
  phase: number,
  ncModeActive: boolean,
  getPlayerPos: () => THREE.Vector3,
): void {
  const ncBoost = ncModeActive ? 1.3 : 1.0;
  if (phase === 0) {
    fireFan(group, pool, ncBoost);
    state.shootTimer = 2.0;
  } else if (phase === 1) {
    fireFan(group, pool, ncBoost);
    fireSpiral(group, pool, state, ncBoost);
    state.shootTimer = 1.4;
  } else {
    fireCircle(group, pool, ncBoost);
    fireAimed(group, pool, getPlayerPos(), 3, ncBoost);
    state.shootTimer = 0.9;
  }
}
