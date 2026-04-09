/**
 * Post-processor — ping-pong render targets, shockwave pool, scanline pass.
 */
import * as THREE from 'three';
import { CONFIG } from '../../config.js';
import scanlinesVert  from '../shaders/scanlines/scanlines.vert';
import scanlinesFrag  from '../shaders/scanlines/scanlines.frag';
import shockwaveVert  from '../shaders/shockwave/shockwave.vert';
import shockwaveFrag  from '../shaders/shockwave/shockwave.frag';
import starfieldVert  from '../shaders/starfield/starfield.vert';
import starfieldFrag  from '../shaders/starfield/starfield.frag';

// Pre-allocated vector for shockwave world-to-screen projection
const _pA = new THREE.Vector3();

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {{ getBoss?: () => object | null }} opts
 */
export function createPostProcessor(renderer, scene, camera, opts = {}) {
  const { getBoss } = opts;

  const w   = window.innerWidth;
  const h   = window.innerHeight;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Render targets must match the physical pixel size (w*DPR × h*DPR) so the
  // final scanlines pass samples 1:1 into the canvas and avoids blur from upscaling.
  function makeRenderTarget(tw, th) {
    return new THREE.WebGLRenderTarget(tw, th, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
    });
  }

  // ── Render targets ─────────────────────────────────────────────────────────
  let rtPingA = makeRenderTarget(w * DPR, h * DPR);
  let rtPingB = makeRenderTarget(w * DPR, h * DPR);

  // ── Screen quad setup ──────────────────────────────────────────────────────
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const screenScene  = new THREE.Scene();
  const quadGeom     = new THREE.PlaneGeometry(2, 2);

  const scanlinesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture:             { value: null },
      uTime:                { value: 0 },
      uIntensity:           { value: 0.8 },
      uTonyMode:            { value: 0 },
      uResolution:          { value: new THREE.Vector2(w, h) },
      uChromaticAberration: { value: 0.001 },
      uDamageFlash:         { value: 0.0 },
      uWarpIntensity:       { value: 0.0 },
    },
    vertexShader:   scanlinesVert,
    fragmentShader: scanlinesFrag,
    depthTest: false,
  });

  const screenQuad = new THREE.Mesh(quadGeom, scanlinesMaterial);
  screenScene.add(screenQuad);

  // Dedicated scene for shockwave passes — never contains scanlinesMaterial,
  // so setting its render target to rtPingA/B while scanlinesMaterial still
  // references one of those textures can never form a feedback loop.
  const swScene = new THREE.Scene();
  const swQuad  = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  swQuad.frustumCulled = false;
  swScene.add(swQuad);

  // ── Shockwave pool ─────────────────────────────────────────────────────────
  const shockwavePool = [];
  const SHOCKWAVE_POOL_SIZE = CONFIG.GAMEPLAY.SHOCKWAVE_POOL_SIZE;
  for (let i = 0; i < SHOCKWAVE_POOL_SIZE; i++) {
    shockwavePool.push({
      mat: new THREE.ShaderMaterial({
        uniforms: {
          uTexture:  { value: null },
          uCenter:   { value: new THREE.Vector2(0.5, 0.5) },
          uProgress: { value: 0 },
          uStrength: { value: 0.35 },
        },
        vertexShader:   shockwaveVert,
        fragmentShader: shockwaveFrag,
        depthTest: false,
      }),
      active:   false,
      progress: 0,
    });
  }

  // ── Starfield background ───────────────────────────────────────────────────
  const starfieldMaterial = new THREE.ShaderMaterial({
    uniforms:       { uTime: { value: 0 } },
    vertexShader:   starfieldVert,
    fragmentShader: starfieldFrag,
    depthWrite:     false,
  });
  const starfieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), starfieldMaterial);
  starfieldMesh.position.z = -5;
  starfieldMesh.renderOrder = -1;
  scene.add(starfieldMesh);

  // ── State ──────────────────────────────────────────────────────────────────
  let warpTimer = 0;

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    renderFrame(delta) {
      if (starfieldMaterial) starfieldMaterial.uniforms.uTime.value += delta;

      // Pass 1: render game scene to rtPingA
      renderer.setRenderTarget(rtPingA);
      renderer.clear();
      renderer.render(scene, camera);

      // Pass 2: shockwave ping-pong passes.
      // Uses swScene (contains only swQuad) — never mixed with scanlinesMaterial,
      // which prevents the WebGL feedback loop that occurred when screenScene
      // (containing screenQuad with scanlinesMaterial pointing to rtPingA/B texture)
      // was used as both the render source and framebuffer target during ping-pong swaps.
      let src = rtPingA;
      let dst = rtPingB;

      for (const slot of shockwavePool) {
        if (!slot.active) continue;
        slot.progress += delta * 0.9;
        if (slot.progress >= 1) { slot.active = false; continue; }

        slot.mat.uniforms.uTexture.value  = src.texture;
        slot.mat.uniforms.uProgress.value = slot.progress;
        swQuad.material = slot.mat;

        renderer.setRenderTarget(dst);
        renderer.clear();
        renderer.render(swScene, screenCamera);

        const tmp = src; src = dst; dst = tmp;
      }

      // Pass 3: scanlines → screen
      scanlinesMaterial.uniforms.uTexture.value = src.texture;
      scanlinesMaterial.uniforms.uTime.value   += delta;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(screenScene, screenCamera);
    },

    triggerShockwave(worldX, worldY) {
      const slot = shockwavePool.find(s => !s.active);
      if (!slot) return;
      _pA.set(worldX, worldY, 0);
      _pA.project(camera);
      slot.active   = true;
      slot.progress = 0;
      slot.mat.uniforms.uCenter.value.set((_pA.x + 1) * 0.5, (_pA.y + 1) * 0.5);
      slot.mat.uniforms.uProgress.value = 0;
      slot.mat.uniforms.uStrength.value = 0.35;
    },

    onResize() {
      const rw  = window.innerWidth;
      const rh  = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rtPingA.dispose();
      rtPingB.dispose();
      rtPingA = makeRenderTarget(rw * dpr, rh * dpr);
      rtPingB = makeRenderTarget(rw * dpr, rh * dpr);
      if (scanlinesMaterial) {
        scanlinesMaterial.uniforms.uResolution.value.set(rw, rh);
      }
    },

    /** Sets uTonyMode uniform only — does not touch hud or audioManager */
    setTonyMode(active) {
      if (scanlinesMaterial) scanlinesMaterial.uniforms.uTonyMode.value = active ? 1 : 0;
    },

    /** Sets uDamageFlash = 1.0 */
    setDamageFlash() {
      if (scanlinesMaterial) scanlinesMaterial.uniforms.uDamageFlash.value = 1.0;
    },

    /** Sets uWarpIntensity uniform and resets warpTimer */
    setWarpIntensity(v) {
      warpTimer = v;
      if (scanlinesMaterial) scanlinesMaterial.uniforms.uWarpIntensity.value = v;
    },

    /** Fades uniforms each frame — call once per frame regardless of game state */
    updateEffects(delta) {
      if (!scanlinesMaterial) return;
      const u = scanlinesMaterial.uniforms;

      // Fade damage flash
      if (u.uDamageFlash.value > 0)
        u.uDamageFlash.value = Math.max(0, u.uDamageFlash.value - delta * 3.3);

      // Fade warp
      if (warpTimer > 0) {
        warpTimer = Math.max(0, warpTimer - delta * 1.25);
        u.uWarpIntensity.value = warpTimer;
      }

      // Boss chromatic aberration — ramps up as HP decreases
      const boss = getBoss ? getBoss() : null;
      if (boss && boss.alive) {
        u.uChromaticAberration.value = (1.0 - boss.hp / CONFIG.BOSS.HP) * 0.008 + 0.001;
      } else {
        u.uChromaticAberration.value = 0.001;
      }
    },

    dispose() {
      rtPingA?.dispose();
      rtPingB?.dispose();
      scanlinesMaterial?.dispose();
      for (const slot of shockwavePool) slot.mat.dispose();
      screenQuad?.geometry.dispose();
      swQuad?.geometry.dispose();
      starfieldMesh?.geometry.dispose();
      starfieldMaterial?.dispose();
      scene.remove(starfieldMesh);
    },
  };
}
