// GamePage.ts: Mounts canvas + HUD container, creates the game orchestrator, starts and destroys it

import { createGameOrchestrator } from '../orchestration/GameOrchestrator.ts';
import { createHUD } from '../ui/HUD.ts';
import { pause, resume } from '../background/BackgroundRenderer.ts';
import { createPortraitGuard, type PortraitGuard } from '../utils/portraitGuard.ts';

let game: ReturnType<typeof createGameOrchestrator> | null = null;
let portraitGuard: PortraitGuard | null = null;

export function mount(container: HTMLElement): void {
  pause();

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';

  const hudEl = document.createElement('div');
  hudEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

  wrapper.appendChild(canvas);
  wrapper.appendChild(hudEl);
  container.appendChild(wrapper);
  portraitGuard = createPortraitGuard(wrapper);

  game = createGameOrchestrator({ canvas, hudElement: hudEl, createHud: createHUD });
  game.init();
  game.start();
}

export function unmount(): void {
  game?.destroy();
  game = null;
  portraitGuard?.destroy();
  portraitGuard = null;
  resume();
}

export const GamePage = { mount, unmount };
