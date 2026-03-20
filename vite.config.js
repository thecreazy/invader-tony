import { defineConfig }    from 'vite';
import { fileURLToPath }   from 'url';
import { dirname, resolve } from 'path';
import glsl from 'vite-plugin-glsl';
import fs   from 'fs';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve specific public/ HTML files as static pages,
// bypassing Vite's SPA fallback middleware.
function staticPagesPlugin() {
  const staticRoutes = {
    '/':              'index.html',
    '/how-to-play':   'how-to-play.html',
    '/leaderboard':   'leaderboard.html',
  };

  return {
    name: 'static-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url.split('?')[0];
        const staticFile = staticRoutes[urlPath];
        if (staticFile) {
          const filePath = path.resolve(__dirname, 'public', staticFile);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(filePath, 'utf-8'));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    staticPagesPlugin(),
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
  },
});
