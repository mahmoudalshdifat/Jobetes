import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    /**
     * Admin-console PWA. Same install-to-home-screen value as the doctor
     * portal but with a distinct identity (copper accent, gear icon).
     */
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Admin reads aggregate counts that may include PHI metadata —
            // always go to the network so we surface fresh state.
            urlPattern: /\/functions\/v1\/admin-summary/,
            handler: 'NetworkOnly',
          },
          {
            // Service-status pings are read-only liveness probes, can be
            // SWR cached briefly.
            urlPattern: /\/functions\/v1\/(?:health|doctor-profile|triage)/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        id: '/Jobetes/admin/',
        name: 'Jobetes Admin Console',
        short_name: 'Jobetes Admin',
        description: 'Internal system administration — controller-only',
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
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { port: 5175, host: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'] } } },
  },
});
