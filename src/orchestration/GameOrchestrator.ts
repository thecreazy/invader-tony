// GameOrchestrator.ts: Wires all systems/entities together; owns init, start, update, and destroy

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import { createGameState, GamePhase } from '../core/GameState.ts';
import { createSceneSetup } from '../core/SceneSetup.ts';
import { createGameLoop } from '../core/GameLoop.ts';
import { createPlayerEntity } from '../entities/PlayerEntity.ts';
import { createBulletPool } from '../entities/BulletPool.ts';
import { updateInvaderShaderTime } from '../entities/InvaderEntity.ts';
import { createParticleSystem } from '../systems/ParticleSystem.ts';
import { createInputManager } from '../systems/InputManager.ts';
import { createAudioManager } from '../systems/AudioManager.ts';
import { createChiptunePlayer } from '../systems/ChiptunePlayer.ts';
import { createCollisionSystem } from '../systems/CollisionSystem.ts';
import { createWaveManager } from '../systems/WaveManager.ts';
import { createPostProcessor } from '../rendering/PostProcessor.ts';
import { createTonyModeController } from './TonyModeController.ts';
import { createEndConditions } from './EndConditions.ts';
import { spawnBoss } from './BossSpawner.ts';
import { hashScore } from '../utils/scoreHash.ts';
import type { IBoss } from '../types/entities.ts';
import type { IHud, IGridState } from '../types/game.ts';

export interface GameOrchestratorOpts {
  canvas: HTMLCanvasElement;
  hudElement: HTMLElement;
  createHud: (
    container: HTMLElement,
    gameState: ReturnType<typeof createGameState>,
    opts: object,
  ) => IHud;
}

export function createGameOrchestrator(opts: GameOrchestratorOpts) {
  const { canvas, hudElement, createHud } = opts;

  const sceneSetup = createSceneSetup(canvas);
  const { renderer, scene, camera, clock } = sceneSetup;

  const gameState = createGameState();
  const inputManager = createInputManager(canvas.parentElement ?? undefined);
  const audioManager = createAudioManager();
  const particleSystem = createParticleSystem(scene);
  const chiptunePlayer = createChiptunePlayer();
  const playerBullets = createBulletPool(scene, 30, 'player');
  const enemyBullets = createBulletPool(scene, 30, 'enemy');

  let boss: IBoss | null = null;

  const postProcessor = createPostProcessor(renderer, scene, camera, {
    getBoss: () => boss,
  });

  // Score hash chain
  let _sessionToken: string | null = null;
  let _scoreHash = '0';
  let _lastScore = 0;

  gameState.on('score', (total) => {
    const t = total as number;
    const delta = t - _lastScore;
    _lastScore = t;
    if (delta > 0) {
      const source = t > 2000 ? 'boss' : 'hit';
      _scoreHash = hashScore(_scoreHash, delta, source, t);
    }
  });

  fetch('/api/session/start', { method: 'POST' })
    .then((r) => r.json())
    .then((d: { token?: string }) => {
      _sessionToken = d.token ?? null;
    })
    .catch(() => {
      _sessionToken = null;
    });

  const hud = createHud(hudElement, gameState, {
    onMuteToggle: (muted: boolean) => {
      chiptunePlayer.setVolume(muted ? 0 : gameState.current === GamePhase.BOSS_FIGHT ? 0.25 : 0.5);
    },
  });

  const tonyMode = createTonyModeController(postProcessor, hud, audioManager);

  const endConditions = createEndConditions({
    gameState,
    chiptunePlayer,
    audioManager,
    onDeactivateTonyMode: () => tonyMode.deactivate(),
    getSessionToken: () => _sessionToken,
    getScoreHash: () => _scoreHash,
  });

  const grid: IGridState = {
    offsetX: 0,
    offsetY: 0,
    direction: 1,
    speed: CONFIG.ENEMY.BASE_SPEED,
    shootTimer: 2.0,
    speedMultiplier: 1.0,
    shootIntervalMin: CONFIG.ENEMY.SHOOT_INTERVAL_MIN,
    shootIntervalMax: CONFIG.ENEMY.SHOOT_INTERVAL_MAX,
    currentDropAmount: 0.28,
  };

  const player = createPlayerEntity(scene, gameState, {
    onDamage: () => postProcessor.setDamageFlash(),
  });

  const waveManager = createWaveManager(scene, {
    gameState,
    grid,
    hud,
    audioManager,
    postProcessor,
    enemyBullets,
    onBossSpawn: () => {
      boss = spawnBoss(
        {
          scene,
          gameState,
          enemyBullets,
          particleSystem,
          audioManager,
          hud,
          postProcessor,
          chiptunePlayer,
          getPlayerPos: () => player.getPosition(),
          onTonyMode: () => tonyMode.activate(),
          onDeath: () => endConditions.triggerVictory(),
        },
        () => waveManager.markBossSpawned(),
      );
    },
  });

  const collisions = createCollisionSystem({
    player,
    getInvaders: () => waveManager.getInvaders(),
    getBoss: () => boss,
    playerBullets,
    enemyBullets,
    gameState,
    audioManager,
    particleSystem,
  });

  const visibilityHandler = () => {
    if (document.hidden) {
      chiptunePlayer.stop();
    } else if (
      gameState.current === GamePhase.PLAYING ||
      gameState.current === GamePhase.BOSS_FIGHT
    ) {
      void chiptunePlayer.play();
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  function update(delta: number): void {
    const state = gameState.current;
    if (state !== GamePhase.PLAYING && state !== GamePhase.BOSS_FIGHT) return;

    player.update(delta, inputManager, playerBullets, audioManager);
    playerBullets.updateAll(delta);
    enemyBullets.updateAll(delta);
    particleSystem.update(delta);
    updateInvaderShaderTime(delta);

    if (state === GamePhase.PLAYING) waveManager.updateGrid(delta);

    if (state === GamePhase.BOSS_FIGHT && boss && boss.alive) {
      boss.update(delta);
      hud.updateBossBar(boss.hp, CONFIG.BOSS.HP);
    }

    collisions.check();

    if (gameState.current === GamePhase.GAME_OVER || gameState.current === GamePhase.VICTORY)
      return;
    if (gameState.lives <= 0) {
      endConditions.triggerGameOver();
      return;
    }
    if (state === GamePhase.PLAYING) {
      waveManager.checkWaveClear(CONFIG.GAMEPLAY.INVADER_FLOOR_Y, () =>
        endConditions.triggerGameOver(),
      );
    }
  }

  const gameLoop = createGameLoop(clock, update, (delta) => {
    postProcessor.updateEffects(delta);
    postProcessor.renderFrame(delta);
  });

  return {
    init(): void {
      waveManager.init();
      setTimeout(() => hud.showMessage('WAVE 1', 1500), 300);
    },

    start(): void {
      gameLoop.start();
      chiptunePlayer.play().catch(() => {
        const onFirst = () => void chiptunePlayer.play();
        window.addEventListener('keydown', onFirst, { once: true });
        canvas.addEventListener('touchstart', onFirst, { once: true });
      });
    },

    stop(): void {
      gameLoop.stop();
    },

    destroy(): void {
      gameLoop.stop();
      document.removeEventListener('visibilitychange', visibilityHandler);
      chiptunePlayer.destroy();
      inputManager.destroy();
      audioManager.destroy();
      particleSystem.dispose();
      player.dispose();
      playerBullets.dispose();
      enemyBullets.dispose();
      waveManager.dispose();
      boss?.dispose();
      boss = null;
      hud.dispose();
      postProcessor.dispose();
      sceneSetup.destroy();
    },
  };
}
