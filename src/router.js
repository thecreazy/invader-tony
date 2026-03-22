/**
 * History API SPA router.
 * Handles only in-app routes (/home, /game, /end).
 * "/", "/leaderboard", "/how-to-play", "/credits" are static HTML from public/.
 * Each page module must export mount(container) and unmount().
 * Pages are loaded lazily via dynamic import — each gets its own JS chunk.
 */

import { updateMeta } from './services/seo.js';

/** @type {Record<string, () => Promise<any>>} */
const routes = {
  '/home': () => import('./pages/HomePage.js'),
  '/game': () => import('./pages/GamePage.js'),
  '/end':  () => import('./pages/EndPage.js'),
};

/** @type {HTMLElement | null} */
const app = document.getElementById('app');

/** @type {{ mount: Function, unmount: Function } | null} */
let currentPage = null;

/**
 * @param {string} pathname
 */
async function renderPage(pathname) {
  if (currentPage && typeof currentPage.unmount === 'function') {
    currentPage.unmount();
  }
  currentPage = null;

  const loader = routes[pathname];

  // Unknown route — send to /home
  if (!loader) {
    navigate('/home');
    return;
  }

  updateMeta(pathname);

  const mod = await loader();
  // Pages export { mount, unmount } as named exports or wrapped in a default
  const page = mod.default || mod;
  currentPage = page;

  if (app) {
    await page.mount(app);
  }
}

/**
 * Navigates to a path using the History API.
 * @param {string} path - e.g. '/game'
 */
export function navigate(path) {
  window.history.pushState({}, '', path);
  renderPage(path);
}

/**
 * Returns the currently active pathname.
 * @returns {string}
 */
export function getCurrentRoute() {
  return window.location.pathname;
}

window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
});

/**
 * Initialises the router, rendering the page matching the current URL.
 * Call once on app startup.
 */
export function initRouter() {
  renderPage(window.location.pathname);
}
