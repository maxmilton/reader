import { GlobalWindow, type Window } from 'happy-dom';
import { addHook } from 'pirates';

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var happyDOM: Window['happyDOM'];
}

// increase limit from 10
global.Error.stackTraceLimit = 100;

function noop() {}

function setupDOM() {
  const dom = new GlobalWindow();
  global.happyDOM = dom.happyDOM;
  // @ts-expect-error - happy-dom only implements a subset of the DOM API
  global.window = dom.window.document.defaultView;
  global.document = global.window.document;
}

function setupMocks(): void {
  // Make imported .xcss files return empty to prevent test errors (unit tests
  // can't assert styles properly anyway; better to create e2e tests!)
  addHook(() => '', { exts: ['.xcss'] });

  // @ts-expect-error - partial mock
  global.chrome = {
    storage: {
      sync: {
        get: noop,
        set: noop,
      },
    },
    scripting: {
      executeScript: () => Promise.resolve([{ result: undefined }]),
    },
    tabs: {
      query: () => Promise.resolve([{ id: 471 }]),
    },
    // TODO: Remove type cast + update mocks
  } as typeof window.chrome;

  global.console = window.console;
  // global.setTimeout = window.setTimeout;
  global.clearTimeout = window.clearTimeout;
  global.DocumentFragment = window.DocumentFragment;
  global.Text = window.Text;

  // Force timeout to 0ms
  window.setTimeout = new Proxy(window.setTimeout, {
    apply(target, thisArg, args) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const newArgs = [...args];
      newArgs[1] = 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.apply(target, thisArg, newArgs);
    },
  });
}

export function reset(): void {
  setupDOM();
  setupMocks();
}

setupDOM();
setupMocks();
