/**
 * Particle system — pool of 200 pre-allocated meshes.
 * emit() reactivates idle particles; no allocations happen in the game loop.
 */

import * as THREE from 'three';

const POOL_SIZE    = 200;
const MAX_LIFETIME = 0.6;

export function createParticleSystem(scene) {
  // Shared geometry — all particles are tiny spheres
  const geom = new THREE.SphereGeometry(0.06, 4, 4);

  /** @type {{ mesh: THREE.Mesh, mat: THREE.MeshBasicMaterial, active: boolean, vx: number, vy: number, vz: number, lifetime: number }[]} */
  const pool = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const mat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    scene.add(mesh);
    pool.push({ mesh, mat, active: false, vx: 0, vy: 0, vz: 0, lifetime: 0 });
  }

  return {
    /**
     * Spray particles at a world position.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} count
     * @param {number|string} color  THREE.Color-compatible value
     * @param {number} speed         Base speed units/sec
     */
    emit(x, y, z, count, color, speed = 3) {
      let emitted = 0;
      for (let i = 0; i < POOL_SIZE && emitted < count; i++) {
        const p = pool[i];
        if (p.active) continue;

        p.active       = true;
        p.lifetime     = MAX_LIFETIME;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);

        const angle = Math.random() * Math.PI * 2;
        const elev  = (Math.random() - 0.5) * Math.PI;
        const spd   = speed * (0.5 + Math.random() * 0.5);
        p.vx = Math.cos(angle) * Math.cos(elev) * spd;
        p.vy = Math.sin(elev)  * spd + 1.5;
        p.vz = Math.sin(angle) * Math.cos(elev) * spd * 0.2;

        p.mat.color.set(color ?? 0xffffff);
        p.mat.opacity = 1;
        emitted++;
      }
    },

    /** @param {number} delta */
    update(delta) {
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.lifetime -= delta;
        if (p.lifetime <= 0) {
          p.active       = false;
          p.mesh.visible = false;
          continue;
        }

        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.vy -= 4 * delta; // gravity

        p.mat.opacity = p.lifetime / MAX_LIFETIME;
      }
    },

    dispose() {
      for (const p of pool) {
        scene.remove(p.mesh);
        p.mat.dispose();
      }
      geom.dispose();
    },
  };
}
