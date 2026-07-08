// HomeDOM.ts: Builds the home screen DOM tree and returns element references

import { getLocalScores } from '../../services/leaderboard.ts';

export interface HomeMenuOpts {
  onItemClick: (index: number) => void;
}

export interface HomeDOMRefs {
  root: HTMLElement;
  asciiEl: HTMLImageElement;
  menuEls: HTMLElement[];
}

export const MENU_ITEMS = [
  { label: 'PLAY GAME', route: '/game' },
  { label: 'HIGH SCORES', route: '/leaderboard', external: true },
  { label: 'CREDITS', route: '/credits', external: true },
];

export function buildHomeDOM(onItemClick: (i: number) => void): HomeDOMRefs {
  const root = document.createElement('div');
  root.className = 'home-root';

  root.appendChild(Object.assign(document.createElement('div'), { className: 'home-scanlines' }));
  root.appendChild(Object.assign(document.createElement('div'), { className: 'home-vignette' }));

  const content = document.createElement('div');
  content.className = 'home-content';

  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'home-insert-coin',
      textContent: 'INSERT COIN',
    }),
  );
  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'home-title-line1',
      textContent: 'INVADER',
    }),
  );
  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'home-title-invaders',
      textContent: 'TONY',
    }),
  );
  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'home-title-sep',
      textContent: '══════════════════════════════════',
    }),
  );

  const asciiEl = document.createElement('img');
  asciiEl.className = 'home-ascii';
  asciiEl.src = '/assets/tony_enemy1.png';
  asciiEl.alt = 'Tony Pitony';
  content.appendChild(asciiEl);

  const menu = document.createElement('div');
  menu.className = 'home-menu';
  const menuEls: HTMLElement[] = [];
  MENU_ITEMS.forEach((_, i) => {
    const el = document.createElement('div');
    el.className = 'home-menu-item';
    el.dataset['index'] = String(i);
    el.addEventListener('click', () => onItemClick(i));
    menuEls.push(el);
    menu.appendChild(el);
  });
  content.appendChild(menu);
  root.appendChild(content);

  const bottom = document.createElement('div');
  bottom.className = 'home-bottom';
  const bl = document.createElement('span');
  bl.className = 'home-bottom-left';
  bl.textContent = '\u00A9 1992 RICCARDO CANELLA';
  const bc = document.createElement('span');
  bc.className = 'home-bottom-center';
  const hi = getLocalScores()[0]?.score ?? 0;
  bc.textContent = `HI-SCORE: ${String(hi).padStart(6, '0')}`;
  const br = document.createElement('span');
  br.className = 'home-bottom-right';
  br.textContent = 'V1.0';
  bottom.appendChild(bl);
  bottom.appendChild(bc);
  bottom.appendChild(br);
  root.appendChild(bottom);

  return { root, asciiEl, menuEls };
}
