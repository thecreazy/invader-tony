/**
 * BossCage entity — the final boss, a giant Nicolas Cage head.
 * Three HP phases: increasing speed, glitch, and bullet hell patterns.
 * Handles its own entry animation, phase transitions, and death sequence.
 *
 * Visuals: SphereGeometry head mass + BoxGeometry face screen (CanvasTexture).
 * Phase 2 swaps to a VHS-glitch variant of the texture.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';
import { generateCageTexture, generateCageTextureGlitch } from '../CageTexture.js';

const BOSS_HP  = CONFIG.BOSS.HP;
const [P1, P2] = CONFIG.BOSS.PHASES;
const SCALE    = 3.0;

// ── Cage quotes per phase ─────────────────────────────────────────────────────
const QUOTES = [
  [
    "I'M GONNA STEAL THE\nDECLARATION OF INDEPENDENCE",
    'NOT THE BEES!',
    "HOW'D IT GET BURNED?",
  ],
  [
    'YOU DON\'T SAY.',
    'I AM A VAMPIRE!',
    'WICKER MAN WAS MY MASTERPIECE',
  ],
  [
    'AAAAAAAAAHHHHH!!!',
    'I WILL EAT YOUR SOUL',
    'FACE... OFF!',
  ],
];

/**
 * @param {THREE.Scene} scene
 * @param {{
 *   enemyBulletPool: object,
 *   particleSystem: object,
 *   audioManager: object,
 *   hud: object,
 *   getPlayerPos: () => THREE.Vector3,
 *   onShockwave: (x: number, y: number) => void,
 *   onNicCageMode: () => void,
 *   onDeath: () => void,
 * }} opts
 */
