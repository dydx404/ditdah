import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Served from a project subpath on GitHub Pages (dydx404.github.io/ditdah/);
  // dev/test stay at root.
  base: mode === 'production' ? '/ditdah/' : '/',
  plugins: [react(), tailwindcss()],
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
}))
