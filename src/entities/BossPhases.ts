// BossPhases.ts: Phase transitions, Tony quotes, glitch colour interval, and death sequence

import type * as THREE from 'three';
import type { IHud, IParticleSystem, IAudioManager } from '../types/game.ts';

const QUOTES: string[][] = [
  ['DONNE RICCHE!', 'CULO!', 'OSSA GROSSE!'],
  ['RESTERO SU DI TE', 'COME UNO SCHIZZO', 'DISEGNATO DA MONET!'],
  ['TU SEI GERRY SCOTTI!', 'IO SONO IL GABIBBO!', '200 EURO IN CAMBIO DEL CULO!'],
  ['MI PIACCIONO LE NERE!', 'NON SONO RAZZISTA!', 'IL NERO NON MI RATTRISTA!'],
];

export interface BossPhaseState {
  phase: number;
  ncModeActive: boolean;
  glitchInterval: ReturnType<typeof setInterval> | null;
}

export function createBossPhaseState(): BossPhaseState {
  return { phase: 0, ncModeActive: false, glitchInterval: null };
}

export function showRandomQuote(state: BossPhaseState, hud: IHud): void {
  const pool = QUOTES[state.phase] ?? QUOTES[0];
  hud.showBossQuote(pool[Math.floor(Math.random() * pool.length)]);
}

export function setPhase(
  newPhase: number,
  state: BossPhaseState,
  mat: THREE.MeshBasicMaterial,
  hud: IHud,
  onShockwave: (x: number, y: number) => void,
  onTonyMode: () => void,
  groupPos: { x: number; y: number },
): void {
  state.phase = newPhase;

  if (newPhase === 1) hud.showMessage('TONY SI INCAZZA...', 2200);
  if (newPhase === 2) hud.showMessage('PENSIERO INTRUSIVO!', 2200);

  for (let i = 0; i < 5; i++) {
    const jx = groupPos.x + (Math.random() - 0.5) * 2;
    const jy = groupPos.y + (Math.random() - 0.5) * 2;
    setTimeout(() => onShockwave(jx, jy), i * 80);
  }

  if (newPhase === 2 && !state.ncModeActive) {
    state.ncModeActive = true;
    onTonyMode();
    let glitchToggle = false;
    state.glitchInterval = setInterval(() => {
      glitchToggle = !glitchToggle;
      mat.color.set(glitchToggle ? 0xff0044 : 0xffffff);
    }, 80);
  }
}

export function triggerDeath(
  group: THREE.Group,
  state: BossPhaseState,
  particles: IParticleSystem,
  audio: IAudioManager,
  onShockwave: (x: number, y: number) => void,
  onDeath: () => void,
): void {
  if (state.glitchInterval) {
    clearInterval(state.glitchInterval);
    state.glitchInterval = null;
  }
  group.visible = false;

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const jx = group.position.x + (Math.random() - 0.5) * 3;
      const jy = group.position.y + (Math.random() - 0.5) * 3;
      onShockwave(jx, jy);
      particles.emit(jx, jy, 0, 8, 0xff4400, 4);
    }, i * 110);
  }

  particles.emit(group.position.x, group.position.y, 0, 40, 0xff0044, 5);
  audio.playVictory();
  setTimeout(onDeath, 2200);
}
