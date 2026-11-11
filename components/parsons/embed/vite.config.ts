// Builds <parsons-puzzle> into one ES module: site/static/embed/parsons.js (served by GitHub Pages).
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
  build: {
    lib: { entry: new URL('./index.ts', import.meta.url).pathname, formats: ['es'], fileName: () => 'parsons.js' },
    outDir: new URL('../../../site/static/embed/', import.meta.url).pathname,
    emptyOutDir: true,
    target: 'es2022',
  },
});
