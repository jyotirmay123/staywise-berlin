import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createManifest } from './src/pwa/manifest.ts'

export default defineConfig(({ mode }) => {
  const base = mode === 'pages' ? '/staywise-berlin/apps/fitile/' : '/'
  return {
  base,
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'og.svg', 'offline.html'],
    manifest: createManifest(base),
    workbox: {
      navigateFallback: `${base}index.html`,
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      runtimeCaching: [{
        urlPattern: /^https:\/\/world\.openfoodfacts\.org\//,
        handler: 'CacheFirst',
        options: { cacheName: 'food-lookups', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 } },
      }],
    },
  })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    include: ['src/**/*.test.{ts,tsx}', 'supabase/**/*.test.ts'],
  },
  }
})
