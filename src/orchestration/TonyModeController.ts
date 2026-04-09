// TonyModeController.ts: Activates and deactivates Tony Mode across post-processor, HUD, and audio

import type { IPostProcessor, IHud, IAudioManager } from '../types/game.ts';

export function createTonyModeController(
  postProcessor: IPostProcessor,
  hud: IHud,
  audio: IAudioManager,
) {
  return {
    activate(): void {
      postProcessor.setTonyMode(true);
      hud.showTonyMode();
      audio.startTonyLoop();
    },

    deactivate(): void {
      postProcessor.setTonyMode(false);
      hud.hideTonyMode();
      audio.stopTonyLoop();
    },
  };
}
