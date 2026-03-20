import { defineConfig }    from 'vite';
import { fileURLToPath }   from 'url';
import { dirname, resolve } from 'path';
import glsl from 'vite-plugin-glsl';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
  plugins: [
    glsl({
      include: ['**/*.vert', '**/*.frag', '**/*.glsl'],
      compress: false,
    }),
  ],
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ogg', '**/*.mp3', '**/*.wav'],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
  server: {
    port: 4000,
    historyApiFallback: {
      rewrites: [
        { from: /^\/(home|game|end|credits|leaderboard)(\/.*)?$/, to: '/app.html' },
        { from: /^\/how-to-play$/,        to: '/how-to-play.html' },
        { from: /^\/leaderboard-public$/, to: '/leaderboard-public.html' },
      ],
      index: '/index.html',
    },
  },
});
