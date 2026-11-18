import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-audit/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server/dev.mjs',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120000,
  },
});

