import { expect } from 'bun:test';
import { GlobalWindow, type Window } from 'happy-dom';

declare global {
  /** Real bun console. `console` is mapped to happy-dom's virtual console. */
  // eslint-disable-next-line no-var, vars-on-top
  var $console: Console;
  // eslint-disable-next-line no-var, vars-on-top
  var happyDOM: Window['happyDOM'];
}

declare module 'bun:test' {
  interface Matchers {
    /** Asserts that a value is a plain `object`. */
    toBePlainObject(): void;
  }
}

expect.extend({
  // XXX: Bun's `toBeObject` matcher is the equivalent of `typeof x === 'object'`.
  toBePlainObject(received: unknown) {
    return Object.prototype.toString.call(received) === '[object Object]'
      ? { pass: true }
      : {
          pass: false,
          message: () => `expected ${String(received)} to be a plain object`,
        };
  },
});

// Make imported .xcss files return empty to prevent test errors.
Bun.plugin({
  name: 'xcss',
  setup(build) {
    build.onLoad({ filter: /\.xcss$/ }, () => ({
      contents: '',
      // loader: 'css',
    }));
  },
});

const originalConsole = global.console;
const noop = () => {};

function setupDOM() {
  const dom = new GlobalWindow({
    url: 'chrome-extension://ollcdfepbkpopcfilmheonkfbbnnmkbj/',
    settings: {
      timer: { maxTimeout: 16 }, // ms; speed up tests
    },
  });
  global.happyDOM = dom.happyDOM;
  global.$console = originalConsole;
  // @ts-expect-error - happy-dom only implements a subset of the DOM API
  global.window = dom.window.document.defaultView;
  global.document = global.window.document;
  global.console = window.console; // https://github.com/capricorn86/happy-dom/wiki/Virtual-Console
  global.fetch = window.fetch;
  global.setTimeout = window.setTimeout;
  global.clearTimeout = window.clearTimeout;
  global.Text = window.Text;
  global.DocumentFragment = window.DocumentFragment;
  global.MutationObserver = window.MutationObserver;
}

function setupMocks(): void {
  // TODO: Decide how to handle this once macro string interpolation bug is fixed;  https://github.com/oven-sh/bun/issues/3830
  // this is normally set in build.ts
  process.env.APP_RELEASE = '1.0.0';

  // @ts-expect-error - noop stub
  global.performance.mark = noop;
  // @ts-expect-error - noop stub
  global.performance.measure = noop;

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

  setupDOM();
  setupMocks();
}

await reset();
