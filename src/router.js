/**
 * History API SPA router.
 * Handles only in-app routes (/home, /game, /end, /credits).
 * "/", "/leaderboard", "/how-to-play" are static HTML from public/ — outside this router.
 * Each page module must export mount(container) and unmount().
 */

import { HomePage }   from './pages/HomePage.js';
import { GamePage }   from './pages/GamePage.js';
import { EndPage }    from './pages/EndPage.js';
import { updateMeta } from './services/seo.js';

/** @type {Record<string, { mount: (el: HTMLElement) => void, unmount: () => void }>} */
const routes = {
  '/home': HomePage,
  '/game': GamePage,
  '/end':  EndPage,
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

  const PageModule = routes[pathname];

  // Unknown route — send to /home
  if (!PageModule) {
    navigate('/home');
    return;
  }

  updateMeta(pathname);
  currentPage = PageModule;

  if (app) {
    await PageModule.mount(app);
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
