import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace:   'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // Skip the Tenderly-gated portfolio tests in the default run
      testIgnore: ['**/portfolio.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Tenderly tests in their own project — clearly separable from smoke tests.
      // The fixture auto-skips when TENDERLY_* vars are absent.
      //
      // Run with:  npm run test:e2e:tenderly
      //
      name:      'tenderly',
      testMatch: ['**/portfolio.spec.ts'],
      use:       { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:             'npm run dev',
    url:                 'http://localhost:3000',
    reuseExistingServer: true,
    timeout:             120_000,
  },
})
