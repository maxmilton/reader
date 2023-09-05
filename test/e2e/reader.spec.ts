import { expect, test } from './fixtures';

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
