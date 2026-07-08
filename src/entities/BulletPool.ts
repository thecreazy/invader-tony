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

// Bright near-white core tinted with the variant's hue, so the bolt reads as
// a hot centre wrapped in a coloured glow rather than one flat capsule.
const CORE_TINT: Record<BulletVariant, number> = {
  player: 0xd8ffff,
  enemy: 0xffe0b0,
};

export function createBulletPool(
  scene: THREE.Scene,
  size: number,
  variant: BulletVariant,
): IBulletPool {
  const color = variant === 'player' ? CONFIG.COLORS.BULLET_PLAYER : CONFIG.COLORS.BULLET_ENEMY;

  const coreGeom = new THREE.CapsuleGeometry(0.035, 0.24, 2, 6);
  const coreMat = new THREE.MeshBasicMaterial({ color: CORE_TINT[variant] });

  const glowGeom = new THREE.CapsuleGeometry(0.12, 0.36, 2, 6);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const pool: BulletSlot[] = [];

  for (let i = 0; i < size; i++) {
    const group = new THREE.Group();

    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.z = -0.01;
    group.add(glow);

    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    group.visible = false;
    scene.add(group);
    pool.push({
      active: false,
      mesh: group,
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
      coreGeom.dispose();
      coreMat.dispose();
      glowGeom.dispose();
      glowMat.dispose();
    },
  };
}
