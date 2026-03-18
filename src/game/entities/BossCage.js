/**
 * BossCage entity — the final boss, a massive Nicholas Cage face.
 * Three HP phases with increasing speed and multi-bullet spread patterns.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

const BOSS_HP    = CONFIG.BOSS.HP;        // 20
const [P1, P2]   = CONFIG.BOSS.PHASES;   // [0.66, 0.33]

// Phase colors: [normal, angry, enraged]
const PHASE_COLORS = [
  new THREE.Color(CONFIG.COLORS.ENEMY), // #ffaa00
  new THREE.Color(0xff4400),            // orange-red
  new THREE.Color(CONFIG.COLORS.BOSS),  // #ff0044
];

export function createBossCage(scene) {
  // ── Geometry (large, scale ~2.5× normal invader) ──────────────────────────
  const SCALE = 2.5;

  const headGeom   = new THREE.SphereGeometry(0.35 * SCALE, 10, 10);
  const eyeGeom    = new THREE.SphereGeometry(0.10 * SCALE, 8, 8);
  const noseGeom   = new THREE.BoxGeometry(0.10 * SCALE, 0.14 * SCALE, 0.08 * SCALE);
  const mouthGeom  = new THREE.BoxGeometry(0.32 * SCALE, 0.09 * SCALE, 0.06 * SCALE);
  const hairGeom   = new THREE.BoxGeometry(0.10 * SCALE, 0.22 * SCALE, 0.08 * SCALE);
  const browGeom   = new THREE.BoxGeometry(0.18 * SCALE, 0.05 * SCALE, 0.06 * SCALE);
  const teethGeom  = new THREE.BoxGeometry(0.28 * SCALE, 0.06 * SCALE, 0.05 * SCALE);

  const faceMat  = new THREE.MeshBasicMaterial({ color: PHASE_COLORS[0] });
  const darkMat  = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glowMat  = new THREE.MeshBasicMaterial({
    color: CONFIG.COLORS.ENEMY,
    transparent: true,
    opacity: 0.15,
  });

  const group = new THREE.Group();

  // Glow halo
  const glowSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.35 * SCALE + 0.15, 10, 10),
    glowMat,
  );
  glowSphere.position.z = -0.05;
  group.add(glowSphere);

  // Head
  const head = new THREE.Mesh(headGeom, faceMat);
  head.scale.set(1, 0.88, 0.65);
  group.add(head);

  // Eyes
  const leftEye = new THREE.Mesh(eyeGeom, darkMat);
  leftEye.position.set(-0.16 * SCALE, 0.07 * SCALE, 0.20 * SCALE);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, darkMat);
  rightEye.position.set(0.16 * SCALE, 0.07 * SCALE, 0.20 * SCALE);
  group.add(rightEye);

  // Eyebrows (furrowed)
  const leftBrow = new THREE.Mesh(browGeom, faceMat);
  leftBrow.position.set(-0.17 * SCALE, 0.22 * SCALE, 0.23 * SCALE);
  leftBrow.rotation.z = 0.35;
  group.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, faceMat);
  rightBrow.position.set(0.17 * SCALE, 0.22 * SCALE, 0.23 * SCALE);
  rightBrow.rotation.z = -0.35;
  group.add(rightBrow);

  // Nose
  const nose = new THREE.Mesh(noseGeom, faceMat);
  nose.position.set(0, -0.04 * SCALE, 0.26 * SCALE);
  group.add(nose);

  // Mouth (open, showing teeth)
  const mouth = new THREE.Mesh(mouthGeom, darkMat);
  mouth.position.set(0, -0.22 * SCALE, 0.24 * SCALE);
  group.add(mouth);

  const teeth = new THREE.Mesh(teethGeom, whiteMat);
  teeth.position.set(0, -0.19 * SCALE, 0.25 * SCALE);
  group.add(teeth);

  // Hair (3 strands)
  const hairDefs = [[-0.18 * SCALE, 0.38 * SCALE, 0.2 * SCALE],
                    [0,             0.44 * SCALE, 0.16 * SCALE],
                    [0.18 * SCALE,  0.38 * SCALE, 0.2 * SCALE]];
  for (const [hx, hy, hz] of hairDefs) {
    const h = new THREE.Mesh(hairGeom, faceMat);
    h.position.set(hx, hy, hz);
    group.add(h);
  }

  group.position.set(0, 4, 0);
  scene.add(group);

  // ── State ─────────────────────────────────────────────────────────────────
  let hp       = BOSS_HP;
  let phase    = 0;
  let _alive   = true;
  let offsetX  = 0;
  let dir      = 1;
  let speed    = 1.5;
  let shootTimer = 1.5;
  let time     = 0;

  function setPhase(p) {
    phase = p;
    speed = 1.5 + p * 1.2;
    faceMat.color.copy(PHASE_COLORS[p]);
    glowMat.color.copy(PHASE_COLORS[p]);
  }

  function fireSpread(bulletPool) {
    const bulletCount = phase === 0 ? 1 : phase === 1 ? 3 : 5;
    const spread      = phase === 0 ? 0 : 0.55;
    for (let i = 0; i < bulletCount; i++) {
      const b = bulletPool.acquire();
      if (!b) continue;
      const vx = bulletCount > 1
        ? (i - (bulletCount - 1) / 2) * spread
        : 0;
      b.activate(group.position.x + vx * 0.8, group.position.y - 0.9 * SCALE, vx * 0.5, -7);
    }
  }

  return {
    mesh:  group,
    get alive() { return _alive; },
    get hp()    { return hp;     },

    /** @param {number} dt @param {object} enemyBulletPool */
    update(dt, enemyBulletPool) {
      if (!_alive) return;
      time += dt;

      // Horizontal sweep
      offsetX += dir * speed * dt;
      if (offsetX >  5) { offsetX =  5; dir = -1; }
      if (offsetX < -5) { offsetX = -5; dir =  1; }
      group.position.x = offsetX;

      // Subtle pulsing scale
      const pulse = 1 + Math.sin(time * 4) * 0.02;
      group.scale.set(pulse, pulse, 1);

      // Shoot
      shootTimer -= dt;
      if (shootTimer <= 0 && enemyBulletPool) {
        fireSpread(enemyBulletPool);
        const interval = phase === 0 ? 1.8 : phase === 1 ? 1.1 : 0.65;
        shootTimer = interval;
      }
    },

    /** @returns {number} score for this hit */
    takeDamage() {
      if (!_alive) return 0;
      hp--;

      // Phase transitions
      const ratio = hp / BOSS_HP;
      const newPhase = ratio <= P2 ? 2 : ratio <= P1 ? 1 : 0;
      if (newPhase > phase) setPhase(newPhase);

      // Brief white flash
      faceMat.color.set(0xffffff);
      setTimeout(() => {
        if (_alive) faceMat.color.copy(PHASE_COLORS[phase]);
      }, 80);

      if (hp <= 0) {
        _alive        = false;
        group.visible = false;
      }

      return 50;
    },

    dispose() {
      scene.remove(group);
      headGeom.dispose(); eyeGeom.dispose(); noseGeom.dispose();
      mouthGeom.dispose(); hairGeom.dispose(); browGeom.dispose();
      teethGeom.dispose();
      faceMat.dispose(); darkMat.dispose(); whiteMat.dispose(); glowMat.dispose();
    },
  };
}
