/**
 * BossCage entity — the final boss, a giant Nicholas Cage head.
 * Three HP phases: increasing speed, glitch, and bullet hell patterns.
 * Handles its own entry animation, phase transitions, and death sequence.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

import distortVert from '../shaders/distort/distort.vert';
import distortFrag from '../shaders/distort/distort.frag';

const BOSS_HP  = CONFIG.BOSS.HP;         // 20
const [P1, P2] = CONFIG.BOSS.PHASES;     // [0.66, 0.33]
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
 *   gameState: object,
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
  const headGeom  = new THREE.SphereGeometry(0.35 * SCALE, 12, 12);
  const eyeGeom   = new THREE.SphereGeometry(0.10 * SCALE,  8,  8);
  const noseGeom  = new THREE.BoxGeometry(0.09 * SCALE, 0.13 * SCALE, 0.08 * SCALE);
  const mouthGeom = new THREE.BoxGeometry(0.32 * SCALE, 0.09 * SCALE, 0.06 * SCALE);
  const teethGeom = new THREE.BoxGeometry(0.27 * SCALE, 0.07 * SCALE, 0.05 * SCALE);
  const hairGeom  = new THREE.BoxGeometry(0.10 * SCALE, 0.24 * SCALE, 0.08 * SCALE);
  const browGeom  = new THREE.BoxGeometry(0.18 * SCALE, 0.05 * SCALE, 0.06 * SCALE);
  const glowGeom  = new THREE.SphereGeometry(0.35 * SCALE + 0.25, 10, 10);

  // Boss has its own shader material (per-instance uniforms)
  const bossUniforms = {
    uTime:            { value: 0 },
    uDistortAmount:   { value: 0.12 },
    uColor:           { value: new THREE.Color(1.0, 0.6, 0.0) },
    uGlitchIntensity: { value: 0.0 },
    uPhase:           { value: 0.0 },
  };
  const headMat = new THREE.ShaderMaterial({
    uniforms:       bossUniforms,
    vertexShader:   distortVert,
    fragmentShader: distortFrag,
  });

  const darkMat  = new THREE.MeshBasicMaterial({ color: 0x080302 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const noseMat  = new THREE.MeshBasicMaterial({ color: 0xcc7700 });
  const glowMat  = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.12 });

  const group = new THREE.Group();

  // Glow halo
  const glowSphere = new THREE.Mesh(glowGeom, glowMat);
  glowSphere.position.z = -0.08;
  group.add(glowSphere);

  // Head
  const head = new THREE.Mesh(headGeom, headMat);
  head.scale.set(1, 0.88, 0.65);
  group.add(head);

  // Eyes
  [-1, 1].forEach(side => {
    const eye = new THREE.Mesh(eyeGeom, darkMat);
    eye.position.set(side * 0.16 * SCALE, 0.07 * SCALE, 0.20 * SCALE);
    group.add(eye);

    const brow = new THREE.Mesh(browGeom, noseMat);
    brow.position.set(side * 0.17 * SCALE, 0.23 * SCALE, 0.23 * SCALE);
    brow.rotation.z = -side * 0.35;
    group.add(brow);
  });

  // Nose
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, -0.04 * SCALE, 0.26 * SCALE);
  group.add(nose);

  // Mouth + teeth
  const mouth = new THREE.Mesh(mouthGeom, darkMat);
  mouth.position.set(0, -0.22 * SCALE, 0.25 * SCALE);
  group.add(mouth);

  const teeth = new THREE.Mesh(teethGeom, whiteMat);
  teeth.position.set(0, -0.195 * SCALE, 0.26 * SCALE);
  group.add(teeth);

  // Hair strands
  [[-0.18 * SCALE, 0.40 * SCALE, 0.20 * SCALE],
   [0,             0.46 * SCALE, 0.16 * SCALE],
   [0.18 * SCALE,  0.40 * SCALE, 0.20 * SCALE]].forEach(([hx, hy, hz]) => {
    const h = new THREE.Mesh(hairGeom, noseMat);
    h.position.set(hx, hy, hz);
    group.add(h);
  });

  // Start above the screen; entry animation slides it down
  group.position.set(0, 8, 0);
  scene.add(group);

  // ── State ──────────────────────────────────────────────────────────────────
  let hp              = BOSS_HP;
  let phase           = 0;
  let _alive          = true;
  let entryComplete   = false;
  let entryProgress   = 0;    // 0→1 over 1.5s
  let moveTime        = 0;
  let shootTimer      = 2.0;
  let spiralAngle     = 0;
  let quoteTimer      = 4.0;
  let ncModeActive    = false;
  let _dying          = false;

  // ── Quote interval ────────────────────────────────────────────────────────
  function showRandomQuote() {
    const pool = QUOTES[phase] ?? QUOTES[0];
    const q    = pool[Math.floor(Math.random() * pool.length)];
    hud.showBossQuote(q);
  }

  // ── Phase management ──────────────────────────────────────────────────────
  function setPhase(p) {
    phase = p;
    bossUniforms.uPhase.value         = p;
    bossUniforms.uGlitchIntensity.value = p === 0 ? 0.0 : p === 1 ? 0.35 : 0.85;

    // Phase message on HUD
    if (p === 1) hud.showMessage("HE'S GETTING ANGRY...", 2200);
    if (p === 2) hud.showMessage("YOU DON'T SAY?!", 2200);

    // 5 shockwaves burst at phase transition
    for (let i = 0; i < 5; i++) {
      const jx = group.position.x + (Math.random() - 0.5) * 2;
      const jy = group.position.y + (Math.random() - 0.5) * 2;
      setTimeout(() => onShockwave(jx, jy), i * 80);
    }

    // Nicolas Cage Mode at phase 2
    if (p === 2 && !ncModeActive) {
      ncModeActive = true;
      onNicCageMode();
      bossUniforms.uDistortAmount.value = 0.22;
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
    const angles = [-30, -15, 0, 15, 30];
    for (const deg of angles) {
      const b = enemyBulletPool.acquire();
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

  function fireSpiral(speedMult = 1.0) {
    const b = enemyBulletPool.acquire();
    if (!b) return;
    b.activate(
      group.position.x,
      group.position.y - SCALE * 0.4,
      Math.sin(spiralAngle) * 7 * speedMult,
      -Math.cos(spiralAngle) * 7 * speedMult,
    );
    spiralAngle += 15 * DEG;
  }

  function fireCircle(speedMult = 1.0) {
    for (let i = 0; i < 8; i++) {
      const b = enemyBulletPool.acquire();
      if (!b) continue;
      const rad = i * (Math.PI * 2 / 8);
      b.activate(
        group.position.x,
        group.position.y,
        Math.sin(rad) * 7 * speedMult,
        Math.cos(rad) * 7 * speedMult,
      );
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
      b.activate(
        group.position.x + spread,
        group.position.y - SCALE * 0.3,
        (dx / len) * 8 * speedMult + spread,
        (dy / len) * 8 * speedMult,
      );
    }
  }

  function doShoot() {
    const ncBoost = ncModeActive ? 1.3 : 1.0;
    if (phase === 0) {
      fireFan(ncBoost);
      shootTimer = 2.0;
    } else if (phase === 1) {
      fireFan(ncBoost);
      fireSpiral(ncBoost);
      shootTimer = 1.4;
    } else {
      fireCircle(ncBoost);
      fireAimed(3, ncBoost);
      shootTimer = 0.9;
    }
  }

  // ── Die sequence ──────────────────────────────────────────────────────────
  function die() {
    _dying = true;
    _alive = false;
    group.visible = false;

    // 10 staggered shockwaves
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const jx = group.position.x + (Math.random() - 0.5) * 3;
        const jy = group.position.y + (Math.random() - 0.5) * 3;
        onShockwave(jx, jy);
        particleSystem.emit(jx, jy, 0, 8, 0xff4400, 4);
      }, i * 110);
    }

    // Big burst
    particleSystem.emit(group.position.x, group.position.y, 0, 40, 0xff0044, 5);
    audioManager.playVictory();

    setTimeout(() => onDeath(), 2200);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    mesh: group,
    get alive()   { return _alive;  },
    get hp()      { return hp;      },
    get phase()   { return phase;   },

    /** @param {number} dt */
    update(dt) {
      if (!_alive && !_dying) return;
      if (_dying) return;

      // Entry animation
      if (!entryComplete) {
        entryProgress = Math.min(1, entryProgress + dt / 1.5);
        const t = 1 - Math.pow(1 - entryProgress, 3); // ease-out cubic
        group.position.y = 8 + (3.5 - 8) * t;
        if (entryProgress >= 1) {
          entryComplete = true;
          audioManager.playBossEntry();
          hud.showMessage('BOSS INCOMING!', 2500);
          showRandomQuote();
        }
        // Shader time still advances during entry
        bossUniforms.uTime.value += dt;
        return;
      }

      moveTime += dt;
      bossUniforms.uTime.value += dt;

      updateMovement();

      // Pulsing scale
      const pulse = 1 + Math.sin(moveTime * 4) * 0.025;
      group.scale.set(pulse, pulse, 1);

      // Shoot
      shootTimer -= dt;
      if (shootTimer <= 0) doShoot();

      // Cycling Cage quotes
      quoteTimer -= dt;
      if (quoteTimer <= 0) {
        showRandomQuote();
        quoteTimer = 4.0;
      }
    },

    /** Called when a player bullet hits the boss */
    takeDamage() {
      if (!_alive || _dying) return;
      hp--;

      // White flash
      headMat.uniforms.uColor.value.set(0xffffff);
      setTimeout(() => {
        if (_alive) headMat.uniforms.uColor.value.set(1.0, 0.6, 0.0);
      }, 80);

      audioManager.playBossHit();
      particleSystem.emit(group.position.x, group.position.y, 0, 8, 0xff4400, 3);
      onShockwave(group.position.x, group.position.y);

      // Phase transition check
      const ratio    = hp / BOSS_HP;
      const newPhase = ratio <= P2 ? 2 : ratio <= P1 ? 1 : 0;
      if (newPhase > phase) setPhase(newPhase);

      if (hp <= 0) die();
    },

    dispose() {
      scene.remove(group);
      headGeom.dispose(); eyeGeom.dispose(); noseGeom.dispose();
      mouthGeom.dispose(); teethGeom.dispose(); hairGeom.dispose();
      browGeom.dispose(); glowGeom.dispose();
      headMat.dispose(); darkMat.dispose(); whiteMat.dispose();
      noseMat.dispose(); glowMat.dispose();
    },
  };
}
