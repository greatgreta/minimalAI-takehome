import { defineConfig } from '@playwright/test';

// Uses the system Chrome (channel: 'chrome') so no browser download is needed.
// Serves the production build: run `npm run build` first.
export default defineConfig({
  testDir: 'tests',
  testMatch: /.*\.spec\.ts/,
  use: { baseURL: 'http://localhost:4173', channel: 'chrome' },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
