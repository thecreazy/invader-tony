/**
 * CageInvader entity — a single Nicholas Cage alien in the enemy grid.
 *
 * Head is a "billboard face on sphere skull" composite:
 *   - SphereGeometry skull: base shape, MeshBasicMaterial (skin colour)
 *   - PlaneGeometry face: distort ShaderMaterial, positioned slightly in front
 *     → PlaneGeometry has perfect [0,1] UV so the face shader renders correctly
 * All other detail geometry (3D eyes, brows, etc.) sits in front of the face plane.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

import distortVert from '../shaders/distort/distort.vert';
import distortFrag from '../shaders/distort/distort.frag';

// ── Shared resources (allocated once, reused across all invaders) ─────────────

let _skullGeom   = null;  // SphereGeometry behind face
let _faceGeom    = null;  // PlaneGeometry carrying the shader face
let _eyeGeom     = null;
let _noseGeom    = null;
let _mouthGeom   = null;
let _hairGeom    = null;
let _eyebrowGeom = null;
let _skullMat    = null;  // MeshBasicMaterial for the skull sphere
let _eyeMat      = null;
let _darkMat     = null;

// Shared ShaderMaterial for the face plane (all invaders share same uniforms)
let _headShaderMat = null;
let _headUniforms  = null;

let _refCount = 0;

function acquireResources() {
  if (_refCount === 0) {
    _skullGeom   = new THREE.SphereGeometry(0.33, 10, 10);
    _faceGeom    = new THREE.PlaneGeometry(0.65, 0.65);
    _eyeGeom     = new THREE.SphereGeometry(0.07, 6, 6);
    _noseGeom    = new THREE.BoxGeometry(0.07, 0.09, 0.06);
    _mouthGeom   = new THREE.BoxGeometry(0.22, 0.055, 0.05);
    _hairGeom    = new THREE.BoxGeometry(0.08, 0.16, 0.06);
    _eyebrowGeom = new THREE.BoxGeometry(0.10, 0.035, 0.05);

    _skullMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(CONFIG.COLORS.ENEMY),
    });
    _eyeMat  = new THREE.MeshBasicMaterial({ color: 0x0a0502 });
    _darkMat = new THREE.MeshBasicMaterial({ color: 0x040202 });

    _headUniforms = {
      uTime:            { value: 0.0 },
      uDistortAmount:   { value: 0.03 },
      uColor:           { value: new THREE.Color(0xffaa00) },
      uGlitchIntensity: { value: 0.0 },
      uPhase:           { value: 0.0 },
    };
    _headShaderMat = new THREE.ShaderMaterial({
      uniforms:       _headUniforms,
      vertexShader:   distortVert,
      fragmentShader: distortFrag,
      side:           THREE.DoubleSide,
      transparent:    false,
      depthWrite:     true,
    });
  }
  _refCount++;
}

/** Advance the shared invader face shader time. Called from Game.js each frame. */
export function updateInvaderShaderTime(delta) {
  if (_headUniforms) _headUniforms.uTime.value += delta;
}

export function disposeInvaderResources() {
  _refCount = 0;
  _skullGeom?.dispose();     _skullGeom   = null;
  _faceGeom?.dispose();      _faceGeom    = null;
  _eyeGeom?.dispose();       _eyeGeom     = null;
  _noseGeom?.dispose();      _noseGeom    = null;
  _mouthGeom?.dispose();     _mouthGeom   = null;
  _hairGeom?.dispose();      _hairGeom    = null;
  _eyebrowGeom?.dispose();   _eyebrowGeom = null;
  _skullMat?.dispose();      _skullMat    = null;
  _eyeMat?.dispose();        _eyeMat      = null;
  _darkMat?.dispose();       _darkMat     = null;
  _headShaderMat?.dispose(); _headShaderMat = null;
  _headUniforms = null;
}

/**
 * @param {THREE.Scene} scene
 * @param {{ col: number, row: number, hSpacing?: number, vSpacing?: number, topY?: number }} opts
 */
export function createCageInvader(scene, { col, row, hSpacing = 1.3, vSpacing = 1.4, topY = 3.5 }) {
  acquireResources();

  const numCols = CONFIG.GRID.COLS;
  const baseX = (col - (numCols - 1) / 2) * hSpacing;
  const baseY = topY - row * vSpacing;

  let time = Math.random() * Math.PI * 2;

  const group = new THREE.Group();

  // ── Skull sphere (behind face, provides 3D head shape) ────────────────────
  const skull = new THREE.Mesh(_skullGeom, _skullMat);
  skull.scale.set(1, 0.85, 0.60);
  group.add(skull);

  // ── Face plane — carries the procedural Cage face shader ──────────────────
  // PlaneGeometry has perfect [0,1] UVs so the face shader maps correctly.
  const face = new THREE.Mesh(_faceGeom, _headShaderMat);
  face.position.z = 0.14;
  group.add(face);

  // ── Geometric 3D detail overlays (in front of face plane) ─────────────────

  // Eyes (dark spheres at z > face plane)
  const leftEye = new THREE.Mesh(_eyeGeom, _eyeMat);
  leftEye.position.set(-0.11, 0.055, 0.17);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(_eyeGeom, _eyeMat);
  rightEye.position.set(0.11, 0.055, 0.17);
  group.add(rightEye);

  // Eyebrows (angled inward — menacing)
  const leftBrow = new THREE.Mesh(_eyebrowGeom, _darkMat);
  leftBrow.position.set(-0.12, 0.165, 0.185);
  leftBrow.rotation.z = 0.28;
  group.add(leftBrow);

  const rightBrow = new THREE.Mesh(_eyebrowGeom, _darkMat);
  rightBrow.position.set(0.12, 0.165, 0.185);
  rightBrow.rotation.z = -0.28;
  group.add(rightBrow);

  // Nose
  const nose = new THREE.Mesh(_noseGeom, new THREE.MeshBasicMaterial({
    color: new THREE.Color(CONFIG.COLORS.ENEMY).multiplyScalar(0.72),
  }));
  nose.position.set(0, -0.03, 0.205);
  group.add(nose);

  // Mouth
  const mouth = new THREE.Mesh(_mouthGeom, _eyeMat);
  mouth.position.set(0.02, -0.145, 0.185);
  group.add(mouth);

  // Hair strands
  const hairOffsets = [[-0.11, 0, 0.185], [0, 0.055, 0.14], [0.11, 0, 0.185]];
  for (const [hx, hy, hz] of hairOffsets) {
    const h = new THREE.Mesh(_hairGeom, new THREE.MeshBasicMaterial({ color: 0x100804 }));
    h.position.set(hx, 0.30 + hy, hz);
    h.rotation.z = (Math.random() - 0.5) * 0.28;
    group.add(h);
  }

  // Scale the entire invader up for better face visibility
  group.scale.set(1.3, 1.3, 1.3);

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
      const bob    = Math.sin(time * 2.0 + col * 0.5) * 0.05;
      const wobble = Math.sin(time * 3.0 + row)        * 0.03;
      group.position.set(baseX + offsetX, baseY + offsetY + bob, 0);
      group.rotation.z = wobble;
    },

    /** @returns {number} score value */
    takeDamage() {
      _alive        = false;
      group.visible = false;
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
      scene.remove(group);
      _refCount--;
      // Shared geometry/materials freed by disposeInvaderResources()
    },
  };
}