export function createBossCage(scene, opts) {
  const {
    enemyBulletPool, particleSystem, audioManager, hud,
    getPlayerPos, onShockwave, onNicCageMode, onDeath,
  } = opts;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const headMassGeom = new THREE.SphereGeometry(1.5, 12, 12);
  const faceBoxGeom  = new THREE.BoxGeometry(2.8, 2.8, 0.3);
  const glowGeom     = new THREE.SphereGeometry(1.5 + 0.25, 10, 10);

  // ── Materials & textures ──────────────────────────────────────────────────
  const headMassMat = new THREE.MeshBasicMaterial({ color: 0x5a2d0c });
  const glowMat     = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.12 });

  let _normalTex = generateCageTexture(256);
  let _glitchTex = null; // generated lazily at phase 2

  const faceMat = new THREE.MeshBasicMaterial({ map: _normalTex });

  // ── Group assembly ────────────────────────────────────────────────────────
  const group = new THREE.Group();

  // Glow halo (behind head mass)
  const glowSphere = new THREE.Mesh(glowGeom, glowMat);
  glowSphere.position.z = -0.1;
  group.add(glowSphere);

  // Head mass (sphere, dark brown)
  const headMass = new THREE.Mesh(headMassGeom, headMassMat);
  headMass.scale.set(1, 0.9, 0.65);
  group.add(headMass);

  // Face screen (textured box in front of sphere)
  const faceMesh = new THREE.Mesh(faceBoxGeom, faceMat);
  faceMesh.position.z = 0.9;
  group.add(faceMesh);

  // Start above screen; entry animation slides it down
  group.position.set(0, 8, 0);
  scene.add(group);

  // ── State ─────────────────────────────────────────────────────────────────
  let hp            = BOSS_HP;
  let phase         = 0;
  let _alive        = true;
  let entryComplete = false;
  let entryProgress = 0;
  let moveTime      = 0;
  let shootTimer    = 2.0;
  let spiralAngle   = 0;
  let quoteTimer    = 4.0;
  let ncModeActive  = false;
  let _dying        = false;

  // ── Quote interval ────────────────────────────────────────────────────────
  function showRandomQuote() {
    const pool = QUOTES[phase] ?? QUOTES[0];
    hud.showBossQuote(pool[Math.floor(Math.random() * pool.length)]);
  }

  // ── Phase management ──────────────────────────────────────────────────────
  function setPhase(p) {
    phase = p;

    if (p === 1) hud.showMessage("HE'S GETTING ANGRY...", 2200);
    if (p === 2) hud.showMessage("YOU DON'T SAY?!", 2200);

    // 5 shockwaves burst at phase transition
    for (let i = 0; i < 5; i++) {
      const jx = group.position.x + (Math.random() - 0.5) * 2;
      const jy = group.position.y + (Math.random() - 0.5) * 2;
      setTimeout(() => onShockwave(jx, jy), i * 80);
    }

    // Nicolas Cage Mode + glitch texture at phase 2
    if (p === 2 && !ncModeActive) {
      ncModeActive = true;
      onNicCageMode();

      if (!_glitchTex) _glitchTex = generateCageTextureGlitch(256);
      faceMat.map = _glitchTex;
      faceMat.needsUpdate = true;
    }
  }

  // ── Movement patterns ─────────────────────────────────────────────────────
  function updateMovement() {
    const t = moveTime;
    let x, y;
    if (phase === 0) {
      x = Math.sin(t * 0.8) * 5.0;
      y = 3.5;
    } else if (phase === 1) {
      x = Math.sin(t * 1.4) * 4.0 + Math.sin(t * 3.1) * 1.5;
      y = 3.5 + Math.sin(t * 1.1) * 0.8;
    } else {
      x = Math.sin(t * 2.2) * 5.5 + Math.cos(t * 5.7) * 1.0;
      y = 3.5 + Math.sin(t * 2.8) * 1.5;
    }
    group.position.x = x;
    group.position.y = y;
  }

  // ── Shoot patterns ────────────────────────────────────────────────────────
  const DEG = Math.PI / 180;

  function fireFan(speedMult = 1.0) {
    for (const deg of [-30, -15, 0, 15, 30]) {
      const b = enemyBulletPool.acquire();
      if (!b) continue;
      const rad = deg * DEG;
      b.activate(group.position.x, group.position.y - SCALE * 0.4,
        Math.sin(rad) * 7 * speedMult, -Math.cos(rad) * 7 * speedMult);
    }
  }

  function fireSpiral(speedMult = 1.0) {
    const b = enemyBulletPool.acquire();
    if (!b) return;
    b.activate(group.position.x, group.position.y - SCALE * 0.4,
      Math.sin(spiralAngle) * 7 * speedMult, -Math.cos(spiralAngle) * 7 * speedMult);
    spiralAngle += 15 * DEG;
  }

  function fireCircle(speedMult = 1.0) {
    for (let i = 0; i < 8; i++) {
      const b = enemyBulletPool.acquire();
      if (!b) continue;
      const rad = i * (Math.PI * 2 / 8);
      b.activate(group.position.x, group.position.y,
        Math.sin(rad) * 7 * speedMult, Math.cos(rad) * 7 * speedMult);
    }
  }

  function fireAimed(count, speedMult = 1.0) {
    const playerPos = getPlayerPos();
    const dx = playerPos.x - group.position.x;
    const dy = playerPos.y - group.position.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    for (let i = 0; i < count; i++) {
      const b = enemyBulletPool.acquire();
      if (!b) continue;
      const spread = (i - (count - 1) / 2) * 0.18;
      b.activate(group.position.x + spread, group.position.y - SCALE * 0.3,
        (dx / len) * 8 * speedMult + spread, (dy / len) * 8 * speedMult);
    }
  }

  function doShoot() {
    const ncBoost = ncModeActive ? 1.3 : 1.0;
    if (phase === 0) {
      fireFan(ncBoost); shootTimer = 2.0;
    } else if (phase === 1) {
      fireFan(ncBoost); fireSpiral(ncBoost); shootTimer = 1.4;
    } else {
      fireCircle(ncBoost); fireAimed(3, ncBoost); shootTimer = 0.9;
    }
  }

  // ── Die sequence ──────────────────────────────────────────────────────────
  function die() {
    _dying = true;
    _alive = false;
    group.visible = false;

    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const jx = group.position.x + (Math.random() - 0.5) * 3;
        const jy = group.position.y + (Math.random() - 0.5) * 3;
        onShockwave(jx, jy);
        particleSystem.emit(jx, jy, 0, 8, 0xff4400, 4);
      }, i * 110);
    }

    particleSystem.emit(group.position.x, group.position.y, 0, 40, 0xff0044, 5);
    audioManager.playVictory();
    setTimeout(() => onDeath(), 2200);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    mesh: group,
    get alive()  { return _alive; },
    get hp()     { return hp; },
    get phase()  { return phase; },

    /** @param {number} dt */
    update(dt) {
      if (!_alive && !_dying) return;
      if (_dying) return;

      // Entry animation
      if (!entryComplete) {
        entryProgress = Math.min(1, entryProgress + dt / 1.5);
        const t = 1 - Math.pow(1 - entryProgress, 3);
        group.position.y = 8 + (3.5 - 8) * t;
        if (entryProgress >= 1) {
          entryComplete = true;
          audioManager.playBossEntry();
          hud.showMessage('BOSS INCOMING!', 2500);
          showRandomQuote();
        }
        return;
      }

      moveTime += dt;
      updateMovement();

      // Pulsing scale
      const pulse = 1 + Math.sin(moveTime * 4) * 0.025;
      group.scale.set(pulse, pulse, 1);

      // Shoot
      shootTimer -= dt;
      if (shootTimer <= 0) doShoot();

      // Cycling quotes
      quoteTimer -= dt;
      if (quoteTimer <= 0) { showRandomQuote(); quoteTimer = 4.0; }
    },

    takeDamage() {
      if (!_alive || _dying) return;
      hp--;

      // White flash
      const normalMat = faceMesh.material;
      faceMesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      setTimeout(() => {
        if (_alive) {
          faceMesh.material = normalMat;
        }
      }, 80);

      audioManager.playBossHit();
      particleSystem.emit(group.position.x, group.position.y, 0, 8, 0xff4400, 3);
      onShockwave(group.position.x, group.position.y);

      const ratio    = hp / BOSS_HP;
      const newPhase = ratio <= P2 ? 2 : ratio <= P1 ? 1 : 0;
      if (newPhase > phase) setPhase(newPhase);

      if (hp <= 0) die();
    },

    dispose() {
      scene.remove(group);
      headMassGeom.dispose();
      faceBoxGeom.dispose();
      glowGeom.dispose();
      headMassMat.dispose();
      faceMat.dispose();
      glowMat.dispose();
      _normalTex.dispose();
      _glitchTex?.dispose();
    },
  };
}
