// PlayerEntity.ts: Player ship geometry, materials, movement, tilt, flame animation, and damage handling

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import type { IPlayer } from '../types/entities.ts';
import type { IBulletPool, IAudioManager, IInputManager, IGameState } from '../types/game.ts';

const SPEED = CONFIG.PLAYER.SPEED;
const SHOOT_COOLDOWN = CONFIG.PLAYER.BULLET_COOLDOWN / 1000;
const BOUNDS = 6.8;
const FLASH_DURATION = 0.3;
const INVINCIBLE_DUR = 1.0;

const _cyan = new THREE.Color(CONFIG.COLORS.PLAYER);
const _white = new THREE.Color(0xffffff);

export function createPlayerEntity(
  scene: THREE.Scene,
  gameState: IGameState,
  opts: { onDamage?: () => void } = {},
): IPlayer {
  const { onDamage } = opts;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const fuselageShape = new THREE.Shape();
  fuselageShape.moveTo(0.0, 0.65);
  fuselageShape.lineTo(0.09, 0.34);
  fuselageShape.lineTo(0.22, 0.06);
  fuselageShape.lineTo(0.22, -0.3);
  fuselageShape.lineTo(-0.22, -0.3);
  fuselageShape.lineTo(-0.22, 0.06);
  fuselageShape.lineTo(-0.09, 0.34);
  fuselageShape.closePath();
  const fuselageGeom = new THREE.ShapeGeometry(fuselageShape);

  const leftWingShape = new THREE.Shape();
  leftWingShape.moveTo(-0.22, 0.06);
  leftWingShape.lineTo(-0.88, -0.2);
  leftWingShape.lineTo(-0.7, -0.42);
  leftWingShape.lineTo(-0.22, -0.3);
  leftWingShape.closePath();
  const leftWingGeom = new THREE.ShapeGeometry(leftWingShape);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0.22, 0.06);
  rightWingShape.lineTo(0.88, -0.2);
  rightWingShape.lineTo(0.7, -0.42);
  rightWingShape.lineTo(0.22, -0.3);
  rightWingShape.closePath();
  const rightWingGeom = new THREE.ShapeGeometry(rightWingShape);

  const podGeom = new THREE.BoxGeometry(0.13, 0.22, 0.1);
  const cockpitGeom = new THREE.BoxGeometry(0.11, 0.14, 0.12);
  const flameGeom = new THREE.CircleGeometry(0.09, 8);
  const glowGeom = new THREE.CircleGeometry(0.72, 20);

  // ── Materials ──────────────────────────────────────────────────────────────
  const mat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.PLAYER });
  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0xaaffff });
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.9,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: CONFIG.COLORS.PLAYER,
    transparent: true,
    opacity: 0.15,
  });

  // ── Group assembly ─────────────────────────────────────────────────────────
  const group = new THREE.Group();

  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  glowMesh.position.z = -0.05;
  group.add(glowMesh);

  group.add(new THREE.Mesh(leftWingGeom, mat));
  group.add(new THREE.Mesh(rightWingGeom, mat));
  group.add(new THREE.Mesh(fuselageGeom, mat));

  const leftPod = new THREE.Mesh(podGeom, mat);
  const rightPod = new THREE.Mesh(podGeom, mat);
  leftPod.position.set(-0.14, -0.44, 0.01);
  rightPod.position.set(0.14, -0.44, 0.01);
  group.add(leftPod);
  group.add(rightPod);

  const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
  cockpit.position.set(0, 0.2, 0.02);
  group.add(cockpit);

  const leftFlame = new THREE.Mesh(flameGeom, flameMat);
  const rightFlame = new THREE.Mesh(flameGeom, flameMat);
  leftFlame.position.set(-0.14, -0.6, 0.02);
  rightFlame.position.set(0.14, -0.6, 0.02);
  group.add(leftFlame);
  group.add(rightFlame);

  group.position.set(0, -4, 0);
  scene.add(group);

  // ── State ──────────────────────────────────────────────────────────────────
  let posX = 0;
  let shootTimer = 0;
  let flashTimer = 0;
  let invTimer = 0;
  let isFlashing = false;
  let time = 0;

  return {
    mesh: group,

    getPosition() {
      return group.position;
    },

    update(dt, input, bulletPool, audio) {
      time += dt;

      let dx = 0;
      if (input.isLeft()) dx -= SPEED;
      if (input.isRight()) dx += SPEED;
      posX = Math.max(-BOUNDS, Math.min(BOUNDS, posX + dx * dt));
      group.position.x = posX;

      const tiltTarget = dx !== 0 ? -Math.sign(dx) * 0.12 : 0;
      group.rotation.z += (tiltTarget - group.rotation.z) * 8 * dt;

      shootTimer -= dt;
      if (input.isFirePressed() && shootTimer <= 0) {
        const b = bulletPool.acquire();
        if (b) {
          b.activate(group.position.x, group.position.y + 0.65, 0, 12);
          if (audio) audio.playShoot();
        }
        shootTimer = SHOOT_COOLDOWN;
      }

      if (invTimer > 0) {
        invTimer -= dt;
        group.visible = Math.floor(invTimer * 10) % 2 === 0;
      } else {
        group.visible = true;
      }

      if (isFlashing) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          isFlashing = false;
          mat.color.copy(_cyan);
          cockpitMat.color.set(0xaaffff);
        }
      }

      const flicker = 0.7 + Math.sin(time * 24) * 0.3;
      flameMat.opacity = flicker * 0.85;
      const scaleY = 1.0 + Math.sin(time * 18) * 0.35;
      leftFlame.scale.set(flicker, scaleY, 1);
      rightFlame.scale.set(flicker, scaleY, 1);
    },

    takeDamage(audio) {
      if (invTimer > 0) return;
      isFlashing = true;
      flashTimer = FLASH_DURATION;
      invTimer = INVINCIBLE_DUR;
      mat.color.copy(_white);
      cockpitMat.color.set(0xffffff);
      gameState.loseLife();
      if (audio) audio.playHit();
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
