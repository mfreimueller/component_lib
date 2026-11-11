import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// GitHub Pages serves the site under /component_lib, so CI builds with BASE_PATH=/component_lib.
const base = (process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')) as '' | `/${string}`;

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
      },
      adapter: adapter({ fallback: '404.html' }),
      paths: { base },
    }),
  ],
});
