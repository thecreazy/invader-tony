// BossMovement.ts: Boss movement patterns per phase — pure position math, no rendering

import * as THREE from 'three';

export function updateBossMovement(group: THREE.Group, phase: number, moveTime: number): void {
  let x: number;
  let y: number;

  if (phase === 0) {
    x = Math.sin(moveTime * 0.8) * 5.0;
    y = 3.5;
  } else if (phase === 1) {
    x = Math.sin(moveTime * 1.4) * 4.0 + Math.sin(moveTime * 3.1) * 1.5;
    y = 3.5 + Math.sin(moveTime * 1.1) * 0.8;
  } else {
    x = Math.sin(moveTime * 2.2) * 5.5 + Math.cos(moveTime * 5.7) * 1.0;
    y = 3.5 + Math.sin(moveTime * 2.8) * 1.5;
  }

  group.position.x = x;
  group.position.y = y;
}
