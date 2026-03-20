/**
 * Landing page — modern editorial entry point at "/".
 * Marketing page for InvaderTony. NOT the arcade screen (that's /home).
 */

import { navigate }  from '../router.js';
import { getScores } from '../services/leaderboard.js';

const STYLE_ID = 'landing-page-styles';

/** @type {HTMLElement | null} */
let root = null;
/** @type {HTMLElement | null} */
let _container = null;
/** @type {IntersectionObserver | null} */
let _observer = null;

// Saved overflow state to restore on unmount
let _savedBodyOverflow   = '';
let _savedHtmlOverflow   = '';
let _savedAppHeight      = '';

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    :root {
      --bg:             #0a0a0f;
      --bg2:            #0f0f18;
      --accent-cyan:    #00ffff;
      --accent-magenta: #ff00ff;
      --accent-yellow:  #ffff00;
      --accent-green:   #39ff14;
      --text:           #e8e8f0;
      --text-dim:       #6a6a8a;
      --border:         rgba(255,255,255,0.08);
    }

    @keyframes lp-fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes lp-fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes lp-driftA {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(40px, 30px); }
    }
    @keyframes lp-driftB {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(-50px, 20px); }
    }
    @keyframes lp-driftC {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(30px, -40px); }
    }
    @keyframes lp-bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(8px); }
    }
    @keyframes lp-flicker {
      0%, 19%, 21%, 100% { opacity: 1; }
      20%                { opacity: 0; }
    }

    .lp-root {
      background: var(--bg);
      color: var(--text);
      font-family: 'Space Mono', monospace;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ── Scroll animations ── */
    .animate-in {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .animate-in.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Section label ── */
    .lp-section-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      letter-spacing: 0.2em;
      margin-bottom: 48px;
      text-align: center;
      display: block;
    }

    /* ──────────── HERO ──────────── */
    .lp-hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 0 20px;
    }

    .lp-blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .lp-blob-a {
      width: 600px; height: 600px;
      top: -150px; left: -150px;
      background: radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%);
      animation: lp-driftA 15s ease-in-out infinite alternate;
    }
    .lp-blob-b {
      width: 700px; height: 700px;
      bottom: -200px; right: -200px;
      background: radial-gradient(circle, rgba(255,0,255,0.05) 0%, transparent 70%);
      animation: lp-driftB 18s ease-in-out infinite alternate;
    }
    .lp-blob-c {
      width: 500px; height: 500px;
      top: 30%; right: 10%;
      background: radial-gradient(circle, rgba(255,255,0,0.04) 0%, transparent 70%);
      animation: lp-driftC 12s ease-in-out infinite alternate;
    }

    .lp-hero-scanlines {
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(
        0deg,
        transparent, transparent 2px,
        rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px
      );
      pointer-events: none;
    }

    .lp-hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      width: 100%;
      text-align: center;
    }

    .lp-badge {
      display: inline-block;
      border: 1px solid var(--accent-cyan);
      color: var(--accent-cyan);
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      padding: 6px 14px;
      border-radius: 2px;
      letter-spacing: 0.1em;
      margin-bottom: 32px;
      animation: lp-fadeInDown 0.6s ease 0.2s both;
    }

    .lp-hero-title {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(36px, 8vw, 88px);
      line-height: 1.2;
      margin: 0 0 24px;
      animation: lp-fadeInUp 0.8s ease 0.3s both;
    }
    .lp-hero-title .line1 {
      display: block;
      color: var(--accent-cyan);
      text-shadow: 0 0 40px rgba(0,255,255,0.4);
    }
    .lp-hero-title .line2 {
      display: block;
      color: var(--accent-magenta);
      text-shadow: 0 0 40px rgba(255,0,255,0.4);
    }

    .lp-hero-subtitle {
      font-size: clamp(14px, 2vw, 18px);
      color: var(--text);
      max-width: 480px;
      margin: 0 auto 40px;
      line-height: 1.7;
      animation: lp-fadeInUp 0.8s ease 0.5s both;
    }

    .lp-hero-ctas {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      animation: lp-fadeInUp 0.8s ease 0.7s both;
    }

    .lp-btn-primary {
      background: var(--accent-cyan);
      color: #000;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 16px 32px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      box-shadow: 0 0 24px rgba(0,255,255,0.35);
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      letter-spacing: 0.05em;
    }
    .lp-btn-primary:hover {
      box-shadow: 0 0 48px rgba(0,255,255,0.6);
      transform: translateY(-2px);
    }

    .lp-btn-secondary {
      background: transparent;
      border: 2px solid var(--border);
      color: var(--text-dim);
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      padding: 16px 28px;
      border-radius: 2px;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .lp-btn-secondary:hover {
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }

    .lp-scroll-hint {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--text-dim);
      font-size: 9px;
      letter-spacing: 0.12em;
      pointer-events: none;
    }
    .lp-scroll-hint .arrow {
      font-size: 18px;
      animation: lp-bounce 1.5s ease-in-out infinite;
    }

    /* ──────────── PREVIEW ──────────── */
    .lp-preview {
      background: var(--bg2);
      padding: 100px 20px;
    }

    .lp-preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      max-width: 960px;
      margin: 0 auto;
      align-items: center;
    }

    .lp-preview-frame {
      border: 1px solid var(--border);
      border-radius: 4px;
      aspect-ratio: 16/9;
      background: #000;
      overflow: hidden;
      position: relative;
      box-shadow: 0 0 0 1px rgba(0,255,255,0.15), 0 0 40px rgba(0,255,255,0.05);
    }
    .lp-preview-frame img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .lp-preview-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .lp-preview-placeholder span:first-child {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: var(--text-dim);
    }
    .lp-preview-placeholder span:last-child {
      font-size: 9px;
      color: var(--text-dim);
      opacity: 0.5;
    }

    .lp-features-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 13px;
      color: var(--text);
      margin: 0 0 32px;
    }

    .lp-feature {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .lp-feature-icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
    .lp-feature-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 9px;
      margin: 0 0 6px;
    }
    .lp-feature-text {
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.7;
      margin: 0;
    }

    /* ──────────── HOW TO PLAY ──────────── */
    .lp-howto {
      background: var(--bg);
      padding: 100px 20px;
    }

    .lp-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      max-width: 800px;
      margin: 0 auto 32px;
    }

    .lp-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 24px;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .lp-card:hover {
      border-color: rgba(0,255,255,0.25);
      background: rgba(0,255,255,0.02);
    }
    .lp-card-icon {
      font-family: 'Press Start 2P', monospace;
      display: block;
      margin-bottom: 12px;
    }
    .lp-card-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      color: var(--text);
      margin: 0 0 8px;
    }
    .lp-card-text {
      font-size: 11px;
      color: var(--text-dim);
      line-height: 1.7;
      margin: 0;
    }

    .lp-icon-flicker { animation: lp-flicker 3s ease-in-out infinite; }

    /* ──────────── LEADERBOARD ──────────── */
    .lp-leaderboard {
      background: var(--bg2);
      padding: 100px 20px;
      text-align: center;
    }

    .lp-lb-subtitle {
      font-size: 13px;
      color: var(--text-dim);
      margin: -32px 0 48px;
      letter-spacing: 0.08em;
    }

    .lp-podium {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .lp-podium-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 28px 24px;
      text-align: center;
      min-width: 160px;
    }
    .lp-podium-card.rank-1 {
      border-color: rgba(255,215,0,0.3);
      box-shadow: 0 0 24px rgba(255,215,0,0.08);
    }

    .lp-podium-rank {
      font-family: 'Press Start 2P', monospace;
      font-size: 22px;
    }
    .lp-podium-name {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: var(--text);
      margin-top: 12px;
    }
    .lp-podium-score {
      font-size: 16px;
      color: var(--accent-cyan);
      margin-top: 8px;
    }

    .lp-empty-scores {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: var(--text-dim);
      line-height: 2;
      margin-bottom: 32px;
    }

    /* ──────────── LINK ──────────── */
    .lp-link {
      display: inline-block;
      font-size: 12px;
      color: var(--accent-cyan);
      cursor: pointer;
      letter-spacing: 0.08em;
      text-align: center;
      background: none;
      border: none;
      font-family: 'Space Mono', monospace;
      padding: 0;
    }
    .lp-link:hover { text-decoration: underline; }

    /* ──────────── FOOTER ──────────── */
    .lp-footer {
      background: var(--bg);
      border-top: 1px solid var(--border);
      padding: 48px 20px;
      text-align: center;
    }

    .lp-footer-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: var(--text-dim);
    }
    .lp-footer-tagline {
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 8px;
    }
    .lp-footer-nav {
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    .lp-footer-nav button {
      background: none;
      border: none;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      color: var(--text-dim);
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }
    .lp-footer-nav button:hover { color: var(--accent-cyan); }
    .lp-copyright {
      font-size: 9px;
      color: var(--text-dim);
      margin-top: 16px;
    }

    /* ──────────── RESPONSIVE ──────────── */
    @media (max-width: 768px) {
      .lp-hero-title { font-size: clamp(28px, 10vw, 48px); }
      .lp-hero-ctas  { flex-direction: column; align-items: center; }
      .lp-btn-primary, .lp-btn-secondary { width: 100%; max-width: 280px; }
      .lp-preview-grid  { grid-template-columns: 1fr; }
      .lp-cards-grid    { grid-template-columns: 1fr; }
      .lp-podium        { flex-direction: column; align-items: center; }
      .lp-footer-nav    { flex-direction: column; gap: 12px; }
    }
  `;
  document.head.appendChild(s);
}

function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}

// ─── DOM builder ──────────────────────────────────────────────────────────────

function buildDOM() {
  const rootEl = document.createElement('div');
  rootEl.className = 'lp-root';

  rootEl.appendChild(buildHero());
  rootEl.appendChild(buildPreview());
  rootEl.appendChild(buildHowToPlay());
  rootEl.appendChild(buildLeaderboard());
  rootEl.appendChild(buildFooter());

  return rootEl;
}

// ── Section 1: Hero ──────────────────────────────────────────────────────────

function buildHero() {
  const hero = document.createElement('section');
  hero.className = 'lp-hero';

  const blobA = document.createElement('div');
  blobA.className = 'lp-blob lp-blob-a';
  const blobB = document.createElement('div');
  blobB.className = 'lp-blob lp-blob-b';
  const blobC = document.createElement('div');
  blobC.className = 'lp-blob lp-blob-c';

  const scanlines = document.createElement('div');
  scanlines.className = 'lp-hero-scanlines';

  const content = document.createElement('div');
  content.className = 'lp-hero-content';

  const badge = document.createElement('span');
  badge.className = 'lp-badge';
  badge.textContent = '\uD83D\uDD79 GIOCO ARCADE GRATUITO';

  const h1 = document.createElement('h1');
  h1.className = 'lp-hero-title';
  h1.innerHTML = '<span class="line1">INVADER</span><span class="line2">TONY</span>';

  const subtitle = document.createElement('p');
  subtitle.className = 'lp-hero-subtitle';
  subtitle.textContent = 'Spara a Tony Pitony prima che ti denunci.';

  const ctas = document.createElement('div');
  ctas.className = 'lp-hero-ctas';

  const playBtn = document.createElement('button');
  playBtn.className = 'lp-btn-primary';
  playBtn.textContent = '\u25BA GIOCA ORA';
  playBtn.addEventListener('click', () => navigate('/home'));

  const howBtn = document.createElement('button');
  howBtn.className = 'lp-btn-secondary';
  howBtn.textContent = 'COME SI GIOCA';
  howBtn.addEventListener('click', () => {
    document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' });
  });

  ctas.appendChild(playBtn);
  ctas.appendChild(howBtn);

  content.appendChild(badge);
  content.appendChild(h1);
  content.appendChild(subtitle);
  content.appendChild(ctas);

  const scrollHint = document.createElement('div');
  scrollHint.className = 'lp-scroll-hint';
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '\u2193';
  const scopri = document.createElement('span');
  scopri.textContent = 'SCOPRI';
  scrollHint.appendChild(arrow);
  scrollHint.appendChild(scopri);

  hero.appendChild(blobA);
  hero.appendChild(blobB);
  hero.appendChild(blobC);
  hero.appendChild(scanlines);
  hero.appendChild(content);
  hero.appendChild(scrollHint);

  return hero;
}

// ── Section 2: Preview ───────────────────────────────────────────────────────

function buildPreview() {
  const section = document.createElement('section');
  section.id = 'preview';
  section.className = 'lp-preview';

  const label = document.createElement('span');
  label.className = 'lp-section-label animate-in';
  label.style.color = 'var(--accent-yellow)';
  label.textContent = 'GAMEPLAY';

  const grid = document.createElement('div');
  grid.className = 'lp-preview-grid animate-in';

  // Left — preview frame
  const frame = document.createElement('div');
  frame.className = 'lp-preview-frame';

  const img = document.createElement('img');
  img.src = '/assets/gameplay.gif';
  img.alt = 'InvaderTony gameplay';
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;';

  const placeholder = document.createElement('div');
  placeholder.className = 'lp-preview-placeholder';
  const ph1 = document.createElement('span');
  ph1.textContent = '[ GAMEPLAY GIF ]';
  const ph2 = document.createElement('span');
  ph2.textContent = '\u2192 aggiungi /public/assets/gameplay.gif';
  placeholder.appendChild(ph1);
  placeholder.appendChild(ph2);

  img.onerror = () => {
    img.style.display = 'none';
    frame.appendChild(placeholder);
  };
  frame.appendChild(img);

  // Right — features
  const right = document.createElement('div');

  const featTitle = document.createElement('h2');
  featTitle.className = 'lp-features-title';
  featTitle.textContent = "CHE COS'\u00C8?";

  const features = [
    { icon: '\uD83D\uDC7E', color: 'var(--accent-cyan)',    title: '55 CLONI DI TONY',   text: '4 wave di nemici sempre pi\u00F9 agguerriti. Due tipi di Tony, velocit\u00E0 crescente.' },
    { icon: '\u26A1',       color: 'var(--accent-magenta)', title: 'BOSS FIGHT FINALE',  text: 'Tony Pitony in persona. 3 fasi. Cita le sue canzoni mentre ti spara addosso.' },
    { icon: '\uD83C\uDFAE', color: 'var(--accent-yellow)',  title: 'MOTORE 3D + SHADERS', text: 'Three.js, GLSL shaders, effetti CRT, shockwave, starfield procedurale.' },
  ];

  right.appendChild(featTitle);
  features.forEach(({ icon, color, title, text }) => {
    const feat = document.createElement('div');
    feat.className = 'lp-feature animate-in';

    const iconEl = document.createElement('span');
    iconEl.className = 'lp-feature-icon';
    iconEl.textContent = icon;

    const body = document.createElement('div');
    const titleEl = document.createElement('p');
    titleEl.className = 'lp-feature-title';
    titleEl.style.color = color;
    titleEl.textContent = title;

    const textEl = document.createElement('p');
    textEl.className = 'lp-feature-text';
    textEl.textContent = text;

    body.appendChild(titleEl);
    body.appendChild(textEl);
    feat.appendChild(iconEl);
    feat.appendChild(body);
    right.appendChild(feat);
  });

  grid.appendChild(frame);
  grid.appendChild(right);

  section.appendChild(label);
  section.appendChild(grid);

  return section;
}

// ── Section 3: How to play ───────────────────────────────────────────────────

function buildHowToPlay() {
  const section = document.createElement('section');
  section.id = 'how-to-play';
  section.className = 'lp-howto';

  const label = document.createElement('span');
  label.className = 'lp-section-label animate-in';
  label.style.color = 'var(--accent-green)';
  label.textContent = 'COME SI GIOCA';

  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'lp-cards-grid';

  const cards = [
    { icon: '\u2190 \u2192', iconSize: '16px', iconColor: 'var(--accent-cyan)',    title: 'MUOVITI', text: 'Frecce sinistra/destra o A/D' },
    { icon: 'SPACE',         iconSize: '10px', iconColor: 'var(--accent-yellow)',  title: 'SPARA',   text: 'Barra spaziatrice per sparare' },
    { icon: '\u00D74',       iconSize: '18px', iconColor: 'var(--accent-magenta)', title: '4 WAVE',  text: 'Difficolt\u00E0 crescente, pi\u00F9 nemici elite' },
    { icon: '!',             iconSize: '24px', iconColor: 'var(--accent-green)',   title: 'BOSS',    text: 'Tony Pitony in persona \u2014 25 HP, 3 fasi', flicker: true },
  ];

  cards.forEach(({ icon, iconSize, iconColor, title, text, flicker }) => {
    const card = document.createElement('div');
    card.className = 'lp-card animate-in';

    const iconEl = document.createElement('span');
    iconEl.className = 'lp-card-icon' + (flicker ? ' lp-icon-flicker' : '');
    iconEl.style.cssText = `font-size: ${iconSize}; color: ${iconColor};`;
    iconEl.textContent = icon;

    const titleEl = document.createElement('p');
    titleEl.className = 'lp-card-title';
    titleEl.textContent = title;

    const textEl = document.createElement('p');
    textEl.className = 'lp-card-text';
    textEl.textContent = text;

    card.appendChild(iconEl);
    card.appendChild(titleEl);
    card.appendChild(textEl);
    cardsGrid.appendChild(card);
  });

  const guideLink = document.createElement('button');
  guideLink.className = 'lp-link animate-in';
  guideLink.style.display = 'block';
  guideLink.style.margin = '32px auto 0';
  guideLink.textContent = 'INIZIA A GIOCARE \u2192';
  guideLink.addEventListener('click', () => navigate('/home'));

  section.appendChild(label);
  section.appendChild(cardsGrid);
  section.appendChild(guideLink);

  return section;
}

// ── Section 4: Leaderboard preview ──────────────────────────────────────────

function buildLeaderboard() {
  const section = document.createElement('section');
  section.className = 'lp-leaderboard';

  const label = document.createElement('span');
  label.className = 'lp-section-label animate-in';
  label.style.color = 'var(--accent-yellow)';
  label.textContent = 'HALL OF FAME';

  const subtitle = document.createElement('p');
  subtitle.className = 'lp-lb-subtitle animate-in';
  subtitle.textContent = 'I MIGLIORI TONY SLAYERS';

  const scores = getScores().slice(0, 3);
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  let scoresEl;
  if (scores.length === 0) {
    scoresEl = document.createElement('p');
    scoresEl.className = 'lp-empty-scores animate-in';
    scoresEl.textContent = 'ANCORA NESSUN PUNTEGGIO\nSII IL PRIMO!';
  } else {
    scoresEl = document.createElement('div');
    scoresEl.className = 'lp-podium animate-in';
    scores.forEach((entry, i) => {
      const card = document.createElement('div');
      card.className = 'lp-podium-card' + (i === 0 ? ' rank-1' : '');

      const rank = document.createElement('div');
      rank.className = 'lp-podium-rank';
      rank.style.color = rankColors[i] || 'var(--text-dim)';
      rank.textContent = `#${i + 1}`;

      const name = document.createElement('div');
      name.className = 'lp-podium-name';
      name.textContent = entry.name.slice(0, 8).toUpperCase();

      const score = document.createElement('div');
      score.className = 'lp-podium-score';
      score.textContent = String(entry.score).padStart(6, '0');

      card.appendChild(rank);
      card.appendChild(name);
      card.appendChild(score);
      scoresEl.appendChild(card);
    });
  }

  const lbLink = document.createElement('button');
  lbLink.className = 'lp-link animate-in';
  lbLink.textContent = 'TUTTA LA CLASSIFICA \u2192';
  lbLink.addEventListener('click', () => navigate('/leaderboard'));

  section.appendChild(label);
  section.appendChild(subtitle);
  section.appendChild(scoresEl);
  section.appendChild(lbLink);

  return section;
}

