import { defineConfig } from '@playwright/test';

// Smoke tests of the built site, served under the same base path as GitHub Pages.
// Build first: BASE_PATH=/component_lib npm run build
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173/component_lib/',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
  },
  webServer: {
    command: 'npm run preview -w site -- --port 4173 --strictPort',
    env: { BASE_PATH: '/component_lib' },
    url: 'http://localhost:4173/component_lib/',
    reuseExistingServer: !process.env.CI,
  },
});
