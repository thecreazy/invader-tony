// PlayerEntity.ts: Player ship geometry, materials, movement, tilt, flame animation, and damage handling

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import type { IPlayer } from '../types/entities.ts';
import type { IBulletPool, IAudioManager, IInputManager, IGameState } from '../types/game.ts';

const SPEED = CONFIG.PLAYER.SPEED;
const SHOOT_COOLDOWN = CONFIG.PLAYER.BULLET_COOLDOWN / 1000;
const AUTO_FIRE_COOLDOWN = CONFIG.PLAYER.AUTO_FIRE_COOLDOWN / 1000;
const BOUNDS = 6.8;
const FLASH_DURATION = 0.3;
const INVINCIBLE_DUR = 1.0;
const DRAG_FOLLOW_RATE = 14;

const _white = new THREE.Color(0xffffff);
const _cyanDark = new THREE.Color(0x00d4e8);

// Outer hull silhouette — same contour as the fuselage/wings union, scaled up
// slightly so it shows as a dark outline behind the coloured panels (mirrors
// the pixel-art outline look of the sprite-based Tony enemies).
const HULL_POINTS: Array<[number, number]> = [
  [0.0, 0.65],
  [0.09, 0.34],
  [0.22, 0.06],
  [0.88, -0.2],
  [0.7, -0.42],
  [0.22, -0.3],
  [-0.22, -0.3],
  [-0.7, -0.42],
  [-0.88, -0.2],
  [-0.22, 0.06],
  [-0.09, 0.34],
];
const OUTLINE_SCALE = 1.16;

