// FIXME: This file doesn't get included in coverage reports even with `c8 --include=test/utils.ts`
//  ↳ https://github.com/bcoe/c8/issues/250

import { JSDOM } from 'jsdom';
import { addHook } from 'pirates';

// increase limit from 10
global.Error.stackTraceLimit = 100;

const mountedContainers = new Set<HTMLDivElement>();
let unhookXcss: (() => void) | undefined;

export function setup(): void {
  if (global.window) {
    throw new Error(
      'JSDOM globals already exist, did you forget to run teardown()?',
    );
  }
  if (typeof unhookXcss === 'function') {
    throw new TypeError(
      '.xcss hook already exists, did you forget to run teardown()?',
    );
  }

  // Make imported .xcss files return empty to prevent test errors (unit tests
  // can't assert styles properly anyway; better to create e2e tests!)
  unhookXcss = addHook(() => '', {
    exts: ['.xcss'],
  });

  const dom = new JSDOM('<!DOCTYPE html>', {
    pretendToBeVisual: true,
    runScripts: 'dangerously',
    url: 'http://localhost/',
  });

  global.window = dom.window.document.defaultView!;
  global.document = global.window.document;
}

export function teardown(): void {
  if (!global.window) {
    throw new Error('No JSDOM globals exist, did you forget to run setup()?');
  }
  if (typeof unhookXcss !== 'function') {
    throw new TypeError(
      '.xcss hook does not exist, did you forget to run setup()?',
    );
  }

  // https://github.com/jsdom/jsdom#closing-down-a-jsdom
  global.window.close();
  // @ts-expect-error - cleaning up
  // eslint-disable-next-line no-multi-assign
  global.window = global.document = undefined;

  unhookXcss();
  unhookXcss = undefined;
}

export interface RenderResult {
  /** A wrapper DIV which contains your mounted component. */
  container: HTMLDivElement;
  /**
   * A helper to print the HTML structure of the mounted container. The HTML is
   * prettified and may not accurately represent your actual HTML. It's intended
   * for debugging tests only and should not be used in any assertions.
   *
   * @param el - An element to inspect. Default is the mounted container.
   */
  debug(el?: Element): void;
  unmount(): void;
}

export function render(component: Node): RenderResult {
  const container = document.createElement('div');
  container.appendChild(component);
  document.body.appendChild(container);
  mountedContainers.add(container);

  return {
    container,
    debug(el = container) {
      // eslint-disable-next-line no-console
      console.log('DEBUG:\n', el.innerHTML);
    },
    unmount() {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      container.removeChild(component);
    },
  };
}

export function cleanup(): void {
  if (!mountedContainers || mountedContainers.size === 0) {
    throw new Error(
      'No mounted components exist, did you forget to call render()?',
    );
  }

  for (const container of mountedContainers) {
    if (container.parentNode === document.body) {
      container.remove();
    }

    mountedContainers.delete(container);
  }
}

/* eslint-disable @typescript-eslint/ban-types */
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;
/* eslint-enable @typescript-eslint/ban-types */
type ChromeAPI = DeepPartial<typeof window.chrome>;

type MockFn<T> = T & {
  calledTimes(): number;
};

const noop = () => {};

// TODO: See if there's anything worthwhile in https://github.com/therealparmesh/snoop/blob/master/src/index.js
// @ts-expect-error - FIXME:!
// eslint-disable-next-line @typescript-eslint/ban-types
export function mockFn<T extends Function>(imlp: T = noop): MockFn<T> {
  let callCount = 0;

  // @ts-expect-error - FIXME:!
  const fn: MockFn<T> = new Proxy(imlp, {
    apply(target, thisArg, args) {
      callCount += 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.apply(target, thisArg, args);
    },
  });

  fn.calledTimes = () => callCount;

  return fn;
}

export function mocksSetup(): void {
  const mockChrome: ChromeAPI = {
    storage: {
      sync: {
        // @ts-expect-error - FIXME:!
        get: (_keys, callback) => {
          callback({});
        },
        // @ts-expect-error - FIXME:!
        set: noop,
      },
    },
    scripting: {
      // @ts-expect-error - FIXME:!
      executeScript: () => Promise.resolve([{ result: undefined }]),
    },
    tabs: {
      // @ts-expect-error - FIXME:!
      query: () => Promise.resolve([{ id: 1 }]),
    },
  };

  // @ts-expect-error - just a partial mock
  global.chrome = mockChrome;

  global.DocumentFragment = window.DocumentFragment;
  global.localStorage = window.localStorage;
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

export function mocksTeardown(): void {
  // @ts-expect-error - cleaning up
  // eslint-disable-next-line no-multi-assign
  global.chrome = global.DocumentFragment = global.localStorage = global.Text = undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
