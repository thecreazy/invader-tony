/**
 * Main game orchestrator.
 * Owns the Three.js renderer, scene, clock, and the requestAnimationFrame loop.
 * Coordinates all systems: input, audio, particles, entities, HUD.
 * Post-processing: game renders to RenderTarget → shockwave passes → scanlines → screen.
 */

import * as THREE from 'three';

import { CONFIG }               from '../config.js';
import { navigate }             from '../router.js';
import { createGameState, STATES } from './GameState.js';
import { createInputManager }   from '../systems/InputManager.js';
import { createAudioManager }   from '../systems/AudioManager.js';
import { createParticleSystem } from '../systems/ParticleSystem.js';
import { createPlayer }         from './entities/Player.js';
import { createBulletPool }     from './entities/Bullet.js';
import { createCageInvader, disposeInvaderResources, updateInvaderShaderTime } from './entities/CageInvader.js';
import { createBossCage }       from './entities/BossCage.js';
import { createHUD }            from '../ui/HUD.js';

import scanlinesVert from './shaders/scanlines/scanlines.vert';
import scanlinesFrag from './shaders/scanlines/scanlines.frag';
import shockwaveVert from './shaders/shockwave/shockwave.vert';
import shockwaveFrag from './shaders/shockwave/shockwave.frag';

// Pre-allocated vectors for collision detection — never new'd in the game loop
const _pA = new THREE.Vector3();
const _pB = new THREE.Vector3();

const GRID_COLS        = CONFIG.GRID.COLS;   // 10
const GRID_ROWS        = CONFIG.GRID.ROWS;   // 4
const TOTAL_INVADERS   = GRID_COLS * GRID_ROWS;
const DROP_AMOUNT      = 0.5;
const EDGE_RIGHT       = 6.5;
const EDGE_LEFT        = -6.5;
const INVADER_FLOOR_Y  = -3.5;
const SHOCKWAVE_POOL   = 5;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement}       hudElement
 */
