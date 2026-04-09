// CreditsPage.ts: Arcade-aesthetic credits with Konami easter egg — mount/unmount lifecycle

import { navigate } from '../router.ts';
import styles from './CreditsPage.css?inline';
import {
  TECH_STACK_ITEMS,
  EASTER_EGG_ASCII,
  DISCLAIMER_HTML,
  PERSON_SCHEMA,
} from './content/creditsContent.ts';
import { injectStyle, removeStyle } from '../utils/dom.ts';
import { listenKonami } from '../utils/konamiCode.ts';

let _styleEl: HTMLStyleElement | null = null;
let _root: HTMLElement | null = null;
let _container: HTMLElement | null = null;
let _removeKey: (() => void) | null = null;
let _eggEl: HTMLElement | null = null;

function playKonamiSound(): void {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    });
    setTimeout(() => ctx.close(), 500);
  } catch (_) {}
}

function buildDOM(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'cr-root';
  root.appendChild(Object.assign(document.createElement('div'), { className: 'cr-scanlines' }));
  root.appendChild(Object.assign(document.createElement('div'), { className: 'cr-vignette' }));

  const content = document.createElement('div');
  content.className = 'cr-content';
  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'cr-title',
      textContent: '< CREDITS />',
    }),
  );

  const madeBy = document.createElement('div');
  madeBy.className = 'cr-section';
  Object.assign(document.createElement('div'), {
    className: 'cr-label',
    textContent: 'GAME DESIGN & CODE',
  });
  const mbl = document.createElement('div');
  mbl.className = 'cr-label';
  mbl.style.color = 'var(--color-dim)';
  mbl.textContent = 'GAME DESIGN & CODE';
  const mbv = document.createElement('div');
  mbv.className = 'cr-value';
  mbv.style.color = 'var(--color-green)';
  mbv.style.fontSize = '14px';
  mbv.textContent = 'RICCARDO CANELLA';
  madeBy.appendChild(mbl);
  madeBy.appendChild(mbv);
  content.appendChild(madeBy);

  const tech = document.createElement('div');
  tech.className = 'cr-section';
  const tl = document.createElement('div');
  tl.className = 'cr-label';
  tl.style.color = 'var(--color-yellow)';
  tl.textContent = 'POWERED BY';
  const tlist = document.createElement('ul');
  tlist.className = 'cr-tech-list';
  TECH_STACK_ITEMS.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    tlist.appendChild(li);
  });
  tech.appendChild(tl);
  tech.appendChild(tlist);
  content.appendChild(tech);

  content.appendChild(
    Object.assign(document.createElement('p'), {
      className: 'cr-sep',
      textContent: '\u2500'.repeat(40),
    }),
  );

  const disc = document.createElement('div');
  disc.className = 'cr-section';
  const dt = document.createElement('div');
  dt.className = 'cr-disclaimer-title';
  dt.textContent = '\u26A0  AVVISO LEGALE  \u26A0';
  const db = document.createElement('div');
  db.className = 'cr-disclaimer-box';
  const st = document.createElement('div');
  st.className = 'cr-scroll-text';
  const dp = document.createElement('p');
  dp.innerHTML = DISCLAIMER_HTML;
  st.appendChild(dp);
  db.appendChild(st);
  disc.appendChild(dt);
  disc.appendChild(db);
  content.appendChild(disc);

  _eggEl = document.createElement('div');
  _eggEl.className = 'cr-egg';
  const ea = document.createElement('pre');
  ea.className = 'cr-egg-ascii';
  ea.textContent = EASTER_EGG_ASCII;
  const ef = document.createElement('div');
  ef.className = 'cr-egg-found';
  ef.textContent = "\uD83D\uDC23 HAI TROVATO L'EASTER EGG! \uD83D\uDC23";
  const es1 = document.createElement('div');
  es1.className = 'cr-egg-sub1';
  es1.textContent = 'TONY APPREZZEREBBE.';
  const es2 = document.createElement('div');
  es2.className = 'cr-egg-sub2';
  es2.textContent = '(O FORSE NO. MA ALMENO CI HAI PROVATO.)';
  _eggEl.appendChild(ea);
  _eggEl.appendChild(ef);
  _eggEl.appendChild(es1);
  _eggEl.appendChild(es2);
  content.appendChild(_eggEl);

  content.appendChild(
    Object.assign(document.createElement('p'), {
      className: 'cr-sep',
      textContent: '\u2500'.repeat(40),
    }),
  );

  const art = document.createElement('article');
  art.className = 'cr-seo-article';
  const h2p = document.createElement('h2');
  h2p.style.color = 'var(--color-cyan)';
  h2p.textContent = 'IL PROGETTO';
  const pp = document.createElement('p');
  pp.textContent =
    'InvaderTony \u00E8 un gioco arcade browser sviluppato da Riccardo Canella come esperimento creativo con Claude AI di Anthropic.';
  const h2t = document.createElement('h2');
  h2t.style.color = 'var(--color-yellow)';
  h2t.textContent = 'TECNOLOGIA';
  const pt = document.createElement('p');
  pt.textContent = 'Three.js, Vite, GLSL shaders, Web Audio API, TypeScript — zero framework.';
  const h2i = document.createElement('h2');
  h2i.style.color = 'var(--color-magenta)';
  h2i.textContent = 'ISPIRAZIONE';
  const pi = document.createElement('p');
  pi.textContent =
    'Un tributo goliardico a TonyPitony. Non commerciale, distribuito gratuitamente.';
  art.appendChild(h2p);
  art.appendChild(pp);
  art.appendChild(h2t);
  art.appendChild(pt);
  art.appendChild(h2i);
  art.appendChild(pi);
  content.appendChild(art);

  const btns = document.createElement('div');
  btns.className = 'cr-buttons';
  const back = document.createElement('button');
  back.className = 'cr-btn';
  back.textContent = '\u25BA BACK TO MENU';
  back.addEventListener('click', () => navigate('/home'));
  const play = document.createElement('button');
  play.className = 'cr-btn';
  play.textContent = '\u25BA PLAY AGAIN';
  play.addEventListener('click', () => navigate('/game'));
  btns.appendChild(back);
  btns.appendChild(play);
  content.appendChild(btns);

  root.appendChild(content);
  return root;
}

export function mount(container: HTMLElement): void {
  _container = container;
  _eggEl = null;
  _styleEl = injectStyle(styles);
  _root = buildDOM();
  _container.appendChild(_root);

  const seoScript = document.createElement('script');
  seoScript.type = 'application/ld+json';
  seoScript.id = 'credits-schema';
  seoScript.textContent = JSON.stringify(PERSON_SCHEMA);
  document.head.appendChild(seoScript);

  _removeKey = listenKonami(() => {
    playKonamiSound();
    if (_eggEl) _eggEl.style.display = 'block';
  });
}

export function unmount(): void {
  _removeKey?.();
  _removeKey = null;
  if (_root && _container) _container.removeChild(_root);
  document.getElementById('credits-schema')?.remove();
  _root = null;
  _container = null;
  _eggEl = null;
  removeStyle(_styleEl);
  _styleEl = null;
}

export const CreditsPage = { mount, unmount };
