/**
 * Hash-based SPA router with code splitting via dynamic import().
 * Each page module must export mount(container) and unmount().
 */

/** @type {Record<string, () => Promise<any>>} */
const ROUTE_LOADERS = {
  '#home':        () => import('./pages/HomePage.js'),
  '#game':        () => import('./pages/GamePage.js'),
  '#end':         () => import('./pages/EndPage.js'),
  '#leaderboard': () => import('./pages/LeaderboardPage.js'),
};

const DEFAULT_ROUTE = '#home';

/** @type {{ mount: (container: HTMLElement) => void, unmount: () => void } | null} */
let currentPage = null;

/** @type {string} */
let currentHash = '';

/** @type {HTMLElement | null} */
let appContainer = null;

/** @type {boolean} */
let routing = false;

/**
 * Resolves the current hash to a route key, falling back to the default.
 * @returns {string}
 */
function resolveHash() {
  const hash = window.location.hash || DEFAULT_ROUTE;
  return ROUTE_LOADERS[hash] ? hash : DEFAULT_ROUTE;
}

/**
 * Mounts the page matching the current URL hash.
 */
async function handleRoute() {
  if (routing) return;
  routing = true;

  const hash = resolveHash();

  if (hash === currentHash) {
    routing = false;
    return;
  }

  if (currentPage) {
    currentPage.unmount();
    currentPage = null;
  }

  currentHash = hash;

  try {
    const mod = await ROUTE_LOADERS[hash]();
    // Support modules that export mount/unmount directly or via a named page object
    currentPage = typeof mod.mount === 'function'
      ? mod
      : (mod.HomePage ?? mod.GamePage ?? mod.EndPage ?? mod.LeaderboardPage ?? mod.default);

    if (appContainer && currentPage) {
      currentPage.mount(appContainer);
    }
  } catch (err) {
    console.error(`[Router] Failed to load route ${hash}:`, err);
  }

  routing = false;
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
