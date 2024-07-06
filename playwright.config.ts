import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: 'test/e2e/**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  use: {
    acceptDownloads: false,
    contextOptions: { strictSelectors: true },
    locale: 'en-US',
    // offline: true,
    timezoneId: 'UTC',
  },
});
