// ParticleSystem.ts: 200-slot pre-allocated particle pool — no allocations during gameplay

import * as THREE from 'three';
import type { IParticleSystem } from '../types/game.ts';

const POOL_SIZE = 200;
const MAX_LIFETIME = 0.6;

interface Particle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  lifetime: number;
}

export function createParticleSystem(scene: THREE.Scene): IParticleSystem {
  const geom = new THREE.SphereGeometry(0.06, 4, 4);
  const pool: Particle[] = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    scene.add(mesh);
    pool.push({ mesh, mat, active: false, vx: 0, vy: 0, vz: 0, lifetime: 0 });
  }

  return {
    emit(x, y, z, count, color, speed = 3) {
      let emitted = 0;
      for (let i = 0; i < POOL_SIZE && emitted < count; i++) {
        const p = pool[i];
        if (p.active) continue;
        p.active = true;
        p.lifetime = MAX_LIFETIME;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        const angle = Math.random() * Math.PI * 2;
        const elev = (Math.random() - 0.5) * Math.PI;
        const spd = speed * (0.5 + Math.random() * 0.5);
        p.vx = Math.cos(angle) * Math.cos(elev) * spd;
        p.vy = Math.sin(elev) * spd + 1.5;
        p.vz = Math.sin(angle) * Math.cos(elev) * spd * 0.2;
        p.mat.color.set(color ?? 0xffffff);
        p.mat.opacity = 1;
        emitted++;
      }
    },

    update(delta) {
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.lifetime -= delta;
        if (p.lifetime <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.vy -= 4 * delta;
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
