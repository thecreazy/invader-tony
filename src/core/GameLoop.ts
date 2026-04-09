// GameLoop.ts: Single requestAnimationFrame owner; calls update(dt) then render(dt) each frame

import * as THREE from 'three';

const MAX_DELTA = 0.05; // cap at 50 ms to prevent spiral-of-death on tab restore

export interface IGameLoop {
  start(): void;
  stop(): void;
}

export function createGameLoop(
  clock: THREE.Clock,
  update: (dt: number) => void,
  render: (dt: number) => void,
): IGameLoop {
  let animId: number | null = null;

  function loop(): void {
    animId = requestAnimationFrame(loop);
    let delta = clock.getDelta();
    if (delta > MAX_DELTA) delta = MAX_DELTA;
    update(delta);
    render(delta);
  }

  return {
    start() {
      clock.start();
      loop();
    },

    stop() {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    },
  };
}
