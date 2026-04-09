// seo.ts: Updates document title, meta description, OG tags, and canonical link on every route change

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'InvaderTony — Gioco Arcade Gratuito | Tributo a TonyPitony',
    description: 'Spara a Tony Pitony prima che mi denunci.',
    canonical: 'https://invadertony.vercel.app/',
  },
  '/home': {
    title: 'InvaderTony — Gioco Arcade Browser',
    description: 'Un gioco arcade in tributo a Tony Pitony.',
    canonical: 'https://invadertony.vercel.app/home',
  },
  '/game': {
    title: 'Gioca — InvaderTony',
    description: 'Gioca a InvaderTony: un clone di Space Invaders con shaders GLSL.',
    canonical: 'https://invadertony.vercel.app/game',
  },
  '/end': {
    title: 'Game Over — InvaderTony',
    description: 'Salva il tuo punteggio e sfida la leaderboard.',
    canonical: 'https://invadertony.vercel.app/end',
  },
  '/leaderboard': {
    title: 'High Scores — InvaderTony',
    description: 'I migliori punteggi di InvaderTony.',
    canonical: 'https://invadertony.vercel.app/leaderboard',
  },
  '/credits': {
    title: 'Credits — InvaderTony | Riccardo Canella',
    description: 'Chi ha fatto InvaderTony.',
    canonical: 'https://invadertony.vercel.app/credits',
  },
};

export function updateMeta(pathname: string): void {
  const meta = PAGE_META[pathname] ?? PAGE_META['/'];
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute('content', meta.description);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonical;
}
