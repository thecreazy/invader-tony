// ShockwavePool.ts: Fixed-size pool of shockwave shader passes applied during ping-pong rendering

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import shockwaveVert from '../game/shaders/shockwave/shockwave.vert';
import shockwaveFrag from '../game/shaders/shockwave/shockwave.frag';

const _pA = new THREE.Vector3();

export interface ShockwaveSlot {
  mat: THREE.ShaderMaterial;
  active: boolean;
  progress: number;
}

export interface IShockwavePool {
  triggerAt(worldX: number, worldY: number, camera: THREE.Camera): void;
  applyPasses(
    delta: number,
    renderer: THREE.WebGLRenderer,
    screenCamera: THREE.Camera,
    rtA: THREE.WebGLRenderTarget,
    rtB: THREE.WebGLRenderTarget,
    swScene: THREE.Scene,
    swQuad: THREE.Mesh,
  ): { src: THREE.WebGLRenderTarget; dst: THREE.WebGLRenderTarget };
  dispose(): void;
}

export function createShockwavePool(): IShockwavePool {
  const slots: ShockwaveSlot[] = [];
  for (let i = 0; i < CONFIG.GAMEPLAY.SHOCKWAVE_POOL_SIZE; i++) {
    slots.push({
      mat: new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uProgress: { value: 0 },
          uStrength: { value: 0.35 },
        },
        vertexShader: shockwaveVert,
        fragmentShader: shockwaveFrag,
        depthTest: false,
      }),
      active: false,
      progress: 0,
    });
  }

  return {
    triggerAt(worldX, worldY, camera) {
      const slot = slots.find((s) => !s.active);
      if (!slot) return;
      _pA.set(worldX, worldY, 0).project(camera);
      slot.active = true;
      slot.progress = 0;
      slot.mat.uniforms['uCenter'].value.set((_pA.x + 1) * 0.5, (_pA.y + 1) * 0.5);
      slot.mat.uniforms['uProgress'].value = 0;
      slot.mat.uniforms['uStrength'].value = 0.35;
    },

    applyPasses(delta, renderer, screenCamera, rtA, rtB, swScene, swQuad) {
      let src = rtA;
      let dst = rtB;
      for (const slot of slots) {
        if (!slot.active) continue;
        slot.progress += delta * 0.9;
        if (slot.progress >= 1) {
          slot.active = false;
          continue;
        }
        slot.mat.uniforms['uTexture'].value = src.texture;
        slot.mat.uniforms['uProgress'].value = slot.progress;
        swQuad.material = slot.mat;
        renderer.setRenderTarget(dst);
        renderer.clear();
        renderer.render(swScene, screenCamera);
        const tmp = src;
        src = dst;
        dst = tmp;
      }
      return { src, dst };
    },

    dispose() {
      for (const slot of slots) slot.mat.dispose();
    },
  };
}
