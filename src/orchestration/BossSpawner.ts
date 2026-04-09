// BossSpawner.ts: Assembles the BossTony entity and wires its callbacks into the game context

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import { GamePhase } from '../core/GameState.ts';
import { createBossEntity } from '../entities/BossEntity.ts';
import type { IBoss } from '../types/entities.ts';
import type {
  IGameState,
  IBulletPool,
  IParticleSystem,
  IAudioManager,
  IHud,
  IPostProcessor,
  IChiptunePlayer,
} from '../types/game.ts';

export interface BossSpawnerOpts {
  scene: THREE.Scene;
  gameState: IGameState;
  enemyBullets: IBulletPool;
  particleSystem: IParticleSystem;
  audioManager: IAudioManager;
  hud: IHud;
  postProcessor: IPostProcessor;
  chiptunePlayer: IChiptunePlayer;
  getPlayerPos: () => THREE.Vector3;
  onTonyMode: () => void;
  onDeath: () => void;
}

export function spawnBoss(opts: BossSpawnerOpts, waveManagerMarkSpawned: () => void): IBoss {
  waveManagerMarkSpawned();
  opts.gameState.transition(GamePhase.BOSS_FIGHT);
  opts.chiptunePlayer.setVolume(0.25);

  const boss = createBossEntity(opts.scene, {
    enemyBulletPool: opts.enemyBullets,
    particleSystem: opts.particleSystem,
    audioManager: opts.audioManager,
    hud: opts.hud,
    getPlayerPos: opts.getPlayerPos,
    onShockwave: (wx, wy) => opts.postProcessor.triggerShockwave(wx, wy),
    onTonyMode: opts.onTonyMode,
    onDeath: opts.onDeath,
  });

  opts.hud.showBossBar(boss.hp, CONFIG.BOSS.HP);
  return boss;
}
