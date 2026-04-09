/**
 * Player entity — the ship the player controls at the bottom of the screen.
 * Movement, shoot cooldown, damage flash, and invincibility frames all live here.
 *
 * Geometry: ShapeGeometry fuselage + swept wings + engine pods + animated flames.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

const SPEED          = CONFIG.PLAYER.SPEED;
const SHOOT_COOLDOWN = CONFIG.PLAYER.BULLET_COOLDOWN / 1000; // ms → seconds
const BOUNDS         = 6.8;
const FLASH_DURATION = 0.3;
const INVINCIBLE_DUR = 1.0;

// Pre-allocated colours — reused every frame, never new
const _cyan  = new THREE.Color(CONFIG.COLORS.PLAYER);
const _white = new THREE.Color(0xffffff);

/**
 * @param {THREE.Scene} scene
 * @param {object} gameState
 * @param {{ onDamage?: () => void }} opts
 */
export function createPlayer(scene, gameState, { onDamage } = {}) {

  // ── Fuselage — tapered hexagonal body with integrated cannon ──────────────
  const fuselageShape = new THREE.Shape();
  fuselageShape.moveTo( 0.00,  0.65);
  fuselageShape.lineTo( 0.09,  0.34);
  fuselageShape.lineTo( 0.22,  0.06);
  fuselageShape.lineTo( 0.22, -0.30);
  fuselageShape.lineTo(-0.22, -0.30);
  fuselageShape.lineTo(-0.22,  0.06);
  fuselageShape.lineTo(-0.09,  0.34);
  fuselageShape.closePath();
  const fuselageGeom = new THREE.ShapeGeometry(fuselageShape);

  // ── Wings — swept-back triangular delta shape ─────────────────────────────
  const leftWingShape = new THREE.Shape();
  leftWingShape.moveTo(-0.22,  0.06);
  leftWingShape.lineTo(-0.88, -0.20);
  leftWingShape.lineTo(-0.70, -0.42);
  leftWingShape.lineTo(-0.22, -0.30);
  leftWingShape.closePath();
  const leftWingGeom = new THREE.ShapeGeometry(leftWingShape);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo( 0.22,  0.06);
  rightWingShape.lineTo( 0.88, -0.20);
  rightWingShape.lineTo( 0.70, -0.42);
  rightWingShape.lineTo( 0.22, -0.30);
  rightWingShape.closePath();
  const rightWingGeom = new THREE.ShapeGeometry(rightWingShape);

  // ── Engine pods — two small boxes flanking the fuselage base ─────────────
  const podGeom = new THREE.BoxGeometry(0.13, 0.22, 0.1);

  // ── Cockpit — small bright window in the nose ─────────────────────────────
  const cockpitGeom = new THREE.BoxGeometry(0.11, 0.14, 0.12);

  // ── Engine flames — circles that animate below each pod ───────────────────
  const flameGeom = new THREE.CircleGeometry(0.09, 8);

  // ── Glow halo — soft circular halo behind the whole ship ─────────────────
  const glowGeom = new THREE.CircleGeometry(0.72, 20);

  // ── Materials ──────────────────────────────────────────────────────────────
  const mat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.PLAYER });

  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0xaaffff });

  const flameMat = new THREE.MeshBasicMaterial({
    color:       0xff8800,
    transparent: true,
    opacity:     0.9,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color:       CONFIG.COLORS.PLAYER,
    transparent: true,
    opacity:     0.15,
  });

  // ── Group assembly (back → front via z offset) ────────────────────────────
  const group = new THREE.Group();

  // z = -0.05 : glow halo
  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  glowMesh.position.z = -0.05;
  group.add(glowMesh);

  // z = 0 : wings (rendered before fuselage so fuselage draws over the root joint)
  group.add(new THREE.Mesh(leftWingGeom,  mat));
  group.add(new THREE.Mesh(rightWingGeom, mat));

  // z = 0 : fuselage on top of wings
  group.add(new THREE.Mesh(fuselageGeom, mat));

  // z = +0.01 : engine pods
  const leftPod  = new THREE.Mesh(podGeom, mat);
  const rightPod = new THREE.Mesh(podGeom, mat);
  leftPod.position.set( -0.14, -0.44, 0.01);
  rightPod.position.set(  0.14, -0.44, 0.01);
  group.add(leftPod);
  group.add(rightPod);

  // z = +0.02 : cockpit window
  const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
  cockpit.position.set(0, 0.20, 0.02);
  group.add(cockpit);

  // z = +0.02 : engine flames — just below the pods, animated
  const leftFlame  = new THREE.Mesh(flameGeom, flameMat);
  const rightFlame = new THREE.Mesh(flameGeom, flameMat);
  leftFlame.position.set( -0.14, -0.60, 0.02);
  rightFlame.position.set(  0.14, -0.60, 0.02);
  group.add(leftFlame);
  group.add(rightFlame);

  group.position.set(0, -4, 0);
  scene.add(group);

  // ── State ─────────────────────────────────────────────────────────────────
  let posX       = 0;
  let shootTimer = 0;
  let flashTimer = 0;
  let invTimer   = 0;
  let isFlashing = false;
  let time       = 0;

  return {
    mesh: group,

    getPosition() { return group.position; },

    /** @param {number} dt @param {object} input @param {object} bulletPool @param {object} audio */
    update(dt, input, bulletPool, audio) {
      time += dt;

      // ── Movement ────────────────────────────────────────────────────────
      let dx = 0;
      if (input.isLeft())  dx -= SPEED;
      if (input.isRight()) dx += SPEED;
      posX = Math.max(-BOUNDS, Math.min(BOUNDS, posX + dx * dt));
      group.position.x = posX;

      // Subtle tilt toward movement direction
      const tiltTarget = dx !== 0 ? -Math.sign(dx) * 0.12 : 0;
      group.rotation.z += (tiltTarget - group.rotation.z) * 8 * dt;

      // ── Shoot ───────────────────────────────────────────────────────────
      shootTimer -= dt;
      if (input.isFirePressed() && shootTimer <= 0) {
        this._shoot(bulletPool, audio);
        shootTimer = SHOOT_COOLDOWN;
      }

      // ── Invincibility flicker ─────────────────────────────────────────
      if (invTimer > 0) {
        invTimer -= dt;
        group.visible = Math.floor(invTimer * 10) % 2 === 0;
      } else {
        group.visible = true;
      }

      // ── Damage flash ─────────────────────────────────────────────────
      if (isFlashing) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          isFlashing = false;
          mat.color.copy(_cyan);
          cockpitMat.color.set(0xaaffff);
        }
      }

      // ── Engine flame animation ─────────────────────────────────────────
      const flicker  = 0.7 + Math.sin(time * 24) * 0.3;
      flameMat.opacity = flicker * 0.85;
      const scaleY   = 1.0 + Math.sin(time * 18) * 0.35;
      leftFlame.scale.set(flicker, scaleY, 1);
      rightFlame.scale.set(flicker, scaleY, 1);
    },

    _shoot(bulletPool, audio) {
      if (!bulletPool) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(group.position.x, group.position.y + 0.65, 0, 12);
      if (audio) audio.playShoot();
    },

    /** @param {object} audio */
    takeDamage(audio) {
      if (invTimer > 0) return;
      isFlashing  = true;
      flashTimer  = FLASH_DURATION;
      invTimer    = INVINCIBLE_DUR;
      mat.color.copy(_white);
      cockpitMat.color.set(0xffffff);
      gameState.loseLife();
      if (audio)    audio.playHit();
      if (onDamage) onDamage();
    },

    dispose() {
      scene.remove(group);
      fuselageGeom.dispose();
      leftWingGeom.dispose();
      rightWingGeom.dispose();
      podGeom.dispose();
      cockpitGeom.dispose();
      flameGeom.dispose();
      glowGeom.dispose();
      mat.dispose();
      cockpitMat.dispose();
      flameMat.dispose();
      glowMat.dispose();
    },
  };
}
