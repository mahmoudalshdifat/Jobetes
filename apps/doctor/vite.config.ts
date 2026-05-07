import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    /**
     * Doctor-portal PWA. Goal: install-to-home-screen on the doctor's
     * tablet/phone so the dashboard opens like a native app on rounds.
     *
     * Caching:
     *  - App shell precached (works offline for the doctor's own iPad)
     *  - Patient data (admin-summary) is NEVER cached — always live so
     *    the doctor never reads a stale queue.
     */
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // The doctor portal hits exactly one endpoint with PHI —
            // never cache it.
            urlPattern: /\/functions\/v1\/admin-summary/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        id: '/Jobetes/doctor/',
        name: 'Jobetes Doctor Portal',
        short_name: 'Jobetes Dr.',
        description: "Dr. Al-Shdaifat's clinical portal — internal use only",
        theme_color: '#0F1B2D',
        background_color: '#F8F4EE',
        display: 'standalone',
        lang: 'en',
        dir: 'ltr',
        start_url: process.env.VITE_BASE ?? '/',
        scope: process.env.VITE_BASE ?? '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: { port: 5174, host: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'] } },
    },
  },
});
