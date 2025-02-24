// https://playwright.dev/docs/chrome-extensions

/* eslint-disable no-empty-pattern, unicorn/prefer-module */

import path from 'node:path';
import { type BrowserContext, test as baseTest, chromium } from '@playwright/test';

export const test = baseTest.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: empty initial context
  async context({}, use) {
    const extensionPath = path.join(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        '--headless=new', // chromium 112+
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
      strictSelectors: true,
    });
    await use(context);
    await context.close();
  },
  // FIXME: Get extension ID dynamically without service worker; maybe via chrome.runtime.id
  // async extensionId({ context }, use) {
  //   let [sw] = context.serviceWorkers();
  //   sw ??= await context.waitForEvent('serviceworker', { timeout: 200 }););
  //
  //   const extensionId = sw.url().split('/')[2];
  //   await use(extensionId);
  // },
  // biome-ignore lint/correctness/noEmptyPattern: empty initial context
  async extensionId({}, use) {
    await use('ollcdfepbkpopcfilmheonkfbbnnmkbj');
  },
});

export const { describe, expect } = test;
