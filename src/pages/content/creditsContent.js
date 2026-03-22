/**
 * Static content for CreditsPage.
 */

/** Tech stack items displayed in the credits */
export const TECH_STACK_ITEMS = [
  '\u25B8 THREE.JS \u2014 3D & SHADERS',
  '\u25B8 VITE \u2014 BUILD TOOL',
  '\u25B8 GLSL \u2014 SHADER MAGIC',
  '\u25B8 WEB AUDIO API \u2014 PROCEDURAL SOUNDS',
  '\u25B8 VANILLA JS \u2014 NO FRAMEWORKS WERE HARMED',
];

/** ASCII art easter egg block */
export const EASTER_EGG_ASCII = [
  '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588  \u2588\u2588 \u2588\u2588    \u2588\u2588',
  '  \u2588\u2588    \u2588\u2588    \u2588\u2588 \u2588\u2588\u2588\u2588 \u2588\u2588  \u2588\u2588  \u2588\u2588',
  '  \u2588\u2588    \u2588\u2588    \u2588\u2588 \u2588\u2588 \u2588\u2588\u2588\u2588   \u2588\u2588\u2588\u2588',
  '  \u2588\u2588     \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588   \u2588\u2588    \u2588\u2588',
].join('\n');

/** Scrolling disclaimer HTML content (innerHTML string) */
export const DISCLAIMER_HTML = [
  'TONY PITONY,',
  'PER FAVURI NON MI DENUNCIARE.',
  '<br><br>',
  'CHISTU JOCU \u00C8 SULU UN TRIBUTU,',
  'IO NON TENGO NIENTE.',
  '<br><br>',
  'AL MASSIMO TI POSSO DARI U CULU,',
  'MA NON LO DICIAMO A NISCIUNU.',
  '<br><br>',
  'TI GIURU CA TUTTU CHISTU',
  'LU FAZZU SULU PI GOLIARDIA.',
  'NON CI STAJU GUADAGNANDO UN EURO,',
  'ANZI SI VUOI TI PAGU NA BIRRA.',
  '<br><br>',
  'TORNU IN SICILIA SULU PI OFFRITILLA \u2014',
  'TE LO GIUROOOO, COMP\u00C0.',
  '<br><br>',
  '\u00C8 TUTTU GRATUITU.',
  'PURU U CODICI SORGENTI \u00C8 GRATIS',
  'E SI TROVA SU GITHUB:',
  '<br><br>',
  '<a href="#" target="_blank" rel="noopener">GITHUB — VIENI A GUARDARE</a>',
  '<br><br>',
  'VUOI LA BIRRA?',
  'SCRIVIMI:',
  '<br><br>',
  '<a href="#" target="_blank" rel="noopener">LINKEDIN</a>',
  '<br>',
  '<a href="#" target="_blank" rel="noopener">INSTAGRAM</a>',
  '<br><br>',
  'TI PREGU COMP\u00C0,',
  'NON MI DENUNCIARI... \uD83D\uDE4F',
].join('<br>');

/** JSON-LD Person schema for SEO */
export const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  'name': 'Riccardo Canella',
  'url': 'https://invadertony.vercel.app/credits',
  'sameAs': [
    'https://github.com/placeholder',
    'https://linkedin.com/in/placeholder',
    'https://instagram.com/placeholder',
  ],
  'knowsAbout': ['JavaScript', 'Three.js', 'GLSL', 'Game Development', 'Web Development'],
  'description': 'Sviluppatore web e game developer. Autore di InvaderTony, gioco arcade browser dedicato a TonyPitony.',
};
