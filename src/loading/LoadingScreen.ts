// LoadingScreen.ts: Public entry point — shows overlay, runs preload, fades out

import { createLoadingOverlay } from './LoadingOverlay.ts';
import { preloadAllAssets } from './AssetLoader.ts';

export { getAudioUrl } from './AudioCache.ts';

export async function showLoadingScreen(): Promise<void> {
  const overlay = createLoadingOverlay();
  document.body.appendChild(overlay.element);

  await preloadAllAssets(overlay);

  await new Promise<void>((r) => setTimeout(r, 350));
  await overlay.fadeOut();
}
