import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for FLAKES Debugging Demo
 * 
 * This config demonstrates best practices for CI-friendly test setup.
 * Note how we use environment variables and explicit settings.
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to avoid resource issues
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration - Multiple reports for demo
  // Use REPORT_OUTPUT env var to customize output folder
  reporter: [
    ['html', { outputFolder: process.env.REPORT_OUTPUT || 'playwright-report', open: 'never' }],
    ['list'],
    // JSON reporter for CI integration
    ...(process.env.CI ? [['json', { outputFile: 'test-results.json' }] as const] : []),
  ],

  // Global timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Shared settings for all projects
  use: {
    // ✅ GOOD: Config-driven base URL (K - Konfiguration)
    baseURL: process.env.BASE_URL || 'https://gauravkhurana.in/test-automation-play',

    // ✅ GOOD: Explicit viewport (K - Konfiguration)
    viewport: { width: 1280, height: 720 },

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure (helpful for debugging CI issues)
    video: 'on-first-retry',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});
