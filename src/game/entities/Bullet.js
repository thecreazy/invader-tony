/**
 * Bullet pool — pre-allocated projectiles for both player and enemies.
 * No allocations happen in the game loop: bullets are activated/deactivated.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

/**
 * @param {THREE.Scene} scene
 * @param {number}      poolSize
 * @param {'player'|'enemy'} type
 */
export function createBulletPool(scene, poolSize, type) {
  const isPlayer = type === 'player';

  const geom = isPlayer
    ? new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6)
    : new THREE.SphereGeometry(0.08, 6, 6);

  const mat = new THREE.MeshBasicMaterial({
    color: isPlayer ? CONFIG.COLORS.BULLET_PLAYER : CONFIG.COLORS.BULLET_ENEMY,
  });

  // Add glow for player bullets
  let glowGeom = null;
  let glowMat  = null;
  if (isPlayer) {
    glowGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 6);
    glowMat  = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.BULLET_PLAYER,
      transparent: true,
      opacity: 0.25,
    });
  }

  /**
   * @typedef {{ mesh: THREE.Mesh, active: boolean, vx: number, vy: number,
   *   activate(x:number,y:number,vx:number,vy:number):void,
   *   deactivate():void }} PooledBullet
   */

  /** @type {PooledBullet[]} */
  const bullets = [];

  for (let i = 0; i < poolSize; i++) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;

    if (isPlayer && glowGeom && glowMat) {
      const glow = new THREE.Mesh(glowGeom, glowMat);
      mesh.add(glow);
    }

    scene.add(mesh);

    const b = {
      mesh,
      active: false,
      vx: 0,
      vy: 0,
      activate(x, y, vx, vy) {
        this.active = true;
        this.vx = vx;
        this.vy = vy;
        mesh.position.set(x, y, 0);
        mesh.visible = true;
      },
      deactivate() {
        this.active = false;
        mesh.visible = false;
      },
    };

    bullets.push(b);
  }

  return {
    /** @returns {PooledBullet | null} */
    acquire() {
      for (const b of bullets) {
        if (!b.active) return b;
      }
      return null; // pool exhausted — no allocation
    },

    /** @returns {PooledBullet[]} snapshot of active bullets (no allocation — filtered view) */
    getActive() {
      // Return reference to the full array; callers check .active themselves
      return bullets;
    },

    /** @param {number} dt */
    updateAll(dt) {
      for (const b of bullets) {
        if (!b.active) continue;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        if (b.mesh.position.y > 8 || b.mesh.position.y < -8) {
          b.deactivate();
        }
      }
    },

    dispose() {
      for (const b of bullets) scene.remove(b.mesh);
      geom.dispose();
      mat.dispose();
      if (glowGeom) glowGeom.dispose();
      if (glowMat)  glowMat.dispose();
    },
  };
}
