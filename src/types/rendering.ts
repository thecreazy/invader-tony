// rendering.ts: Interfaces for the rendering pipeline and post-processing subsystems

import type * as THREE from 'three';

export interface IShockwaveSlot {
  mat: THREE.ShaderMaterial;
  active: boolean;
  progress: number;
}

export interface IShockwavePool {
  trigger(worldX: number, worldY: number, camera: THREE.Camera): void;
  update(
    delta: number,
    renderer: THREE.WebGLRenderer,
    src: THREE.WebGLRenderTarget,
    dst: THREE.WebGLRenderTarget,
    screenCamera: THREE.Camera,
  ): THREE.WebGLRenderTarget;
  dispose(): void;
}

export interface IEffectManager {
  setDamageFlash(): void;
  setWarpIntensity(v: number): void;
  setTonyMode(active: boolean): void;
  updateUniforms(delta: number, bossHpRatio: number | null): void;
}
