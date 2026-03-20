/**
 * Application entry point.
 * Boots the background renderer and the router.
 * ES module scripts are always deferred — the DOM is ready by the time this runs.
 */

import { initRouter }     from './router.js';
import { init as initBg } from './background/BackgroundRenderer.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Missing #app element in index.html');
}

initBg();
initRouter();
