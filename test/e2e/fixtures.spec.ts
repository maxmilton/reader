import { describe, expect, test } from "./fixtures.ts";

describe("extensionId", () => {
  test("matches chrome://extensions", async ({ page, extensionId }) => {
    await page.goto("chrome://extensions/");

    const cards = page.locator("extensions-item");
    await cards.first().waitFor();

    const ids = await cards.evaluateAll((items) => items.map(({ id }) => id));
    if (ids.length !== 1) {
      throw new Error(`Expected one loaded extension, found ${ids.length}`);
    }

    expect(ids[0]).toBe(extensionId);
  });
});
