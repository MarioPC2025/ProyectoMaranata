import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // En desarrollo, /api lo atiende wrangler (npm run dev:api) con las Pages Functions
    proxy: { '/api': 'http://localhost:8788' },
  },
  test: {
    include: ['src/**/*.test.ts', 'servidor/**/*.test.ts'],
  },
})
