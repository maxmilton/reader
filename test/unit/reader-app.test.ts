// HACK: Appended "-app" to this file's name to ensure `bun:test` runs it. There
// is a naming conflict due to another file in this directory with the same
// name but starting with an uppercase letter. This is a temporary solution.

import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import type { UserSettings } from '../../src/components/Reader';
import { reset } from '../setup';
import { consoleSpy } from './utils';

// Completely reset DOM and global state between tests
afterEach(reset);

const MODULE_PATH = import.meta.resolveSync('../../dist/reader.js');

async function load(html: string, settings?: UserSettings) {
  // @ts-expect-error - stub return value
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: html }]);

  if (settings) {
    chrome.storage.sync.get = () => Promise.resolve(settings);
  }

  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete import.meta.require.cache[MODULE_PATH];
  await import(MODULE_PATH);
}

const basicHTML = await Bun.file('test/unit/fixtures/basic.html').text();
const brokenHTML = await Bun.file('test/unit/fixtures/broken.html').text();

describe('initial state', () => {
  test('renders reader app', async () => {
    const checkConsoleCalls = consoleSpy();
    await load(basicHTML);
    happyDOM.cancelAsync();
    expect(document.body.innerHTML.length).toBeGreaterThan(400);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector('#progress')).toBeTruthy();
    expect(document.body.querySelector('#progress')?.parentNode).toBe(root);
    expect(document.body.querySelector('#controls')).toBeTruthy();
    expect(document.body.querySelector('#controls')?.parentNode).toBe(root);
    expect(document.body.querySelector('#play')).toBeTruthy();
    expect(document.body.querySelector('#play')?.parentNode).toBe(
      document.body.querySelector('#controls'),
    );
    expect(document.body.querySelector('#focus')).toBeTruthy();
    expect(document.body.querySelector('#focus')?.parentNode).toBe(root);
    expect(document.body.querySelector('#word')).toBeTruthy();
    expect(document.body.querySelector('#word')?.parentNode).toBe(root);
    expect(document.body.querySelector('footer')).toBeTruthy();
    const buttons = document.body.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe('Rewind');
    expect(buttons[1].textContent).toBe('Play'); // changes according to state
    expect(buttons[2].textContent).toBe('−');
    expect(buttons[3].textContent).toBe('+');
    checkConsoleCalls();
  });
});

describe('playing state', () => {
  test('renders reader app', async () => {
    const checkConsoleCalls = consoleSpy();
    await load(basicHTML);
    await Bun.sleep(10);
    happyDOM.cancelAsync();
    expect(document.body.innerHTML.length).toBeGreaterThan(400);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector('#progress')).toBeTruthy();
    expect(document.body.querySelector('#progress')?.parentNode).toBe(root);
    expect(document.body.querySelector('#controls')).toBeTruthy();
    expect(document.body.querySelector('#controls')?.parentNode).toBe(root);
    expect(document.body.querySelector('#play')).toBeTruthy();
    expect(document.body.querySelector('#play')?.parentNode).toBe(
      document.body.querySelector('#controls'),
    );
    expect(document.body.querySelector('#focus')).toBeTruthy();
    expect(document.body.querySelector('#focus')?.parentNode).toBe(root);
    expect(document.body.querySelector('#word')).toBeTruthy();
    expect(document.body.querySelector('#word')?.parentNode).toBe(root);
    expect(document.body.querySelector('footer')).toBeTruthy();
    const buttons = document.body.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe('Rewind');
    expect(buttons[1].textContent).toBe('Pause'); // changes according to state
    expect(buttons[2].textContent).toBe('−');
    expect(buttons[3].textContent).toBe('+');
    checkConsoleCalls();
  });
});

describe('end state', () => {
  test('renders reader app', async () => {
    const checkConsoleCalls = consoleSpy();
    // set wpm to max possible value to speed up test
    await load(basicHTML, { wpm: 60_000 });
    await happyDOM.whenAsyncComplete();
    // TODO: Don't sleep or set wpm. Use jest.runAllTimers() once bun:test supports it.
    await Bun.sleep(50);
    expect(document.body.innerHTML.length).toBeGreaterThan(500);
    const root = document.body.firstChild as HTMLDivElement;
    expect(root).toBeInstanceOf(window.HTMLDivElement);
    expect(document.body.querySelector('#progress')).toBeTruthy();
    expect(document.body.querySelector('#progress')?.parentNode).toBe(root);
    expect(document.body.querySelector('#controls')).toBeTruthy();
    expect(document.body.querySelector('#controls')?.parentNode).toBe(root);
    expect(document.body.querySelector('#play')).toBeTruthy();
    expect(document.body.querySelector('#play')?.parentNode).toBe(
      document.body.querySelector('#controls'),
    );
    expect(document.body.querySelector('#focus')).toBeTruthy();
    expect(document.body.querySelector('#focus')?.parentNode).toBe(root);
    expect(document.body.querySelector('#word')).toBeTruthy();
    expect(document.body.querySelector('#word')?.parentNode).toBe(root);
    expect(document.body.querySelector('footer')).toBeTruthy();
    const buttons = document.body.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe('Rewind');
    expect(buttons[1].textContent).toBe('Play again'); // changes according to state
    expect(buttons[2].textContent).toBe('−');
    expect(buttons[3].textContent).toBe('+');
    checkConsoleCalls();
  });
});

describe('error state', () => {
  test('renders reader app', async () => {
    const checkConsoleCalls = consoleSpy();
    // @ts-expect-error - noop stub
    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    await load(brokenHTML);
    await Bun.sleep(1); // lets queued promises in Reader run first
    happyDOM.cancelAsync();
    expect(document.body.querySelector('#summary')).toBeTruthy();
    expect(document.body.querySelector('#summary')?.textContent).toInclude('TypeError');
    const buttons = document.body.querySelectorAll('button');
    expect(buttons[0].textContent).toBe('Rewind');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].textContent).toBe('Play'); // changes according to state
    expect(buttons[1].disabled).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    // TODO: Use this once bun:test supports it.
    // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(TypeError));
    consoleErrorSpy.mockReset();
    checkConsoleCalls();
  });
});
