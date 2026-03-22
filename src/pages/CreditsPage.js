/**
 * Credits page — arcade-aesthetic scrolling credits with legal disclaimer.
 */

import { navigate } from '../router.js';
import styles from './CreditsPage.css?inline';
import { TECH_STACK_ITEMS, EASTER_EGG_ASCII, DISCLAIMER_HTML, PERSON_SCHEMA } from './content/creditsContent.js';
import { injectStyle, removeStyle } from '../utils/dom.js';
import { listenKonami } from '../utils/konamiCode.js';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {(() => void) | null} */
let _removeKey = null;
/** @type {HTMLStyleElement | null} */
let _styleEl = null;

/** @type {HTMLElement | null} */
let easterEggEl = null;

function playKonamiSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = [523, 659, 784];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.08);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.08);
    });
    setTimeout(() => ctx.close(), 500);
  } catch (_) {}
}

function revealEasterEgg() {
  if (!easterEggEl) return;
  easterEggEl.style.display = 'block';
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM() {
  const rootEl = document.createElement('div');
  rootEl.className = 'cr-root';

  // Overlays
  const scanlines = document.createElement('div');
  scanlines.className = 'cr-scanlines';

  const vignette = document.createElement('div');
  vignette.className = 'cr-vignette';

  const content = document.createElement('div');
  content.className = 'cr-content';

  // ── A: Title ──
  const title = document.createElement('div');
  title.className = 'cr-title';
  title.textContent = '< CREDITS />';
  content.appendChild(title);

  // ── B: Made by ──
  const madeBy = document.createElement('div');
  madeBy.className = 'cr-section';

  const madeByLabel = document.createElement('div');
  madeByLabel.className = 'cr-label';
  madeByLabel.style.color = 'var(--color-dim)';
  madeByLabel.textContent = 'GAME DESIGN & CODE';

  const madeByValue = document.createElement('div');
  madeByValue.className = 'cr-value';
  madeByValue.style.color = 'var(--color-green)';
  madeByValue.style.fontSize = '14px';
  madeByValue.textContent = 'RICCARDO CANELLA';

  madeBy.appendChild(madeByLabel);
  madeBy.appendChild(madeByValue);
  content.appendChild(madeBy);

  // ── C: Tech stack ──
  const tech = document.createElement('div');
  tech.className = 'cr-section';

  const techLabel = document.createElement('div');
  techLabel.className = 'cr-label';
  techLabel.style.color = 'var(--color-yellow)';
  techLabel.textContent = 'POWERED BY';

  const techList = document.createElement('ul');
  techList.className = 'cr-tech-list';
  TECH_STACK_ITEMS.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    techList.appendChild(li);
  });

  tech.appendChild(techLabel);
  tech.appendChild(techList);
  content.appendChild(tech);

  // ── D: Separator ──
  const sep = document.createElement('p');
  sep.className = 'cr-sep';
  sep.textContent = '\u2500'.repeat(40);
  content.appendChild(sep);

  // ── E: Disclaimer ──
  const disclaimerSection = document.createElement('div');
  disclaimerSection.className = 'cr-section';

  const disclaimerTitle = document.createElement('div');
  disclaimerTitle.className = 'cr-disclaimer-title';
  disclaimerTitle.textContent = '\u26A0  AVVISO LEGALE  \u26A0';

  const disclaimerBox = document.createElement('div');
  disclaimerBox.className = 'cr-disclaimer-box';

  const scrollText = document.createElement('div');
  scrollText.className = 'cr-scroll-text';

  const disclaimerP = document.createElement('p');
  disclaimerP.innerHTML = DISCLAIMER_HTML;

  scrollText.appendChild(disclaimerP);
  disclaimerBox.appendChild(scrollText);

  disclaimerSection.appendChild(disclaimerTitle);
  disclaimerSection.appendChild(disclaimerBox);
  content.appendChild(disclaimerSection);

  // ── F: Easter egg ──
  easterEggEl = document.createElement('div');
  easterEggEl.className = 'cr-egg';

  const eggAscii = document.createElement('pre');
  eggAscii.className = 'cr-egg-ascii';
  eggAscii.textContent = EASTER_EGG_ASCII;

  const eggFound = document.createElement('div');
  eggFound.className = 'cr-egg-found';
  eggFound.textContent = '\uD83D\uDC23 HAI TROVATO L\'EASTER EGG! \uD83D\uDC23';

  const eggSub1 = document.createElement('div');
  eggSub1.className = 'cr-egg-sub1';
  eggSub1.textContent = 'TONY APPREZZEREBBE.';

  const eggSub2 = document.createElement('div');
  eggSub2.className = 'cr-egg-sub2';
  eggSub2.textContent = '(O FORSE NO. MA ALMENO CI HAI PROVATO.)';

  easterEggEl.appendChild(eggAscii);
  easterEggEl.appendChild(eggFound);
  easterEggEl.appendChild(eggSub1);
  easterEggEl.appendChild(eggSub2);
  content.appendChild(easterEggEl);

  // ── F2: SEO content block ──
  const seoSep = document.createElement('p');
  seoSep.className = 'cr-sep';
  seoSep.textContent = '\u2500'.repeat(40);
  content.appendChild(seoSep);

  const article = document.createElement('article');
  article.className = 'cr-seo-article';

  const h2Project = document.createElement('h2');
  h2Project.style.color = 'var(--color-cyan)';
  h2Project.textContent = 'IL PROGETTO';

  const pProject = document.createElement('p');
  pProject.textContent = 'InvaderTony \u00E8 un gioco arcade browser sviluppato da Riccardo Canella come esperimento creativo con Claude AI di Anthropic. Il progetto esplora le possibilit\u00E0 di sviluppo assistito da intelligenza artificiale applicato al game development con Three.js e GLSL shaders.';

  const h2Tech = document.createElement('h2');
  h2Tech.style.color = 'var(--color-yellow)';
  h2Tech.textContent = 'TECNOLOGIA';

  const pTech = document.createElement('p');
  pTech.innerHTML = 'Il gioco \u00E8 costruito interamente con tecnologie web standard: Three.js per il motore 3D e gli shader GLSL, Vite come build tool, Web Audio API per l\u2019audio procedurale, vanilla JavaScript senza framework. Il codice sorgente \u00E8 open source e disponibile su <a href="#" target="_blank" rel="noopener">GitHub</a>.';

  const h2Insp = document.createElement('h2');
  h2Insp.style.color = 'var(--color-magenta)';
  h2Insp.textContent = 'ISPIRAZIONE';

  const pInsp = document.createElement('p');
  pInsp.textContent = 'InvaderTony \u00E8 un tributo goliardico a TonyPitony, cantautore siciliano noto per il suo stile provocatorio, la maschera da Elvis e i testi irriverenti. Il gioco non ha scopo commerciale ed \u00E8 distribuito gratuitamente.';

  article.appendChild(h2Project);
  article.appendChild(pProject);
  article.appendChild(h2Tech);
  article.appendChild(pTech);
  article.appendChild(h2Insp);
  article.appendChild(pInsp);
  content.appendChild(article);

  // ── G: Buttons ──
  const buttons = document.createElement('div');
  buttons.className = 'cr-buttons';

  const backBtn = document.createElement('button');
  backBtn.className = 'cr-btn';
  backBtn.textContent = '\u25BA BACK TO MENU';
  backBtn.addEventListener('click', () => navigate('/home'));

  const playBtn = document.createElement('button');
  playBtn.className = 'cr-btn';
  playBtn.textContent = '\u25BA PLAY AGAIN';
  playBtn.addEventListener('click', () => navigate('/game'));

  buttons.appendChild(backBtn);
  buttons.appendChild(playBtn);
  content.appendChild(buttons);

  rootEl.appendChild(scanlines);
  rootEl.appendChild(vignette);
  rootEl.appendChild(content);

  return rootEl;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;
  easterEggEl = null;

  _styleEl = injectStyle(styles);
  root = buildDOM();
  _container.appendChild(root);

  // JSON-LD Person schema
  const seoScript = document.createElement('script');
  seoScript.type = 'application/ld+json';
  seoScript.id = 'credits-schema';
  seoScript.textContent = JSON.stringify(PERSON_SCHEMA);
  document.head.appendChild(seoScript);

  _removeKey = listenKonami(() => { playKonamiSound(); revealEasterEgg(); });
}

export function unmount() {
  if (_removeKey) _removeKey();
  if (root && _container) _container.removeChild(root);
  document.getElementById('credits-schema')?.remove();
  root = null;
  _container = null;
  easterEggEl = null;
  removeStyle(_styleEl);
  _styleEl = null;
}

export const CreditsPage = { mount, unmount };
