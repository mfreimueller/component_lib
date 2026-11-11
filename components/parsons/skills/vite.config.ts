// Bundles core/cli.ts (and the validator it uses) into one self-contained file for the skill:
//   npm run build:skill  ->  skills/create-puzzle-json/validate.mjs (kept out of the skill folder)
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: new URL('../core/cli.ts', import.meta.url).pathname,
    outDir: new URL('./create-puzzle-json/', import.meta.url).pathname,
    emptyOutDir: false,
    minify: false,
    target: 'node22',
    rollupOptions: { output: { entryFileNames: 'validate.mjs', banner: '#!/usr/bin/env node\n// GENERATED from components/parsons/core (npm run build:skill). Do not edit.' } },
  },
});
