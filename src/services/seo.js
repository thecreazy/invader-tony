/**
 * SEO metadata service.
 * Updates document title, meta description, OG tags, and canonical link
 * on every route change. Single source of truth for page-level SEO.
 */

/** @typedef {{ title: string, description: string, canonical: string }} PageMeta */

/** @type {Record<string, PageMeta>} */
const PAGE_META = {
  '/': {
    title: 'InvaderTony — Gioco Arcade Gratuito | Tributo a TonyPitony',
    description: 'Spara a Tony Pitony prima che mi denunci. Gioco arcade gratuito nel browser: 4 wave di nemici, boss fight finale, shaders GLSL e audio procedurale. Fatto con Three.js.',
    canonical: 'https://invadertony.vercel.app/',
  },
  '/home': {
    title: 'InvaderTony — Gioco Arcade Browser',
    description: 'Un gioco arcade in tributo a Tony Pitony. Quattro ondate di nemici, un boss finale a tre fasi e shaders CRT old-school. Gioca gratis nel browser.',
    canonical: 'https://invadertony.vercel.app/home',
  },
  '/game': {
    title: 'Gioca — InvaderTony',
    description: 'Gioca a InvaderTony: un clone di Space Invaders con shaders GLSL, audio procedurale, dissolve effects e boss finale a tre fasi. Zero framework, puro Three.js.',
    canonical: 'https://invadertony.vercel.app/game',
  },
  '/end': {
    title: 'Game Over — InvaderTony',
    description: 'Salva il tuo punteggio e sfida la leaderboard di InvaderTony. Gioco arcade browser dedicato a Tony Pitony.',
    canonical: 'https://invadertony.vercel.app/end',
  },
  '/leaderboard': {
    title: 'High Scores — InvaderTony',
    description: 'I migliori punteggi di InvaderTony. Scala la leaderboard e sfida i campioni del gioco arcade dedicato a Tony Pitony.',
    canonical: 'https://invadertony.vercel.app/leaderboard',
  },
  '/credits': {
    title: 'Credits — InvaderTony | Riccardo Canella Developer',
    description: 'Chi ha fatto InvaderTony: Riccardo Canella, sviluppatore web. Progetto open source realizzato con Three.js, GLSL shaders e Claude AI di Anthropic. Tributo a TonyPitony.',
    canonical: 'https://invadertony.vercel.app/credits',
  },
};

/**
 * Updates all page-level SEO tags for the given pathname.
 * @param {string} pathname
 */
export function updateMeta(pathname) {
  const meta = PAGE_META[pathname] ?? PAGE_META['/'];

  document.title = meta.title;

  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', meta.description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', meta.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', meta.description);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonical;
}