// ── Section 5: Footer ────────────────────────────────────────────────────────

function buildFooter() {
  const footer = document.createElement('footer');
  footer.className = 'lp-footer';

  const title = document.createElement('div');
  title.className = 'lp-footer-title';
  title.textContent = 'INVADER TONY';

  const tagline = document.createElement('p');
  tagline.className = 'lp-footer-tagline';
  tagline.textContent = 'FATTO CON \u2665 E TANTA PAURA DI ESSERE DENUNCIATO';

  const nav = document.createElement('nav');
  nav.className = 'lp-footer-nav';

  const navItems = [
    { label: 'GIOCA',           path: '/home' },
    { label: 'CLASSIFICA',      path: '/leaderboard' },
    { label: 'COME SI GIOCA',   path: '/home' },
    { label: 'CREDITS',         path: '/credits' },
  ];

  navItems.forEach(({ label, path }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', () => navigate(path));
    nav.appendChild(btn);
  });

  const copy = document.createElement('p');
  copy.className = 'lp-copyright';
  copy.textContent = '\u00A9 2025 RICCARDO CANELLA';

  footer.appendChild(title);
  footer.appendChild(tagline);
  footer.appendChild(nav);
  footer.appendChild(copy);

  return footer;
}

// ─── Intersection observer ────────────────────────────────────────────────────

function startObserver(rootEl) {
  _observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          _observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  rootEl.querySelectorAll('.animate-in').forEach(el => _observer.observe(el));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;

  // Allow scrolling — override global overflow:hidden
  _savedBodyOverflow = document.body.style.overflow;
  _savedHtmlOverflow = document.documentElement.style.overflow;
  _savedAppHeight    = container.style.height;

  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
  container.style.height = 'auto';

  injectStyles();
  root = buildDOM();
  _container.appendChild(root);
  startObserver(root);
}

export function unmount() {
  _observer?.disconnect();
  _observer = null;

  // Restore scroll state
  document.body.style.overflow = _savedBodyOverflow;
  document.documentElement.style.overflow = _savedHtmlOverflow;
  if (_container) _container.style.height = _savedAppHeight;

  if (root && _container) _container.removeChild(root);
  root = null;
  _container = null;

  removeStyles();
}

export const LandingPage = { mount, unmount };
