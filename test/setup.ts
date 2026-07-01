import "@maxmilton/test-utils/extend";

import { setupDOM } from "@maxmilton/test-utils/dom";

// HACK: Make imported .xcss files return empty to prevent test errors.
// eslint-disable-next-line unicorn/no-top-level-side-effects
Bun.plugin({
  name: "xcss",
  setup(build) {
    build.onLoad({ filter: /\.xcss$/ }, () => ({
      contents: "",
      // loader: "css",
    }));
  },
});

const noop = () => {};

function setupMocks(): void {
  // TODO: Decide how to handle this once macro string interpolation bug is fixed;  https://github.com/oven-sh/bun/issues/3830
  // this is normally set in build.ts
  // @ts-expect-error - readonly once set in build
  process.env.APP_RELEASE = "1.0.0";

  // @ts-expect-error - noop stub
  global.performance.mark = noop;
  // @ts-expect-error - noop stub
  global.performance.measure = noop;

  // eslint-disable-next-line unicorn/no-global-object-property-assignment
  global.chrome = {
    storage: {
      // @ts-expect-error - partial mock
      sync: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
      },
    },
    scripting: {
      // @ts-expect-error - partial mock
      executeScript: () => Promise.resolve([{ result: undefined }]),
    },
    tabs: {
      // @ts-expect-error - partial mock
      query: () => Promise.resolve([{ id: 123 }]),
    },
  };
}

export async function reset(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (global.happyDOM) {
    await happyDOM.abort();
    window.close();
  }

  setupDOM({
    url: "chrome-extension://ollcdfepbkpopcfilmheonkfbbnnmkbj/",
  });
  setupMocks();
}

// eslint-disable-next-line unicorn/no-top-level-side-effects
await reset();
