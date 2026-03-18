/**
 * CageInvader entity — a single Nicholas Cage alien in the enemy grid.
 * Procedural face geometry: head, eyes, nose, mouth, hair strands.
 * Position is driven by the grid offset computed in Game.js.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

// ── Shared geometry (allocated once, reused across all invaders) ────────────
// Disposed via disposeInvaderResources() called by Game.destroy().

let _headGeom   = null;
let _eyeGeom    = null;
let _noseGeom   = null;
let _mouthGeom  = null;
let _hairGeom   = null;
let _eyebrowGeom = null;
let _faceMat    = null;
let _eyeMat     = null;
let _refCount   = 0;

function acquireResources() {
  if (_refCount === 0) {
    _headGeom    = new THREE.SphereGeometry(0.35, 8, 8);
    _eyeGeom     = new THREE.SphereGeometry(0.08, 6, 6);
    _noseGeom    = new THREE.BoxGeometry(0.08, 0.10, 0.06);
    _mouthGeom   = new THREE.BoxGeometry(0.25, 0.06, 0.05);
    _hairGeom    = new THREE.BoxGeometry(0.08, 0.16, 0.06);
    _eyebrowGeom = new THREE.BoxGeometry(0.12, 0.04, 0.05);
    _faceMat     = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.ENEMY });
    _eyeMat      = new THREE.MeshBasicMaterial({ color: 0x111111 });
  }
  _refCount++;
}

export function disposeInvaderResources() {
  _refCount = 0;
  _headGeom?.dispose();    _headGeom    = null;
  _eyeGeom?.dispose();     _eyeGeom     = null;
  _noseGeom?.dispose();    _noseGeom    = null;
  _mouthGeom?.dispose();   _mouthGeom   = null;
  _hairGeom?.dispose();    _hairGeom    = null;
  _eyebrowGeom?.dispose(); _eyebrowGeom = null;
  _faceMat?.dispose();     _faceMat     = null;
  _eyeMat?.dispose();      _eyeMat      = null;
}

/**
 * @param {THREE.Scene} scene
 * @param {{ col: number, row: number }} gridPos
 */
export function createCageInvader(scene, { col, row }) {
  acquireResources();

  const baseX = (col - 4.5) * 1.4;
  const baseY = 2.5 - row * 1.2;

  // Random phase offset so invaders don't all bob in unison
  let time = Math.random() * Math.PI * 2;

  const group = new THREE.Group();

  // Head (squashed sphere)
  const head = new THREE.Mesh(_headGeom, _faceMat);
  head.scale.set(1, 0.85, 0.6);
  group.add(head);

  // Left eye socket
  const leftEye = new THREE.Mesh(_eyeGeom, _eyeMat);
  leftEye.position.set(-0.12, 0.06, 0.18);
  group.add(leftEye);

  // Right eye socket
  const rightEye = new THREE.Mesh(_eyeGeom, _eyeMat);
  rightEye.position.set(0.12, 0.06, 0.18);
  group.add(rightEye);

  // Left eyebrow (angry/arched)
  const leftBrow = new THREE.Mesh(_eyebrowGeom, _faceMat);
  leftBrow.position.set(-0.13, 0.17, 0.19);
  leftBrow.rotation.z = 0.3;
  group.add(leftBrow);

  // Right eyebrow (mirrored)
  const rightBrow = new THREE.Mesh(_eyebrowGeom, _faceMat);
  rightBrow.position.set(0.13, 0.17, 0.19);
  rightBrow.rotation.z = -0.3;
  group.add(rightBrow);

  // Nose bump
  const nose = new THREE.Mesh(_noseGeom, _faceMat);
  nose.position.set(0, -0.03, 0.22);
  group.add(nose);

  // Mouth (slight smirk)
  const mouth = new THREE.Mesh(_mouthGeom, _eyeMat);
  mouth.position.set(0.03, -0.15, 0.19);
  mouth.rotation.z = -0.05;
  group.add(mouth);

  // Hair strands (3 staggered boxes on top)
  const hairOffsets = [
    [-0.12, 0, 0.2],
    [  0.0, 0.06, 0.15],
    [ 0.12, 0, 0.2],
  ];
  for (const [hx, hy, hz] of hairOffsets) {
    const hair = new THREE.Mesh(_hairGeom, _faceMat);
    hair.position.set(hx, 0.32 + hy, hz);
    hair.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(hair);
  }

  group.position.set(baseX, baseY, 0);
  scene.add(group);

  let _alive = true;

  return {
    mesh:  group,
    col,
    row,
    baseX,
    baseY,

    get alive() { return _alive; },

    /** @param {number} dt @param {number} offsetX @param {number} offsetY */
    update(dt, offsetX, offsetY) {
      if (!_alive) return;
      time += dt;
      const bob    = Math.sin(time * 2 + col * 0.5) * 0.05;
      const wobble = Math.sin(time * 3 + row)        * 0.03;
      group.position.set(baseX + offsetX, baseY + offsetY + bob, 0);
      group.rotation.z = wobble;
    },

    /** @returns {number} score value */
    takeDamage() {
      _alive        = false;
      group.visible = false;
      return 10 * (4 - row); // row 0 = 40pts, row 3 = 10pts
    },

    /** @param {object} bulletPool enemyBulletPool */
    shoot(bulletPool) {
      if (!bulletPool || !_alive) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(group.position.x, group.position.y - 0.5, 0, -6);
    },

    dispose() {
      scene.remove(group);
      _refCount--;
      // Shared geometry/materials are disposed by disposeInvaderResources()
    },
  };
}
