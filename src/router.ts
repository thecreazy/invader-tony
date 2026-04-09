// router.ts: Hash-based SPA router — mounts/unmounts page modules on hash change

import { updateMeta } from './services/seo.ts';

type PageModule = { mount: (c: HTMLElement) => void; unmount: () => void };

const ROUTES: Record<string, () => Promise<PageModule>> = {
  '/home': () => import('./pages/home/HomePage.ts') as Promise<PageModule>,
  '/game': () => import('./pages/GamePage.ts') as Promise<PageModule>,
  '/end': () => import('./pages/end/EndPage.ts') as Promise<PageModule>,
  '/credits': () => import('./pages/CreditsPage.ts') as Promise<PageModule>,
};

let currentModule: PageModule | null = null;
let appContainer: HTMLElement | null = null;

export function navigate(path: string): void {
  window.location.hash = path;
}

async function handleRoute(): Promise<void> {
  const hash = window.location.hash.slice(1) || '/home';
  const loader = ROUTES[hash];

  if (currentModule) {
    currentModule.unmount();
    currentModule = null;
  }

  if (!appContainer) return;
  appContainer.innerHTML = '';
  updateMeta(hash);

  if (!loader) {
    navigate('/home');
    return;
  }

  const mod = await loader();
  currentModule = mod;
  mod.mount(appContainer);
}

export function initRouter(): void {
  appContainer = document.getElementById('app');
  window.addEventListener('hashchange', () => void handleRoute());
  void handleRoute();
}
