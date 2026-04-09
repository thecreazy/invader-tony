// main.ts: Application entry point — loading screen → background renderer → SPA router

import { showLoadingScreen } from './loading/LoadingScreen.ts';
import { init as initBg } from './background/BackgroundRenderer.ts';
import { initRouter } from './router.ts';

await showLoadingScreen();
initBg();
initRouter();
