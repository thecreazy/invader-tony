// entities.ts: Interfaces for all game entity objects returned by factory functions

import type * as THREE from 'three';
import type { IBulletPool, IAudioManager, IInputManager } from './game.ts';

export interface IPlayer {
  mesh: THREE.Group;
  getPosition(): THREE.Vector3;
  update(dt: number, input: IInputManager, bullets: IBulletPool, audio: IAudioManager): void;
  takeDamage(audio: IAudioManager): void;
  dispose(): void;
}

export type InvaderType = 'basic' | 'elite';

export interface IInvader {
  readonly alive: boolean;
  readonly baseX: number;
  readonly baseY: number;
  readonly type: InvaderType;
  mesh: THREE.Mesh;
  update(delta: number, offsetX: number, offsetY: number): void;
  shoot(bulletPool: IBulletPool): void;
  takeDamage(): number;
  dispose(): void;
}

export interface IBoss {
  mesh: THREE.Group;
  readonly alive: boolean;
  readonly hp: number;
  readonly phase: number;
  update(dt: number): void;
  takeDamage(): void;
  dispose(): void;
}

export interface IWaveManager {
  init(): void;
  getInvaders(): IInvader[];
  getCurrentWave(): number;
  isTransitioning(): boolean;
  isBossSpawned(): boolean;
  markBossSpawned(): void;
  updateGrid(delta: number): void;
  checkWaveClear(floorY: number, onGameOver: () => void): void;
  dispose(): void;
}
