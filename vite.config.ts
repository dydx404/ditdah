import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { PWA_BASE, PWA_INCLUDE_ASSETS, PWA_MANIFEST } from './src/app/pwa.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Served from a project subpath on GitHub Pages (dydx404.github.io/ditdah/);
  // dev/test stay at root.
  const base = mode === 'production' ? PWA_BASE : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        base,
        scope: PWA_BASE,
        registerType: 'autoUpdate',
        includeAssets: [...PWA_INCLUDE_ASSETS],
        manifest: PWA_MANIFEST,
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      // Pure core/* logic runs in node; component tests opt into jsdom via
      // a `// @vitest-environment jsdom` comment at the top of the file.
      environment: 'node',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/core/**/*.ts'],
      },
    },
  }
})
