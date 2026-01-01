// https://playwright.dev/docs/chrome-extensions

/* eslint-disable no-empty-pattern */

import path from "node:path";
import { type BrowserContext, test as base, chromium } from "@playwright/test";

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // biome-ignore lint/correctness/noEmptyPattern: playwright setup
  async context({}, use) {
    const dist = path.join(import.meta.dirname, "../../dist");
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    await use(context);
    await context.close();
  },
  // FIXME: Get extension ID dynamically without service worker; maybe via chrome.runtime.id
  // async extensionId({ context }, use) {
  //   let [sw] = context.serviceWorkers();
  //   sw ??= await context.waitForEvent("serviceworker", { timeout: 200 }););
  //
  //   const extensionId = sw.url().split("/")[2];
  //   await use(extensionId);
  // },
  // biome-ignore lint/correctness/noEmptyPattern: playwright setup
  async extensionId({}, use) {
    await use("ollcdfepbkpopcfilmheonkfbbnnmkbj");
  },
});

export const { describe, expect } = test;
