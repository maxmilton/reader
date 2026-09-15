// https://playwright.dev/docs/chrome-extensions

import path from "node:path";
import { test as base, type BrowserContext, chromium } from "@playwright/test";

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // oxlint-disable-next-line no-empty-pattern
  async context({}, use) {
    const dist = path.join(import.meta.dirname, "../../dist");
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    await use(context);
    await context.close();
  },
  // oxlint-disable-next-line no-empty-pattern
  async extensionId({}, use) {
    // Hardcoded because we have no way to get it dynamically without an
    // extension service worker. It's stable due to "key" in manifest.json.
    await use("ollcdfepbkpopcfilmheonkfbbnnmkbj");
  },
});

export const { describe, expect } = test;
