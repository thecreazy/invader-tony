// game.ts: Core game state types, phase enum, wave config, and score entry contracts

import type * as THREE from 'three';

export const GamePhase = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  BOSS_FIGHT: 'BOSS_FIGHT',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface IGameState {
  readonly current: GamePhase;
  readonly score: number;
  readonly lives: number;
  readonly wave: number;
  transition(newState: GamePhase): void;
  addScore(points: number): void;
  loseLife(): number;
  setWave(n: number): void;
  on(event: string, cb: (data: unknown) => void): void;
  off(event: string, cb: (data: unknown) => void): void;
  get(): { current: GamePhase; score: number; lives: number; wave: number };
  reset(): void;
}

export interface IWaveConfig {
  id: number;
  label: string;
  cols: number;
  rows: number;
  enemyTypes: string[];
  speedMultiplier: number;
  shootIntervalMin: number;
  shootIntervalMax: number;
  dropAmount: number;
}

export interface IGridState {
  offsetX: number;
  offsetY: number;
  direction: number;
  speed: number;
  shootTimer: number;
  speedMultiplier: number;
  shootIntervalMin: number;
  shootIntervalMax: number;
  currentDropAmount: number;
}

export interface ScoreEntry {
  name: string;
  score: number;
  created_at: string;
}

export interface IInputManager {
  isLeft(): boolean;
  isRight(): boolean;
  isFirePressed(): boolean;
  destroy(): void;
}

export interface IHud {
  show(): void;
  hide(): void;
  showMessage(text: string, ms: number): void;
  showBossQuote(text: string): void;
  showBossBar(hp: number, max: number): void;
  updateBossBar(hp: number, max: number): void;
  hideBossBar(): void;
  showTonyMode(): void;
  hideTonyMode(): void;
  dispose(): void;
}

export interface IAudioManager {
  init(): void;
  playShoot(): void;
  playExplosion(): void;
  playHit(): void;
  playBossHit(): void;
  playBossEntry(): void;
  playGameOver(): void;
  playVictory(): void;
  playWaveClear(): void;
  startTonyLoop(): void;
  stopTonyLoop(): void;
  destroy(): void;
}

export interface IChiptunePlayer {
  play(): Promise<void>;
  stop(): void;
  setVolume(v: number): void;
  readonly isPlaying: boolean;
  destroy(): void;
}

export interface IPostProcessor {
  renderFrame(delta: number): void;
  triggerShockwave(x: number, y: number): void;
  onResize(): void;
  setTonyMode(active: boolean): void;
  setDamageFlash(): void;
  setWarpIntensity(v: number): void;
  updateEffects(delta: number): void;
  dispose(): void;
}

export interface IParticleSystem {
  emit(
    x: number,
    y: number,
    z: number,
    count: number,
    color: number | string,
    speed?: number,
  ): void;
  update(delta: number): void;
  dispose(): void;
}

export interface IBulletPool {
  acquire(): IBullet | null;
  getActive(): IBullet[];
  updateAll(delta: number): void;
  dispose(): void;
}

export interface IBullet {
  active: boolean;
  mesh: THREE.Mesh;
  activate(x: number, y: number, vx: number, vy: number): void;
  deactivate(): void;
}
