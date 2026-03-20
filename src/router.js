/**
 * History API SPA router.
 * Each page module must export mount(container) and unmount().
 */

import { LandingPage }     from './pages/LandingPage.js';
import { HomePage }        from './pages/HomePage.js';
import { GamePage }        from './pages/GamePage.js';
import { EndPage }         from './pages/EndPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { CreditsPage }     from './pages/CreditsPage.js';
import { updateMeta }      from './services/seo.js';

/** @type {Record<string, { mount: (el: HTMLElement) => void, unmount: () => void }>} */
const routes = {
  '/':            LandingPage,
  '/home':        HomePage,
  '/game':        GamePage,
  '/end':         EndPage,
  '/leaderboard': LeaderboardPage,
  '/credits':     CreditsPage,
};

/** @type {HTMLElement | null} */
const app = document.getElementById('app');

/** @type {{ mount: Function, unmount: Function } | null} */
let currentPage = null;

/**
 * @param {string} pathname
 */
function getPageModule(pathname) {
  return routes[pathname] || routes['/'];
}

/**
 * @param {string} pathname
 */
async function renderPage(pathname) {
  if (currentPage && typeof currentPage.unmount === 'function') {
    currentPage.unmount();
  }
  currentPage = null;

  updateMeta(pathname);

  const PageModule = getPageModule(pathname);
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
