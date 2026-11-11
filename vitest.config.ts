import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  // Component tests mount in jsdom and need Svelte's client build.
  resolve: { conditions: ['browser'] },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    include: ['components/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