export function createPlayerEntity(
  scene: THREE.Scene,
  gameState: IGameState,
  opts: { onDamage?: () => void } = {},
): IPlayer {
  const { onDamage } = opts;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const outlineShape = new THREE.Shape();
  HULL_POINTS.forEach(([x, y], i) => {
    const px = x * OUTLINE_SCALE;
    const py = y * OUTLINE_SCALE;
    if (i === 0) outlineShape.moveTo(px, py);
    else outlineShape.lineTo(px, py);
  });
  outlineShape.closePath();
  const outlineGeom = new THREE.ShapeGeometry(outlineShape);

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

  // Nose spine highlight — thin bright stripe down the fuselage centreline
  // to fake a lit top panel instead of one flat colour.
  const spineShape = new THREE.Shape();
  spineShape.moveTo(0.0, 0.63);
  spineShape.lineTo(0.055, 0.32);
  spineShape.lineTo(0.06, -0.28);
  spineShape.lineTo(-0.06, -0.28);
  spineShape.lineTo(-0.055, 0.32);
  spineShape.closePath();
  const spineGeom = new THREE.ShapeGeometry(spineShape);

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

  // Wingtip accent — marker-light triangle at the outer edge of each wing.
  const leftTipShape = new THREE.Shape();
  leftTipShape.moveTo(-0.88, -0.2);
  leftTipShape.lineTo(-0.7, -0.42);
  leftTipShape.lineTo(-0.52, -0.32);
  leftTipShape.closePath();
  const leftTipGeom = new THREE.ShapeGeometry(leftTipShape);

  const rightTipShape = new THREE.Shape();
  rightTipShape.moveTo(0.88, -0.2);
  rightTipShape.lineTo(0.7, -0.42);
  rightTipShape.lineTo(0.52, -0.32);
  rightTipShape.closePath();
  const rightTipGeom = new THREE.ShapeGeometry(rightTipShape);

  const tipGlowGeom = new THREE.CircleGeometry(0.16, 12);

  // Panel-line greebles — thin dark strips over the wings for a mechanical,
  // less "flat vector" read.
  const panelLineGeom = new THREE.BoxGeometry(0.42, 0.025, 0.01);

  const podGeom = new THREE.BoxGeometry(0.13, 0.22, 0.1);
  const cockpitGeom = new THREE.BoxGeometry(0.11, 0.14, 0.12);
  const flameGeom = new THREE.CircleGeometry(0.09, 8);
  const glowGeom = new THREE.CircleGeometry(0.72, 20);

  // ── Materials ──────────────────────────────────────────────────────────────
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x00232b });
  const mat = new THREE.MeshBasicMaterial({ color: _cyanDark });
  const spineMat = new THREE.MeshBasicMaterial({ color: 0xbfffff });
  const tipMat = new THREE.MeshBasicMaterial({
    color: CONFIG.COLORS.NEON_MAGENTA,
    transparent: true,
    opacity: 1,
  });
  const tipGlowMat = new THREE.MeshBasicMaterial({
    color: CONFIG.COLORS.NEON_MAGENTA,
    transparent: true,
    opacity: 0.35,
  });
  const panelMat = new THREE.MeshBasicMaterial({ color: 0x004450 });
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
  glowMesh.position.z = -0.06;
  group.add(glowMesh);

  const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
  outlineMesh.position.z = -0.02;
  group.add(outlineMesh);

  group.add(new THREE.Mesh(leftWingGeom, mat));
  group.add(new THREE.Mesh(rightWingGeom, mat));
  group.add(new THREE.Mesh(fuselageGeom, mat));

  const spine = new THREE.Mesh(spineGeom, spineMat);
  spine.position.z = 0.005;
  group.add(spine);

  const leftPanel = new THREE.Mesh(panelLineGeom, panelMat);
  const rightPanel = new THREE.Mesh(panelLineGeom, panelMat);
  leftPanel.position.set(-0.52, -0.3, 0.008);
  leftPanel.rotation.z = 0.42;
  rightPanel.position.set(0.52, -0.3, 0.008);
  rightPanel.rotation.z = -0.42;
  group.add(leftPanel);
  group.add(rightPanel);

  const leftTipGlow = new THREE.Mesh(tipGlowGeom, tipGlowMat);
  const rightTipGlow = new THREE.Mesh(tipGlowGeom, tipGlowMat);
  leftTipGlow.position.set(-0.78, -0.31, 0.005);
  rightTipGlow.position.set(0.78, -0.31, 0.005);
  group.add(leftTipGlow);
  group.add(rightTipGlow);

  const leftTip = new THREE.Mesh(leftTipGeom, tipMat);
  const rightTip = new THREE.Mesh(rightTipGeom, tipMat);
  leftTip.position.z = 0.01;
  rightTip.position.z = 0.01;
  group.add(leftTip);
  group.add(rightTip);

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

  group.position.set(0, -6, 0);
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

      const dragX = input.getDragX();
      let moveDelta = 0;
      if (dragX !== null) {
        const targetX = dragX * BOUNDS;
        const nextX = posX + (targetX - posX) * Math.min(1, DRAG_FOLLOW_RATE * dt);
        moveDelta = nextX - posX;
        posX = Math.max(-BOUNDS, Math.min(BOUNDS, nextX));
      } else {
        let dx = 0;
        if (input.isLeft()) dx -= SPEED;
        if (input.isRight()) dx += SPEED;
        moveDelta = dx * dt;
        posX = Math.max(-BOUNDS, Math.min(BOUNDS, posX + moveDelta));
      }
      group.position.x = posX;

      const tiltTarget = moveDelta !== 0 ? -Math.sign(moveDelta) * 0.12 : 0;
      group.rotation.z += (tiltTarget - group.rotation.z) * 8 * dt;

      shootTimer -= dt;
      if (input.isFirePressed() && shootTimer <= 0) {
        const b = bulletPool.acquire();
        if (b) {
          b.activate(group.position.x, group.position.y + 0.65, 0, 12);
          if (audio) audio.playShoot();
        }
        shootTimer = input.isTouchDevice() ? AUTO_FIRE_COOLDOWN : SHOOT_COOLDOWN;
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
          mat.color.copy(_cyanDark);
          cockpitMat.color.set(0xaaffff);
        }
      }

      const flicker = 0.7 + Math.sin(time * 24) * 0.3;
      flameMat.opacity = flicker * 0.85;
      const scaleY = 1.0 + Math.sin(time * 18) * 0.35;
      leftFlame.scale.set(flicker, scaleY, 1);
      rightFlame.scale.set(flicker, scaleY, 1);

      const tipPulse = 0.5 + Math.sin(time * 4) * 0.5;
      tipMat.opacity = 0.55 + tipPulse * 0.45;
      tipGlowMat.opacity = 0.15 + tipPulse * 0.3;
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
      outlineGeom.dispose();
      fuselageGeom.dispose();
      spineGeom.dispose();
      leftWingGeom.dispose();
      rightWingGeom.dispose();
      leftTipGeom.dispose();
      rightTipGeom.dispose();
      tipGlowGeom.dispose();
      panelLineGeom.dispose();
      podGeom.dispose();
      cockpitGeom.dispose();
      flameGeom.dispose();
      glowGeom.dispose();
      outlineMat.dispose();
      mat.dispose();
      spineMat.dispose();
      tipMat.dispose();
      tipGlowMat.dispose();
      panelMat.dispose();
      cockpitMat.dispose();
      flameMat.dispose();
      glowMat.dispose();
    },
  };
}
