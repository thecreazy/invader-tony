// EffectManager.ts: Per-frame scanlines uniform fades — damage flash, warp intensity, chromatic aberration

import * as THREE from 'three';
import { CONFIG } from '../config.ts';

export interface IEffectManager {
  setDamageFlash(): void;
  setWarpIntensity(v: number): void;
  setTonyMode(active: boolean): void;
  updateUniforms(delta: number, bossHpRatio: number | null): void;
}

export function createEffectManager(scanlinesMaterial: THREE.ShaderMaterial): IEffectManager {
  let warpTimer = 0;

  return {
    setDamageFlash() {
      scanlinesMaterial.uniforms['uDamageFlash'].value = 1.0;
    },

    setWarpIntensity(v) {
      warpTimer = v;
      scanlinesMaterial.uniforms['uWarpIntensity'].value = v;
    },

    setTonyMode(active) {
      scanlinesMaterial.uniforms['uTonyMode'].value = active ? 1 : 0;
    },

    updateUniforms(delta, bossHpRatio) {
      const u = scanlinesMaterial.uniforms;

      if (u['uDamageFlash'].value > 0)
        u['uDamageFlash'].value = Math.max(0, u['uDamageFlash'].value - delta * 3.3);

      if (warpTimer > 0) {
        warpTimer = Math.max(0, warpTimer - delta * 1.25);
        u['uWarpIntensity'].value = warpTimer;
      }

      u['uChromaticAberration'].value =
        bossHpRatio !== null ? (1.0 - bossHpRatio) * 0.008 + 0.001 : 0.001;
    },
  };
}
