import type { UserSettings } from "#components/Reader.ts";
import { cleanup, render } from "@maxmilton/test-utils/dom";
import { afterEach, expect, spyOn, test } from "bun:test";

afterEach(cleanup);

// HACK: The Reader component is designed to be rendered once (does not clone
// its view) and mutates global state. Given the global state mutation, it's
// vital to reset its module between tests for accurate test conditions.
const MODULE_PATH = Bun.resolveSync("#components/Reader.ts", import.meta.dir);
let Reader: typeof import("#components/Reader.ts").Reader;

async function load(html: string, settings?: UserSettings) {
  // @ts-expect-error - stub return value
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: html }]);

  if (settings) {
    chrome.storage.sync.get = () => Promise.resolve(settings);
  }

  Loader.registry.delete(MODULE_PATH);
  // eslint-disable-next-line unicorn/no-await-expression-member
  Reader = (await import("#components/Reader.ts")).Reader;

  return /** restore */ () => {
    chrome.storage.sync.get = () => Promise.resolve({});
  };
}

// const minimalHTML = '<html><body>x</body></html>';
const basicHTML = await Bun.file("test/unit/fixtures/basic.html").text();
// const brokenHTML = await Bun.file('test/unit/fixtures/broken.html').text();
// const wikipediaSimpleHTML = await Bun.file('test/unit/fixtures/wikipedia-simple.html').text();
// const wikipediaHTML = await Bun.file('test/unit/fixtures/wikipedia.html').text();

test("rendered DOM contains expected elements", async () => {
  expect.assertions(16);

  // HACK: Prevent the UI from progressing past the initial state by preventing
  // the second `Promise.then` call which would normally call the Reader
  // component's start() function. Flaky and needs a better solution!
  const thenSpy = spyOn(Promise.prototype, "then");
  // @ts-expect-error - mock implementation
  thenSpy.mockImplementation((fn) => {
    if (thenSpy.mock.calls.length < 2) return Promise.resolve(fn);
    return Promise.resolve(() => {});
  });

  await load(basicHTML);
  const rendered = render(Reader());
  await happyDOM.abort();
  const root = rendered.container.firstChild as HTMLDivElement;
  expect(root).toBeInstanceOf(window.HTMLDivElement);
  expect(rendered.container.querySelector("#progress")).toBeTruthy();
  expect(rendered.container.querySelector("#progress")?.parentNode).toBe(root);
  expect(rendered.container.querySelector("#controls")).toBeTruthy();
  expect(rendered.container.querySelector("#controls")?.parentNode).toBe(root);
  expect(rendered.container.querySelector("#play")).toBeTruthy();
  expect(rendered.container.querySelector("#play")?.parentNode).toBe(
    rendered.container.querySelector("#controls"),
  );
  expect(rendered.container.querySelector("#focus")).toBeTruthy();
  expect(rendered.container.querySelector("#focus")?.parentNode).toBe(root);
  expect(rendered.container.querySelector("#word")).toBeTruthy();
  expect(rendered.container.querySelector("#word")?.parentNode).toBe(root);
  const buttons = rendered.container.querySelectorAll("button");
  expect(buttons).toHaveLength(4);
  expect(buttons[0].textContent).toBe("Rewind");
  expect(buttons[1].textContent).toBe("Play"); // starts as "Play" then changes to "Pause" after load
  expect(buttons[2].textContent).toBe("−");
  expect(buttons[3].textContent).toBe("+");

  thenSpy.mockRestore();
});

test("rendered DOM initial state matches snapshot", async () => {
  expect.assertions(1);

  // HACK: Prevent the UI from progressing past the initial state by preventing
  // the second `Promise.then` call which would normally call the Reader
  // component's start() function. Flaky and needs a better solution!
  const thenSpy = spyOn(Promise.prototype, "then");
  // @ts-expect-error - mock implementation
  thenSpy.mockImplementation((fn) => {
    if (thenSpy.mock.calls.length < 2) return Promise.resolve(fn);
    return Promise.resolve(() => {});
  });

  await load(basicHTML);
  const rendered = render(Reader());
  await happyDOM.abort();
  expect(rendered.container.innerHTML).toMatchSnapshot();

  thenSpy.mockRestore();
});

test("rendered DOM playing state matches snapshot", async () => {
  expect.assertions(1);
  await load(basicHTML);
  const rendered = render(Reader());
  await Bun.sleep(1); // lets queued promises in Reader run first
  await happyDOM.abort();
  expect(rendered.container.innerHTML).toMatchSnapshot();
});

test("rendered DOM end state matches snapshot", async () => {
  expect.assertions(1);
  // set wpm to max possible value to speed up test
  const restore = await load(basicHTML, { wpm: 60_000 });
  const rendered = render(Reader());
  await happyDOM.waitUntilComplete();
  expect(rendered.container.innerHTML).toMatchSnapshot();
  restore();
});
