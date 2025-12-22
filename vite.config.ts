import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/hanabi/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fireworkTypes: resolve(__dirname, 'pages/firework-types/index.html'),
        audioAnalyzer: resolve(__dirname, 'pages/audio-analyzer/index.html'),
        particlePhysics: resolve(__dirname, 'pages/particle-physics/index.html'),
        rendererDebug: resolve(__dirname, 'pages/renderer-debug/index.html'),
        launcherTest: resolve(__dirname, 'pages/launcher-test/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
