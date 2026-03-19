/**
 * TonyInvader entity — a single InvaderTony alien in the enemy grid.
 *
 * Visual: PlaneGeometry sprite with PNG CanvasTexture loaded via TextureLoader.
 * Two types: 'basic' (suit) and 'elite' (Elvis jumpsuit).
 * Textures loaded once and shared across all instances.
 */

import * as THREE from 'three';
import { CONFIG } from '../../config.js';

// ── Shared textures (loaded once) ─────────────────────────────────────────────

let textureBasic = null;
let textureElite = null;

function getTexture(type) {
  if (type === 'elite') {
    if (!textureElite) {
      textureElite = new THREE.TextureLoader().load('/assets/tony_enemy2.png');
      textureElite.magFilter = THREE.NearestFilter;
      textureElite.minFilter = THREE.NearestFilter;
    }
    return textureElite;
  } else {
    if (!textureBasic) {
      textureBasic = new THREE.TextureLoader().load('/assets/tony_enemy1.png');
      textureBasic.magFilter = THREE.NearestFilter;
      textureBasic.minFilter = THREE.NearestFilter;
    }
    return textureBasic;
  }
}

export function disposeInvaderResources() {
  if (textureBasic) { textureBasic.dispose(); textureBasic = null; }
  if (textureElite) { textureElite.dispose(); textureElite = null; }
}

/** No-op — kept for Game.js import compatibility (no shader to advance). */
export function updateInvaderShaderTime(_delta) {}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * @param {THREE.Scene} scene
 * @param {{
 *   col: number,
 *   row: number,
 *   type?: 'basic' | 'elite',
 *   hSpacing?: number,
 *   vSpacing?: number,
 *   topY?: number,
 *   cols?: number,
 * }} opts
 */
export function createTonyInvader(scene, {
  col, row,
  type = 'basic',
  hSpacing = 1.1,
  vSpacing = 1.1,
  topY = 4.5,
  cols = CONFIG.GRID.COLS,
}) {
  const geom = new THREE.PlaneGeometry(0.9, 0.9);
  const mat  = new THREE.MeshBasicMaterial({
    map:       getTexture(type),
    transparent: true,
    alphaTest:   0.1,
    depthWrite:  false,
  });
  const mesh = new THREE.Mesh(geom, mat);

  const baseX = (col - (cols - 1) / 2) * hSpacing;
  const baseY = topY - row * vSpacing;

  mesh.position.set(baseX, baseY, 0);
  scene.add(mesh);

  let alive = true;
  let time  = Math.random() * Math.PI * 2;

  // Score value: elite worth more; front rows worth less
  const scoreValue = type === 'elite' ? 30 : 10;

  let _flashTimeout = null;

  return {
    get alive() { return alive; },
    baseX,
    baseY,
    type,
    mesh,

    /** @param {number} delta @param {number} offsetX @param {number} offsetY */
    update(delta, offsetX, offsetY) {
      if (!alive) return;
      time += delta;
      mesh.position.x = baseX + offsetX;
      mesh.position.y = baseY + offsetY + Math.sin(time * 2.0 + col * 0.5) * 0.04;
      // Elite: subtle scale pulse
      if (type === 'elite') {
        const s = 1.0 + Math.sin(time * 3.0 + col) * 0.04;
        mesh.scale.set(s, s, 1);
      }
    },

    /** @param {object} bulletPool */
    shoot(bulletPool) {
      if (!alive) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(mesh.position.x, mesh.position.y - 0.45, 0, -6);
    },

    /** @returns {number} score value */
    takeDamage() {
      alive = false;
      // White flash before hiding
      mat.color.set(0xffffff);
      _flashTimeout = setTimeout(() => {
        mesh.visible = false;
        _flashTimeout = null;
      }, 100);
      return scoreValue;
    },

    dispose() {
      if (_flashTimeout) { clearTimeout(_flashTimeout); _flashTimeout = null; }
      scene.remove(mesh);
      geom.dispose();
      mat.dispose();
      // Do NOT dispose shared textures — disposeInvaderResources() handles that
    },
  };
}

