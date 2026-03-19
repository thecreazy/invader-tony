/**
 * Application entry point.
 * Boots the router and hands it the #app container.
 */

import { initRouter }  from './router.js';
import { init as initBg } from './background/BackgroundRenderer.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Missing #app element in index.html');
}

initBg();
initRouter(app);