export function createGame(canvas, hudElement) {
  // ── Three.js core ──────────────────────────────────────────────────────────
  let renderer, scene, camera, clock;

  // ── Post-processing ────────────────────────────────────────────────────────
  let rtPingA, rtPingB;
  let screenScene, screenCamera, screenQuad;
  let scanlinesMaterial;
  /** @type {{ mat: THREE.ShaderMaterial, active: boolean, progress: number }[]} */
  const shockwavePool = [];
  let nicCageModeActive = false;

  // ── Systems ───────────────────────────────────────────────────────────────
  let gameState, inputManager, audioManager, particleSystem, hud;

  // ── Entities ──────────────────────────────────────────────────────────────
  let player, playerBullets, enemyBullets;
  /** @type {ReturnType<typeof createCageInvader>[]} */
  let invaders = [];
  /** @type {ReturnType<typeof createBossCage> | null} */
  let boss = null;

  // ── Grid movement state ───────────────────────────────────────────────────
  const grid = {
    offsetX:    0,
    offsetY:    0,
    direction:  1,
    speed:      CONFIG.ENEMY.BASE_SPEED,
    shootTimer: 1.0,
  };

  // ── Loop ──────────────────────────────────────────────────────────────────
  let animId      = null;
  let bossSpawned = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function makeRenderTarget(w, h) {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
    });
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Recreate render targets at new resolution
    rtPingA.dispose();
    rtPingB.dispose();
    rtPingA = makeRenderTarget(w, h);
    rtPingB = makeRenderTarget(w, h);

    if (scanlinesMaterial) {
      scanlinesMaterial.uniforms.uResolution.value.set(w, h);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(CONFIG.COLORS.BACKGROUND);

    // Camera
    camera = new THREE.PerspectiveCamera(
      CONFIG.CANVAS.FOV,
      w / h,
      CONFIG.CANVAS.NEAR,
      CONFIG.CANVAS.FAR,
    );
    camera.position.z = 10;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ── Post-processing setup ─────────────────────────────────────────────
    rtPingA = makeRenderTarget(w, h);
    rtPingB = makeRenderTarget(w, h);

    // Orthographic camera + fullscreen quad for post passes
    screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    screenScene  = new THREE.Scene();

    const quadGeom = new THREE.PlaneGeometry(2, 2);

    // Scanlines material (final composite)
    scanlinesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture:    { value: null },
        uTime:       { value: 0 },
        uIntensity:  { value: 0.8 },
        uNicCageMode:{ value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
      },
      vertexShader:   scanlinesVert,
      fragmentShader: scanlinesFrag,
      depthTest: false,
    });

    screenQuad = new THREE.Mesh(quadGeom, scanlinesMaterial);
    screenScene.add(screenQuad);

    // Shockwave pool — 5 pre-allocated passes
    for (let i = 0; i < SHOCKWAVE_POOL; i++) {
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

    // Systems
    gameState     = createGameState();
    inputManager  = createInputManager(canvas.parentElement);
    audioManager  = createAudioManager();
    particleSystem = createParticleSystem(scene);
    hud           = createHUD(hudElement, gameState);

    // Bullet pools — pre-allocated, never grows
    playerBullets = createBulletPool(scene, 30, 'player');
    enemyBullets  = createBulletPool(scene, 30, 'enemy');

    // Entities
    player = createPlayer(scene, gameState);
    spawnGrid();

    window.addEventListener('resize', onResize);
  }

  // ── Spawn helpers ─────────────────────────────────────────────────────────
  function spawnGrid() {
    for (const inv of invaders) inv.dispose();
    invaders = [];
    disposeInvaderResources();

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        invaders.push(createCageInvader(scene, { col, row }));
      }
    }

    grid.offsetX   = 0;
    grid.offsetY   = 0;
    grid.direction = 1;
    grid.speed     = CONFIG.ENEMY.BASE_SPEED;
    grid.shootTimer = 1.0;
    bossSpawned    = false;
  }

  function spawnBoss() {
    bossSpawned = true;
    gameState.transition(STATES.BOSS_FIGHT);

    boss = createBossCage(scene, {
      enemyBulletPool: enemyBullets,
      particleSystem,
      audioManager,
      hud,
      getPlayerPos:  () => player.getPosition(),
      onShockwave:   (wx, wy) => triggerShockwave(wx, wy),
      onNicCageMode: () => activateNicCageMode(),
      onDeath:       () => triggerVictory(),
    });

    hud.showBossBar(boss.hp, CONFIG.BOSS.HP);
  }

  // ── Shockwave ─────────────────────────────────────────────────────────────
  /** Project world-space position to UV, activate a shockwave pass */
  function triggerShockwave(worldX, worldY) {
    const slot = shockwavePool.find(s => !s.active);
    if (!slot) return;

    // Project world → NDC → UV
    _pA.set(worldX, worldY, 0);
    _pA.project(camera);
    const u = (_pA.x + 1) * 0.5;
    const v = (_pA.y + 1) * 0.5;

    slot.active   = true;
    slot.progress = 0;
    slot.mat.uniforms.uCenter.value.set(u, v);
    slot.mat.uniforms.uProgress.value = 0;
    slot.mat.uniforms.uStrength.value = 0.35;
  }

  // ── Nicolas Cage Mode ─────────────────────────────────────────────────────
  function activateNicCageMode() {
    nicCageModeActive = true;
    if (scanlinesMaterial) scanlinesMaterial.uniforms.uNicCageMode.value = 1;
    hud.showNicCageMode();
    audioManager.startNicCageLoop();
  }

  function deactivateNicCageMode() {
    nicCageModeActive = false;
    if (scanlinesMaterial) scanlinesMaterial.uniforms.uNicCageMode.value = 0;
    hud.hideNicCageMode();
    audioManager.stopNicCageLoop();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderFrame(delta) {
    // Pass 1: render game scene to rtPingA
    renderer.setRenderTarget(rtPingA);
    renderer.clear();
    renderer.render(scene, camera);

    // Pass 2: apply active shockwave passes (ping-pong)
    let src = rtPingA;
    let dst = rtPingB;

    const swMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    swMesh.frustumCulled = false;

    for (const slot of shockwavePool) {
      if (!slot.active) continue;

      slot.progress += delta * 0.9; // expand speed
      if (slot.progress >= 1) { slot.active = false; continue; }

      slot.mat.uniforms.uTexture.value  = src.texture;
      slot.mat.uniforms.uProgress.value = slot.progress;

      swMesh.material = slot.mat;
      screenScene.add(swMesh);

      renderer.setRenderTarget(dst);
      renderer.clear();
      renderer.render(screenScene, screenCamera);

      screenScene.remove(swMesh);

      // Swap ping-pong buffers
      const tmp = src; src = dst; dst = tmp;
    }

    swMesh.geometry.dispose();

    // Pass 3: scanlines composite → screen
    scanlinesMaterial.uniforms.uTexture.value = src.texture;
    scanlinesMaterial.uniforms.uTime.value   += delta;

    screenQuad.material = scanlinesMaterial;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(screenScene, screenCamera);
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    animId = requestAnimationFrame(loop);
    let delta = clock.getDelta();
    if (delta > 0.05) delta = 0.05; // spiral-of-death guard

    update(delta);
    renderFrame(delta);
  }

  function update(delta) {
    const state = gameState.current;
    if (state !== STATES.PLAYING && state !== STATES.BOSS_FIGHT) return;

    player.update(delta, inputManager, playerBullets, audioManager);
    playerBullets.updateAll(delta);
    enemyBullets.updateAll(delta);
    particleSystem.update(delta);
    updateInvaderShaderTime(delta);

    if (state === STATES.PLAYING) {
      updateGrid(delta);
    }

    if (state === STATES.BOSS_FIGHT && boss && boss.alive) {
      boss.update(delta);
      hud.updateBossBar(boss.hp, CONFIG.BOSS.HP);
    }

    checkCollisions();
    checkWinLose();
  }

  // ── Grid movement ─────────────────────────────────────────────────────────
  function updateGrid(delta) {
    // Collect alive invaders (iterate array once, no filter allocation)
    let aliveCount = 0;
    let maxBaseX   = -Infinity;
    let minBaseX   =  Infinity;

    for (const inv of invaders) {
      if (!inv.alive) continue;
      aliveCount++;
      if (inv.baseX > maxBaseX) maxBaseX = inv.baseX;
      if (inv.baseX < minBaseX) minBaseX = inv.baseX;
    }

    if (aliveCount === 0) return;

    // Speed scales with casualties
    grid.speed = CONFIG.ENEMY.BASE_SPEED * (1 + (1 - aliveCount / TOTAL_INVADERS) * 2.5);

    // Move
    grid.offsetX += grid.direction * grid.speed * delta;

    // Edge detection using rightmost/leftmost alive columns
    const rightEdge = maxBaseX + grid.offsetX;
    const leftEdge  = minBaseX + grid.offsetX;

    if (rightEdge > EDGE_RIGHT || leftEdge < EDGE_LEFT) {
      grid.direction *= -1;
      grid.offsetY   -= DROP_AMOUNT;
      // Nudge back so we don't re-trigger next frame
      grid.offsetX   += grid.direction * 0.05;
    }

    // Apply offset + idle animation to all invaders
    for (const inv of invaders) {
      inv.update(delta, grid.offsetX, grid.offsetY);
    }

    // Random shooting
    grid.shootTimer -= delta;
    if (grid.shootTimer <= 0) {
      // Pick a random alive invader
      let attempts = 0;
      while (attempts < 10) {
        const idx = Math.floor(Math.random() * invaders.length);
        if (invaders[idx].alive) {
          invaders[idx].shoot(enemyBullets);
          break;
        }
        attempts++;
      }
      const minInterval = CONFIG.ENEMY.SHOOT_INTERVAL_MIN / 1000;
      const maxInterval = CONFIG.ENEMY.SHOOT_INTERVAL_MAX / 1000;
      grid.shootTimer = minInterval + Math.random() * (maxInterval - minInterval);
    }
  }

  // ── Collision detection ───────────────────────────────────────────────────
  function checkCollisions() {
    const state = gameState.current;
    const pbArr = playerBullets.getActive();
    const ebArr = enemyBullets.getActive();

    // ── Player bullets vs invaders ────────────────────────────────────────
    if (state === STATES.PLAYING) {
      for (const pb of pbArr) {
        if (!pb.active) continue;
        _pA.copy(pb.mesh.position);

        for (const inv of invaders) {
          if (!inv.alive) continue;
          _pB.copy(inv.mesh.position);

          if (_pA.distanceTo(_pB) < 0.45) {
            const pts = inv.takeDamage();
            pb.deactivate();
            gameState.addScore(pts);
            audioManager.playExplosion();
            particleSystem.emit(_pB.x, _pB.y, 0, 12, 0xffaa00, 3.5);
            break; // one bullet hits one invader
          }
        }
      }
    }

    // ── Player bullets vs boss ────────────────────────────────────────────
    if (state === STATES.BOSS_FIGHT && boss && boss.alive) {
      _pB.copy(boss.mesh.position);

      for (const pb of pbArr) {
        if (!pb.active) continue;
        _pA.copy(pb.mesh.position);

        if (_pA.distanceTo(_pB) < 1.5) {
          boss.takeDamage();
          pb.deactivate();
          gameState.addScore(50);
        }
      }
    }

    // ── Enemy bullets vs player ───────────────────────────────────────────
    _pB.copy(player.getPosition());

    for (const eb of ebArr) {
      if (!eb.active) continue;
      _pA.copy(eb.mesh.position);

      if (_pA.distanceTo(_pB) < 0.5) {
        eb.deactivate();
        player.takeDamage(audioManager);
        particleSystem.emit(_pB.x, _pB.y, 0, 8, 0x00ffff, 2.5);
      }
    }
  }

  // ── Win / lose ────────────────────────────────────────────────────────────
  function checkWinLose() {
    const state = gameState.current;
    if (state === STATES.GAME_OVER || state === STATES.VICTORY) return;

    // Player out of lives
    if (gameState.lives <= 0) { triggerGameOver(); return; }

    if (state === STATES.PLAYING) {
      // Invaders reached the player floor
      for (const inv of invaders) {
        if (inv.alive && inv.mesh.position.y < INVADER_FLOOR_Y) {
          triggerGameOver();
          return;
        }
      }

      // All invaders dead → boss wave
      let alive = 0;
      for (const inv of invaders) { if (inv.alive) alive++; }
      if (alive === 0 && !bossSpawned) {
        spawnBoss();
      }
    }
    // Note: Boss death is handled by the onDeath callback → triggerVictory()
  }

  function triggerGameOver() {
    if (gameState.current === STATES.GAME_OVER) return;
    gameState.transition(STATES.GAME_OVER);
    if (nicCageModeActive) deactivateNicCageMode();
    audioManager.playGameOver();
    hud.showMessage('GAME OVER', 1800);
    sessionStorage.setItem('cage_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('cage_invaders_result', 'game_over');
    setTimeout(() => navigate('#end'), 1800);
  }

  function triggerVictory() {
    if (gameState.current === STATES.VICTORY) return;
    gameState.transition(STATES.VICTORY);
    if (nicCageModeActive) deactivateNicCageMode();
    audioManager.playVictory();
    hud.showMessage('YOU WIN!', 1800);
    hud.hideBossBar();
    sessionStorage.setItem('cage_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('cage_invaders_result', 'victory');
    setTimeout(() => navigate('#end'), 1800);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init,

    start() {
      clock.start();
      loop();
    },

    stop() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    },

    destroy() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      window.removeEventListener('resize', onResize);

      inputManager?.destroy();
      audioManager?.destroy();
      particleSystem?.dispose();
      player?.dispose();
      playerBullets?.dispose();
      enemyBullets?.dispose();

      for (const inv of invaders) inv.dispose();
      disposeInvaderResources();
      invaders = [];

      boss?.dispose();
      boss = null;

      hud?.dispose();

      // Post-processing cleanup
      rtPingA?.dispose();
      rtPingB?.dispose();
      scanlinesMaterial?.dispose();
      for (const slot of shockwavePool) slot.mat.dispose();
      screenQuad?.geometry.dispose();

      renderer?.dispose();
    },
  };
}
