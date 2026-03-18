/**
 * Hash-based SPA router.
 * Each page module must export mount(container) and unmount().
 * The router calls unmount() on the current page before mounting the next.
 */

import { HomePage } from './pages/HomePage.js';
import { GamePage } from './pages/GamePage.js';
import { EndPage } from './pages/EndPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';

/** @type {Record<string, { mount: (container: HTMLElement) => void, unmount: () => void }>} */
const ROUTES = {
  '#home': HomePage,
  '#game': GamePage,
  '#end': EndPage,
  '#leaderboard': LeaderboardPage,
};

const DEFAULT_ROUTE = '#home';

/** @type {{ mount: (container: HTMLElement) => void, unmount: () => void } | null} */
let currentPage = null;

/** @type {string} */
let currentHash = '';

/** @type {HTMLElement | null} */
let appContainer = null;

/**
 * Resolves the current hash to a route key, falling back to the default.
 * @returns {string}
 */
function resolveHash() {
  const hash = window.location.hash || DEFAULT_ROUTE;
  return ROUTES[hash] ? hash : DEFAULT_ROUTE;
}

/**
 * Mounts the page matching the current URL hash.
 */
function handleRoute() {
  const hash = resolveHash();
  if (hash === currentHash) return;

  if (currentPage) {
    currentPage.unmount();
    currentPage = null;
  }

  currentHash = hash;
  currentPage = ROUTES[hash];

  if (appContainer) {
    currentPage.mount(appContainer);
  }
}

/**
 * Navigates to a given hash route.
 * @param {string} hash - e.g. '#game'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Returns the currently active route hash.
 * @returns {string}
 */
export function getCurrentRoute() {
  return currentHash;
}

/**
 * Initialises the router, binding it to the given container element.
 * Call once on app startup.
 * @param {HTMLElement} container
 */
export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
