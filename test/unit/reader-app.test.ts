// HACK: Appended "-app" to this file's name to ensure `bun:test` runs it. There
// is a naming conflict due to another file in this directory with the same
// name but starting with an uppercase letter. This is a temporary solution.

import type { UserSettings } from "#components/Reader.ts";
import { performanceSpy } from "@maxmilton/test-utils/spy";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { reset } from "../setup.ts";

// Completely reset DOM and global state between tests
afterEach(reset);

const MODULE_PATH = Bun.resolveSync("../../dist/reader.js", import.meta.dir);

async function load(html: string, settings?: UserSettings) {
  // @ts-expect-error - stub return value
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: html }]);

  if (settings) {
    chrome.storage.sync.get = () => Promise.resolve(settings);
  }

  Loader.registry.delete(MODULE_PATH);
  await import(MODULE_PATH);

  return /** restore */ () => {
    chrome.storage.sync.get = () => Promise.resolve({});
  };
}

const basicHTML = await Bun.file("test/unit/fixtures/basic.html").text();
const brokenHTML = await Bun.file("test/unit/fixtures/broken.html").text();

describe("initial state", () => {
  test("renders reader app", async () => {
    expect.assertions(19);

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
    await happyDOM.abort();
    expect(document.body.innerHTML.length).toBeGreaterThan(400);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector("#progress")).toBeTruthy();
    expect(document.body.querySelector("#progress")?.parentNode).toBe(root);
    expect(document.body.querySelector("#controls")).toBeTruthy();
    expect(document.body.querySelector("#controls")?.parentNode).toBe(root);
    expect(document.body.querySelector("#play")).toBeTruthy();
    expect(document.body.querySelector("#play")?.parentNode).toBe(
      document.body.querySelector("#controls"),
    );
    expect(document.body.querySelector("#focus")).toBeTruthy();
    expect(document.body.querySelector("#focus")?.parentNode).toBe(root);
    expect(document.body.querySelector("#word")).toBeTruthy();
    expect(document.body.querySelector("#word")?.parentNode).toBe(root);
    expect(document.body.querySelector("footer")).toBeTruthy();
    const buttons = document.body.querySelectorAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Rewind");
    expect(buttons[1].textContent).toBe("Play"); // changes according to state
    expect(buttons[2].textContent).toBe("−");
    expect(buttons[3].textContent).toBe("+");
    expect(happyDOM.virtualConsolePrinter.read()).toBeArrayOfSize(0);

    thenSpy.mockRestore();
  });
});

describe("playing state", () => {
  test("renders reader app", async () => {
    expect.assertions(19);
    await load(basicHTML);
    // await Bun.sleep(10);
    await happyDOM.abort();
    expect(document.body.innerHTML.length).toBeGreaterThan(400);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector("#progress")).toBeTruthy();
    expect(document.body.querySelector("#progress")?.parentNode).toBe(root);
    expect(document.body.querySelector("#controls")).toBeTruthy();
    expect(document.body.querySelector("#controls")?.parentNode).toBe(root);
    expect(document.body.querySelector("#play")).toBeTruthy();
    expect(document.body.querySelector("#play")?.parentNode).toBe(
      document.body.querySelector("#controls"),
    );
    expect(document.body.querySelector("#focus")).toBeTruthy();
    expect(document.body.querySelector("#focus")?.parentNode).toBe(root);
    expect(document.body.querySelector("#word")).toBeTruthy();
    expect(document.body.querySelector("#word")?.parentNode).toBe(root);
    expect(document.body.querySelector("footer")).toBeTruthy();
    const buttons = document.body.querySelectorAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Rewind");
    expect(buttons[1].textContent).toBe("Pause"); // changes according to state
    expect(buttons[2].textContent).toBe("−");
    expect(buttons[3].textContent).toBe("+");
    expect(happyDOM.virtualConsolePrinter.read()).toBeArrayOfSize(0);
  });
});

describe("end state", () => {
  test("renders reader app", async () => {
    expect.assertions(19);
    // set wpm to max possible value to speed up test
    await load(basicHTML, { wpm: 60_000 });
    await happyDOM.waitUntilComplete();
    expect(document.body.innerHTML.length).toBeGreaterThan(500);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector("#progress")).toBeTruthy();
    expect(document.body.querySelector("#progress")?.parentNode).toBe(root);
    expect(document.body.querySelector("#controls")).toBeTruthy();
    expect(document.body.querySelector("#controls")?.parentNode).toBe(root);
    expect(document.body.querySelector("#play")).toBeTruthy();
    expect(document.body.querySelector("#play")?.parentNode).toBe(
      document.body.querySelector("#controls"),
    );
    expect(document.body.querySelector("#focus")).toBeTruthy();
    expect(document.body.querySelector("#focus")?.parentNode).toBe(root);
    expect(document.body.querySelector("#word")).toBeTruthy();
    expect(document.body.querySelector("#word")?.parentNode).toBe(root);
    expect(document.body.querySelector("footer")).toBeTruthy();
    const buttons = document.body.querySelectorAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Rewind");
    expect(buttons[1].textContent).toBe("Play again"); // changes according to state
    expect(buttons[2].textContent).toBe("−");
    expect(buttons[3].textContent).toBe("+");
    expect(happyDOM.virtualConsolePrinter.read()).toBeArrayOfSize(0);
  });

  test("does not call any console methods", async () => {
    expect.assertions(1);
    // set wpm to max possible value to speed up test
    await load(basicHTML, { wpm: 60_000 });
    await happyDOM.waitUntilComplete();
    expect(happyDOM.virtualConsolePrinter.read()).toBeArrayOfSize(0);
  });

  test("does not call any performance methods", async () => {
    expect.hasAssertions(); // variable number of assertions
    const check = performanceSpy();
    // set wpm to max possible value to speed up test
    await load(basicHTML, { wpm: 60_000 });
    await happyDOM.waitUntilComplete();
    check();
  });

  test("does not call fetch()", async () => {
    expect.assertions(1);
    const spy = spyOn(global, "fetch");
    // set wpm to max possible value to speed up test
    const restore = await load(basicHTML, { wpm: 60_000 });
    await happyDOM.waitUntilComplete();
    expect(spy).not.toHaveBeenCalled();
    restore();
  });
});

describe("error state", () => {
  test("renders reader app", async () => {
    expect.assertions(9);
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    await load(brokenHTML);
    // await Bun.sleep(1); // lets queued promises in Reader run first
    await happyDOM.abort();
    expect(document.body.querySelector("#summary")).toBeTruthy();
    expect(document.body.querySelector("#summary")?.textContent).toInclude("TypeError");
    const buttons = document.body.querySelectorAll("button");
    expect(buttons[0].textContent).toBe("Rewind");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].textContent).toBe("Play"); // changes according to state
    expect(buttons[1].disabled).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(TypeError));
    consoleErrorSpy.mockReset();
    expect(happyDOM.virtualConsolePrinter.read()).toBeArrayOfSize(0);
  });
});
