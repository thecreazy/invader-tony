// AssetLoader.ts: Orchestrates parallel preloading of fonts, images, audio, and JS chunks

import { loadAudio, setAudioBlobUrl } from './AudioCache.ts';
import type { ILoadingOverlay } from './LoadingOverlay.ts';

const WEIGHTS = { fonts: 5, images: 5, audio: 40, home: 15, game: 30, systems: 5 } as const;
type WeightKey = keyof typeof WEIGHTS;
const TOTAL = (Object.values(WEIGHTS) as number[]).reduce((a, b) => a + b, 0);

export async function preloadAllAssets(overlay: ILoadingOverlay): Promise<void> {
  const done: Record<WeightKey, number> = {
    fonts: 0,
    images: 0,
    audio: 0,
    home: 0,
    game: 0,
    systems: 0,
  };

  function updateProgress(status?: string): void {
    const sum = (Object.values(done) as number[]).reduce((a, b) => a + b, 0);
    overlay.setProgress(Math.min(100, (sum / TOTAL) * 100));
    if (status) overlay.setStatus(status);
  }

  const loadFonts = () =>
    document.fonts.ready.then(() => {
      done.fonts = WEIGHTS.fonts;
      updateProgress('LOADING...');
    });

  const loadImages = () => {
    const srcs = ['/assets/tony_enemy1.png', '/assets/tony_enemy2.png', '/assets/tony_boss.png'];
    return Promise.all(
      srcs.map(
        (src) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.onload = img.onerror = () => res();
            img.src = src;
          }),
      ),
    ).then(() => {
      done.images = WEIGHTS.images;
      updateProgress('LOADING...');
    });
  };

  const loadAudioAsset = () =>
    loadAudio((ratio) => {
      done.audio = Math.min(WEIGHTS.audio, ratio * WEIGHTS.audio);
      updateProgress('LOADING AUDIO...');
    }).then(() => {
      done.audio = WEIGHTS.audio;
      updateProgress('LOADING...');
    });

  const loadHomeChunk = () =>
    import('../pages/home/HomePage.ts').then(() => {
      done.home = WEIGHTS.home;
      updateProgress('LOADING...');
    });

  const loadGameChunks = () =>
    Promise.all([
      import('../orchestration/GameOrchestrator.ts'),
      import('../pages/GamePage.ts'),
    ]).then(() => {
      done.game = WEIGHTS.game;
      updateProgress('LOADING...');
    });

  const loadSystemChunks = () =>
    Promise.all([
      import('../systems/AudioManager.ts'),
      import('../systems/ChiptunePlayer.ts'),
      import('../systems/InputManager.ts'),
    ]).then(() => {
      done.systems = WEIGHTS.systems;
      updateProgress('LOADING...');
    });

  overlay.setStatus('INITIALIZING...');
  await Promise.all([
    loadFonts(),
    loadImages(),
    loadAudioAsset(),
    loadHomeChunk(),
    loadGameChunks(),
    loadSystemChunks(),
  ]);

  overlay.setProgress(100);
  overlay.setStatus('READY');
}
