/**
 * CageInvader entity — a single Nicolas Cage alien in the enemy grid.
 *
 * Visual: SphereGeometry skull (dark brown) + BoxGeometry face screen with
 * shared CanvasTexture — one Canvas 2D draw call, reused across all invaders.
 * Small ear nubs on left/right add silhouette depth.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';
import { generateCageTexture } from '../CageTexture.js';

// ── Shared singleton texture ───────────────────────────────────────────────────

let _sharedTexture = null;
function getSharedTexture() {
  if (!_sharedTexture) _sharedTexture = generateCageTexture(128);
  return _sharedTexture;
}

// ── Shared geometries & materials (one set for all invaders) ──────────────────

let _skullGeom = null;  // SphereGeometry — head mass behind the face
let _faceGeom  = null;  // BoxGeometry    — face "screen"
let _earGeom   = null;  // BoxGeometry    — ear nubs
let _skullMat  = null;  // MeshBasicMaterial dark brown
let _earMat    = null;  // MeshBasicMaterial ear colour
let _refCount  = 0;

function acquireResources() {
  if (_refCount === 0) {
    _skullGeom = new THREE.SphereGeometry(0.42, 10, 10);
    _faceGeom  = new THREE.BoxGeometry(0.72, 0.72, 0.18);
    _earGeom   = new THREE.BoxGeometry(0.06, 0.12, 0.06);
    _skullMat  = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    _earMat    = new THREE.MeshBasicMaterial({ color: 0x7a3a10 });
  }
  _refCount++;
}

export function disposeInvaderResources() {
  _refCount = 0;
  _skullGeom?.dispose(); _skullGeom = null;
  _faceGeom?.dispose();  _faceGeom  = null;
  _earGeom?.dispose();   _earGeom   = null;
  _skullMat?.dispose();  _skullMat  = null;
  _earMat?.dispose();    _earMat    = null;
  // Dispose shared texture last so it outlives all materials
  _sharedTexture?.dispose(); _sharedTexture = null;
}

/**
 * No-op — retained for Game.js import compatibility.
 * Shader time is no longer used (Canvas texture approach).
 */
export function updateInvaderShaderTime(_delta) {}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * @param {THREE.Scene} scene
 * @param {{ col: number, row: number, hSpacing?: number, vSpacing?: number, topY?: number }} opts
 */
export function createCageInvader(scene, { col, row, hSpacing = 1.3, vSpacing = 1.1, topY = 4.5 }) {
  acquireResources();

  const numCols = CONFIG.GRID.COLS;
  const baseX = (col - (numCols - 1) / 2) * hSpacing;
  const baseY = topY - row * vSpacing;

  let time = Math.random() * Math.PI * 2;

  const group = new THREE.Group();

  // ── Skull (sphere behind the face plane) ──────────────────────────────────
  const skull = new THREE.Mesh(_skullGeom, _skullMat);
  skull.scale.set(1, 0.88, 0.65);
  group.add(skull);

  // ── Face screen — per-invader material shares the singleton texture ────────
  const faceMat  = new THREE.MeshBasicMaterial({ map: getSharedTexture() });
  const faceMesh = new THREE.Mesh(_faceGeom, faceMat);
  faceMesh.position.z = 0.20;
  group.add(faceMesh);

  // ── Ear nubs ──────────────────────────────────────────────────────────────
  const leftEar  = new THREE.Mesh(_earGeom, _earMat);
  leftEar.position.set(-0.44, 0.0, 0.0);
  group.add(leftEar);

  const rightEar = new THREE.Mesh(_earGeom, _earMat);
  rightEar.position.set(0.44, 0.0, 0.0);
  group.add(rightEar);

  group.scale.set(1.3, 1.3, 1.3);
  group.position.set(baseX, baseY, 0);
  scene.add(group);

  let _alive        = true;
  let _flashTimeout = null;

  return {
    mesh: group,
    col,
    row,
    baseX,
    baseY,

    get alive() { return _alive; },

    /** @param {number} dt @param {number} offsetX @param {number} offsetY */
    update(dt, offsetX, offsetY) {
      if (!_alive) return;
      time += dt;
      const bob = Math.sin(time * 2.0 + col * 0.5) * 0.04;
      group.position.set(baseX + offsetX, baseY + offsetY + bob, 0);
      group.rotation.z = Math.sin(time * 2.5 + col * 0.7) * 0.04;
    },

    /** @returns {number} score value */
    takeDamage() {
      _alive = false;
      // White flash then hide
      const normalMat = faceMesh.material;
      faceMesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      _flashTimeout = setTimeout(() => {
        group.visible = false;
        normalMat.dispose();
        _flashTimeout = null;
      }, 120);
      return 10 * (5 - row); // row 0 = 50pts, row 4 = 10pts
    },

    /** @param {object} bulletPool */
    shoot(bulletPool) {
      if (!bulletPool || !_alive) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(group.position.x, group.position.y - 0.5, 0, -6);
    },

    dispose() {
      if (_flashTimeout) { clearTimeout(_flashTimeout); _flashTimeout = null; }
      scene.remove(group);
      faceMat.dispose();
      _refCount--;
    },
  };
}
