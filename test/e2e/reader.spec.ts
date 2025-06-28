import type { ConsoleMessage } from '@playwright/test';
import { describe, expect, test } from './fixtures.ts';

test('reader popup', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/reader.html`);

  // FIXME: Better assertions

  const buttons = await page.locator('button').all();
  expect(buttons).toHaveLength(4);
  await expect(buttons[0]).toHaveText('Rewind');
  await expect(buttons[1]).toHaveText('Play');
  await expect(buttons[2]).toHaveText('−');
  await expect(buttons[3]).toHaveText('+');
});

// TODO: Test all app states: initial, error, playing, paused, rewinding, end, replay

describe('initial view', () => {
  test('matches screenshot', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/reader.html`);
    await expect(page).toHaveScreenshot('reader-initial.png', {
      fullPage: true,
      mask: [
        page.locator('footer'), // mask footer which contains version numbers
      ],
      // TODO: Fix inconsistent fonts in CI and remove this.
      maxDiffPixelRatio: 0.01,
    });
  });
});

test('has no console calls or unhandled errors', async ({ page, extensionId }) => {
  const unhandledErrors: Error[] = [];
  const consoleMessages: ConsoleMessage[] = [];
  page.on('pageerror', (err) => unhandledErrors.push(err));
  page.on('console', (msg) => consoleMessages.push(msg));
  await page.goto(`chrome-extension://${extensionId}/reader.html`);
  expect(unhandledErrors).toHaveLength(0);
  expect(consoleMessages).toHaveLength(0);
});
