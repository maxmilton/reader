import { expect } from 'bun:test';
import { GlobalWindow, type Window } from 'happy-dom';

declare global {
  /** Real bun console. `console` is mapped to happy-dom's virtual console. */
  // eslint-disable-next-line no-var, vars-on-top
  var console2: Console;
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
  // XXX: Although bun has a `toBeObject` matcher, it's not as useful since it
  // doesn't check for plain objects.
  toBePlainObject(received: unknown) {
    return Object.prototype.toString.call(received) === '[object Object]'
      ? { pass: true }
      : {
          pass: false,
          message: () => `expected ${String(received)} to be a plain object`,
        };
  },
});

// Make imported .xcss files return empty to prevent test errors (unit tests
// can't assert styles properly anyway; better to create e2e tests!)
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
  });
  global.happyDOM = dom.happyDOM;
  global.console2 = originalConsole;
  // @ts-expect-error - happy-dom only implements a subset of the DOM API
  global.window = dom.window.document.defaultView;
  global.document = global.window.document;
  global.console = window.console; // https://github.com/capricorn86/happy-dom/wiki/Virtual-Console
  global.fetch = window.fetch;
  global.setTimeout = window.setTimeout;
  global.clearTimeout = window.clearTimeout;
  global.DocumentFragment = window.DocumentFragment;
  global.Text = window.Text;
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
      query: () => Promise.resolve([{ id: 471 }]),
    },
  };
}

export function reset(): void {
  setupDOM();
  setupMocks();
}

reset();
