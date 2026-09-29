import "@maxmilton/test-utils/extend";
import { setupDOM } from "@maxmilton/test-utils/dom";

// HACK: Make imported .xcss files return empty to prevent test errors.
// oxlint-disable-next-line vitest/require-hook
Bun.plugin({
  name: "xcss",
  setup(build) {
    build.onLoad({ filter: /\.xcss$/u }, () => ({
      contents: "",
      // loader: "css",
    }));
  },
});

function asyncReturn<T>(value: T) {
  function call(...args: [...unknown[], (result: T) => void]): void;
  function call(...args: unknown[]): Promise<T>;
  function call(...args: unknown[]): Promise<T> | undefined {
    const callback = args.at(-1);

    if (typeof callback === "function") {
      // oxlint-disable-next-line promise/prefer-await-to-callbacks typescript/no-unsafe-type-assertion
      (callback as (result: T) => void)(value);
      return;
    }

    return Promise.resolve(value);
  }

  return call;
}

function setupMocks(): void {
  // TODO: Decide how to handle this once macro string interpolation bug is fixed;  https://github.com/oven-sh/bun/issues/3830
  // this is normally set in build.ts
  // @ts-expect-error - readonly once set in build
  process.env.APP_RELEASE = "1.0.0";

  // @ts-expect-error - noop stub
  global.performance.mark = () => {};
  // @ts-expect-error - noop stub
  global.performance.measure = () => {};

  global.chrome = {
    storage: {
      // @ts-expect-error - partial mock
      sync: {
        get: asyncReturn({}),
        set: asyncReturn(undefined),
      },
    },
    scripting: {
      // @ts-expect-error - partial mock
      executeScript: asyncReturn([{ result: undefined }]),
    },
    tabs: {
      // @ts-expect-error - partial mock
      query: asyncReturn([{ id: 123 }]),
    },
  };
}

export async function reset(): Promise<void> {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (global.happyDOM) {
    await happyDOM.abort();
    window.close();
  }

  setupDOM({ url: "chrome-extension://ollcdfepbkpopcfilmheonkfbbnnmkbj/" });
  setupMocks();
}

await reset();
