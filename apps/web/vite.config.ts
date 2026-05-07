import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'node:path';

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN ?? '';
const SENTRY_ORG = process.env.SENTRY_ORG ?? '';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT ?? '';

export default defineConfig({
  // VITE_BASE lets GitHub Pages deploy under /Jobetes/ without breaking dev.
  // Netlify deploy leaves it unset → falls back to '/'.
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    /**
     * Service Worker — offline-first shell for Jordanian patients on
     * spotty 4G. Caches the static assets + i18n bundle so the home
     * page renders even with no network. Patient-data routes
     * (/intake, /me/*) are NEVER cached — they must hit Supabase live
     * so we don't accidentally surface stale PHI.
     */
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'icon.svg',
        'icon-maskable.svg',
        'apple-touch-icon.svg',
      ],
      workbox: {
        // Cache app-shell assets aggressively
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Patient-data endpoints: NEVER cache. Static doctor profile +
        // health: cache with stale-while-revalidate so the page shows
        // last-known data on offline reload.
        runtimeCaching: [
          {
            urlPattern: /\/functions\/v1\/(?:health|doctor-profile)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jobetes-public-api',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Block caching of any patient-data endpoint outright
            urlPattern: /\/functions\/v1\/(?:intake|triage|me|admin-summary)/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        id: '/Jobetes/',
        name: 'Jobetes',
        short_name: 'Jobetes',
        description:
          'Cross-border telemedicine — Dr. Mahmoud Al-Shdaifat for patients in Jordan',
        theme_color: '#1B4D7A',
        background_color: '#F8F4EE',
        display: 'standalone',
        lang: 'ar',
        dir: 'rtl',
        // GH Pages serves under /Jobetes/ — start_url has to match
        start_url: process.env.VITE_BASE ?? '/',
        scope: process.env.VITE_BASE ?? '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
          },
          { src: 'favicon.ico', sizes: '64x64', type: 'image/x-icon' },
        ],
      },
      // Don't try to register the SW during dev — it interferes with HMR
      devOptions: { enabled: false },
    }),
    /**
     * Sentry source-map upload — runs only when SENTRY_AUTH_TOKEN is set
     * (production CI). Local + PR builds skip this entirely so the build
     * stays fast and offline-friendly.
     */
    SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT
      ? sentryVitePlugin({
          authToken: SENTRY_AUTH_TOKEN,
          org: SENTRY_ORG,
          project: SENTRY_PROJECT,
          telemetry: false,
          sourcemaps: {
            assets: ['./dist/**/*.{js,css}'],
            ignore: ['node_modules'],
          },
        })
      : null,
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
});
