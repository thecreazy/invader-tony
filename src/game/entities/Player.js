/**
 * Player entity — the ship the player controls at the bottom of the screen.
 * Movement, shoot cooldown, damage flash, and invincibility frames all live here.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

const SPEED          = CONFIG.PLAYER.SPEED;
const SHOOT_COOLDOWN = CONFIG.PLAYER.BULLET_COOLDOWN / 1000; // ms → seconds
const BOUNDS         = 6.8;
const FLASH_DURATION = 0.3;   // seconds
const INVINCIBLE_DUR = 1.0;   // seconds of invincibility after a hit

// Pre-allocated colours — reused every frame, never new
const _cyan  = new THREE.Color(CONFIG.COLORS.PLAYER);
const _white = new THREE.Color(0xffffff);
const _red   = new THREE.Color(0xff4400);

/**
 * @param {THREE.Scene} scene
 * @param {import('../GameState.js').ReturnType<createGameState>} gameState
 */
export function createPlayer(scene, gameState, { onDamage } = {}) {
  // ── Geometry ──────────────────────────────────────────────────────────────
  const hullGeom   = new THREE.BoxGeometry(0.8, 0.4, 0.1);
  const wingGeom   = new THREE.BoxGeometry(0.5, 0.15, 0.1);
  const cannonGeom = new THREE.BoxGeometry(0.1, 0.32, 0.1);
  const glowGeom   = new THREE.BoxGeometry(1.0, 0.55, 0.08);

  const mat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.PLAYER });
  const glowMat = new THREE.MeshBasicMaterial({
    color: CONFIG.COLORS.PLAYER,
    transparent: true,
    opacity: 0.25,
  });

  const group = new THREE.Group();

  // Glow halo (behind hull)
  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  glowMesh.position.z = -0.02;
  group.add(glowMesh);

  // Hull
  group.add(new THREE.Mesh(hullGeom, mat));

  // Wings
  const leftWing = new THREE.Mesh(wingGeom, mat);
  leftWing.position.set(-0.55, -0.06, 0);
  leftWing.rotation.z = 0.2;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, mat);
  rightWing.position.set(0.55, -0.06, 0);
  rightWing.rotation.z = -0.2;
  group.add(rightWing);

  // Cannon
  const cannon = new THREE.Mesh(cannonGeom, mat);
  cannon.position.set(0, 0.36, 0);
  group.add(cannon);

  group.position.set(0, -4, 0);
  scene.add(group);

  // ── State ─────────────────────────────────────────────────────────────────
  let posX         = 0;
  let shootTimer   = 0;
  let flashTimer   = 0;
  let invTimer     = 0;    // invincibility timer
  let isFlashing   = false;

  return {
    mesh: group,

    getPosition() { return group.position; },

    /** @param {number} dt @param {object} input @param {object} bulletPool @param {object} audio */
    update(dt, input, bulletPool, audio) {
      // ── Movement ────────────────────────────────────────────────────────
      let dx = 0;
      if (input.isLeft())  dx -= SPEED;
      if (input.isRight()) dx += SPEED;
      posX = Math.max(-BOUNDS, Math.min(BOUNDS, posX + dx * dt));
      group.position.x = posX;

      // ── Shoot ───────────────────────────────────────────────────────────
      shootTimer -= dt;
      if (input.isFirePressed() && shootTimer <= 0) {
        this._shoot(bulletPool, audio);
        shootTimer = SHOOT_COOLDOWN;
      }

      // ── Damage flash ─────────────────────────────────────────────────────
      if (invTimer > 0) {
        invTimer -= dt;
        // Flicker during invincibility
        group.visible = Math.floor(invTimer * 10) % 2 === 0;
      } else {
        group.visible = true;
      }

      if (isFlashing) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          isFlashing = false;
          mat.color.copy(_cyan);
        }
      }
    },

    _shoot(bulletPool, audio) {
      if (!bulletPool) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(group.position.x, group.position.y + 0.72, 0, 12);
      if (audio) audio.playShoot();
    },

    /** @param {object} audio */
    takeDamage(audio) {
      if (invTimer > 0) return; // still invincible
      isFlashing = true;
      flashTimer = FLASH_DURATION;
      invTimer   = INVINCIBLE_DUR;
      mat.color.copy(_white);
      gameState.loseLife();
      if (audio)    audio.playHit();
      if (onDamage) onDamage();
    },

    dispose() {
      scene.remove(group);
      hullGeom.dispose();
      wingGeom.dispose();
      cannonGeom.dispose();
      glowGeom.dispose();
      mat.dispose();
      glowMat.dispose();
    },
  };
}
