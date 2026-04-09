// BulletPool.ts: Object pool for player and enemy bullets — no allocations in the game loop

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import type { IBulletPool, IBullet } from '../types/game.ts';

const BULLET_SPEED_OUT = 40; // world units/sec before leaving the visible area

type BulletVariant = 'player' | 'enemy';

interface BulletSlot extends IBullet {
  vx: number;
  vy: number;
}

export function createBulletPool(
  scene: THREE.Scene,
  size: number,
  variant: BulletVariant,
): IBulletPool {
  const color = variant === 'player' ? CONFIG.COLORS.BULLET_PLAYER : CONFIG.COLORS.BULLET_ENEMY;

  const geom = new THREE.CapsuleGeometry(0.04, 0.22, 2, 6);
  const mat = new THREE.MeshBasicMaterial({ color });

  const pool: BulletSlot[] = [];

  for (let i = 0; i < size; i++) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    scene.add(mesh);
    pool.push({
      active: false,
      mesh,
      vx: 0,
      vy: 0,
      activate(x, y, _vx, vy) {
        this.active = true;
        this.vx = _vx;
        this.vy = vy;
        this.mesh.visible = true;
        this.mesh.position.set(x, y, 0);
      },
      deactivate() {
        this.active = false;
        this.mesh.visible = false;
      },
    });
  }

  return {
    acquire(): IBullet | null {
      for (const b of pool) if (!b.active) return b;
      return null;
    },

    getActive(): IBullet[] {
      return pool.filter((b) => b.active);
    },

    updateAll(delta: number): void {
      for (const b of pool) {
        if (!b.active) continue;
        b.mesh.position.x += b.vx * delta;
        b.mesh.position.y += b.vy * delta;
        const ay = Math.abs(b.mesh.position.y);
        const ax = Math.abs(b.mesh.position.x);
        if (ay > BULLET_SPEED_OUT || ax > BULLET_SPEED_OUT) b.deactivate();
      }
    },

    dispose(): void {
      for (const b of pool) scene.remove(b.mesh);
      geom.dispose();
      mat.dispose();
    },
  };
}
