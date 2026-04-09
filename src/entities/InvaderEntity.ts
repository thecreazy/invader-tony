// InvaderEntity.ts: Tony invader sprite entity with shared textures and dissolve death animation

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import type { IInvader, InvaderType } from '../types/entities.ts';
import type { IBulletPool } from '../types/game.ts';
import dissolveVert from '../game/shaders/dissolve/dissolve.vert';
import dissolveFrag from '../game/shaders/dissolve/dissolve.frag';

// ── Shared textures (loaded once) ─────────────────────────────────────────────
let textureBasic: THREE.Texture | null = null;
let textureElite: THREE.Texture | null = null;

function getTexture(type: InvaderType): THREE.Texture {
  if (type === 'elite') {
    if (!textureElite) {
      textureElite = new THREE.TextureLoader().load('/assets/tony_enemy2.png');
      textureElite.magFilter = THREE.LinearFilter;
      textureElite.minFilter = THREE.LinearFilter;
      textureElite.generateMipmaps = false;
    }
    return textureElite;
  }
  if (!textureBasic) {
    textureBasic = new THREE.TextureLoader().load('/assets/tony_enemy1.png');
    textureBasic.magFilter = THREE.LinearFilter;
    textureBasic.minFilter = THREE.LinearFilter;
    textureBasic.generateMipmaps = false;
  }
  return textureBasic;
}

export function disposeInvaderResources(): void {
  if (textureBasic) {
    textureBasic.dispose();
    textureBasic = null;
  }
  if (textureElite) {
    textureElite.dispose();
    textureElite = null;
  }
}

/** No-op — kept for call-site compatibility (no shader time to advance). */
export function updateInvaderShaderTime(_delta: number): void {}

export interface InvaderOpts {
  col: number;
  row: number;
  type?: InvaderType;
  hSpacing?: number;
  vSpacing?: number;
  topY?: number;
  cols?: number;
}

export function createInvaderEntity(scene: THREE.Scene, opts: InvaderOpts): IInvader {
  const {
    col,
    row,
    type = 'basic',
    hSpacing = 1.1,
    vSpacing = 1.1,
    topY = 4.5,
    cols = CONFIG.GRID.COLS,
  } = opts;

  const geom = new THREE.PlaneGeometry(0.9, 0.9);
  const mat = new THREE.MeshBasicMaterial({
    map: getTexture(type),
    transparent: true,
    alphaTest: 0.1,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);

  const baseX = (col - (cols - 1) / 2) * hSpacing;
  const baseY = topY - row * vSpacing;

  mesh.position.set(baseX, baseY, 0);
  scene.add(mesh);

  let alive = true;
  let time = Math.random() * Math.PI * 2;
  let isDissolving = false;
  let dissolveProgress = 0;
  let dissolveMat: THREE.ShaderMaterial | null = null;
  let flashTimeout: ReturnType<typeof setTimeout> | null = null;

  const scoreValue = type === 'elite' ? 30 : 10;

  return {
    get alive() {
      return alive;
    },
    baseX,
    baseY,
    type,
    mesh,

    update(delta, offsetX, offsetY) {
      if (isDissolving) {
        dissolveProgress = Math.min(1.0, dissolveProgress + delta * 2.5);
        if (dissolveMat) {
          dissolveMat.uniforms['uProgress'].value = dissolveProgress;
          dissolveMat.uniforms['uTime'].value += delta;
        }
        if (dissolveProgress >= 1.0) {
          mesh.visible = false;
          isDissolving = false;
          dissolveMat?.dispose();
          dissolveMat = null;
          scene.remove(mesh);
        }
        return;
      }
      if (!alive) return;
      time += delta;
      mesh.position.x = baseX + offsetX;
      mesh.position.y = baseY + offsetY + Math.sin(time * 2.0 + col * 0.5) * 0.04;
      if (type === 'elite') {
        const s = 1.0 + Math.sin(time * 3.0 + col) * 0.04;
        mesh.scale.set(s, s, 1);
      }
    },

    shoot(bulletPool) {
      if (!alive) return;
      const b = bulletPool.acquire();
      if (!b) return;
      b.activate(mesh.position.x, mesh.position.y - 0.45, 0, -6);
    },

    takeDamage() {
      if (!alive) return 0;
      alive = false;
      if (flashTimeout) {
        clearTimeout(flashTimeout);
        flashTimeout = null;
      }

      isDissolving = true;
      dissolveProgress = 0;
      dissolveMat = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: getTexture(type) },
          uProgress: { value: 0.0 },
          uTime: { value: 0.0 },
        },
        vertexShader: dissolveVert,
        fragmentShader: dissolveFrag,
        transparent: true,
        depthWrite: false,
      });
      (mesh as THREE.Mesh).material = dissolveMat;
      return scoreValue;
    },

    dispose() {
      if (flashTimeout) {
        clearTimeout(flashTimeout);
        flashTimeout = null;
      }
      if (dissolveMat) {
        dissolveMat.dispose();
        dissolveMat = null;
        isDissolving = false;
      }
      scene.remove(mesh);
      geom.dispose();
      mat.dispose();
    },
  };
}
