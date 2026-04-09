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
    '/credits':       'credits.html',
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
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks: {
          'three': ['three'],
          'game-engine': [
            './src/orchestration/GameOrchestrator.ts',
            './src/core/GameState.ts',
            './src/systems/CollisionSystem.ts',
            './src/systems/WaveManager.ts',
            './src/entities/PlayerEntity.ts',
            './src/entities/InvaderEntity.ts',
            './src/entities/BossEntity.ts',
            './src/entities/BulletPool.ts',
            './src/rendering/PostProcessor.ts',
          ],
          'game-systems': [
            './src/systems/AudioManager.ts',
            './src/systems/ChiptunePlayer.ts',
            './src/systems/InputManager.ts',
            './src/systems/ParticleSystem.ts',
            './src/background/BackgroundRenderer.ts',
          ],
        },
      },
    },
  },
  server: {
    port: 4000,
  },
});
