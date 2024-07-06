import { afterEach, expect, test } from 'bun:test';
import { cleanup, render } from './utils';

afterEach(cleanup);

// HACK: The Reader component is designed to be rendered once (does not clone
// its view) and mutates global state. Given the global state mutation, it's
// vital to reset its module between tests for accurate test conditions.
const MODULE_PATH = import.meta.resolveSync('../../src/components/Reader');
let Reader: typeof import('../../src/components/Reader').Reader;

async function load(html: string) {
  // @ts-expect-error - stub return value
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: html }]);

  Loader.registry.delete(MODULE_PATH);
  // eslint-disable-next-line unicorn/no-await-expression-member
  Reader = (await import('../../src/components/Reader')).Reader;
}

// const minimalHTML = '<html><body>x</body></html>';
const basicHTML = await Bun.file('test/unit/fixtures/basic.html').text();
// const brokenHTML = await Bun.file('test/unit/fixtures/broken.html').text();
// const wikipediaSimpleHTML = await Bun.file('test/unit/fixtures/wikipedia-simple.html').text();
// const wikipediaHTML = await Bun.file('test/unit/fixtures/wikipedia.html').text();

// XXX: Because there are async function calls within Reader, we need to wait
// for them to complete before we assert anything.
//  ↳ But not if we want to test the initial state of the DOM. In which case we
//    can cancel any running async tasks.

test('rendered DOM contains expected elements', async () => {
  expect.assertions(16);
  await load(basicHTML);
  const rendered = render(Reader());
  await happyDOM.abort();
  const root = rendered.container.firstChild as HTMLDivElement;
  expect(root).toBeInstanceOf(window.HTMLDivElement);
  expect(rendered.container.querySelector('#progress')).toBeTruthy();
  expect(rendered.container.querySelector('#progress')?.parentNode).toBe(root);
  expect(rendered.container.querySelector('#controls')).toBeTruthy();
  expect(rendered.container.querySelector('#controls')?.parentNode).toBe(root);
  expect(rendered.container.querySelector('#play')).toBeTruthy();
  expect(rendered.container.querySelector('#play')?.parentNode).toBe(
    rendered.container.querySelector('#controls'),
  );
  expect(rendered.container.querySelector('#focus')).toBeTruthy();
  expect(rendered.container.querySelector('#focus')?.parentNode).toBe(root);
  expect(rendered.container.querySelector('#word')).toBeTruthy();
  expect(rendered.container.querySelector('#word')?.parentNode).toBe(root);
  const buttons = rendered.container.querySelectorAll('button');
  expect(buttons).toHaveLength(4);
  expect(buttons[0].textContent).toBe('Rewind');
  expect(buttons[1].textContent).toBe('Play'); // starts as "Play" then changes to "Pause" after load
  expect(buttons[2].textContent).toBe('−');
  expect(buttons[3].textContent).toBe('+');
});

test('rendered DOM initial state matches snapshot', async () => {
  expect.assertions(1);
  await load(basicHTML);
  const rendered = render(Reader());
  await happyDOM.abort();
  expect(rendered.container.innerHTML).toMatchSnapshot();
});

test('rendered DOM playing state matches snapshot', async () => {
  expect.assertions(1);
  await load(basicHTML);
  const rendered = render(Reader());
  await Bun.sleep(1); // lets queued promises in Reader run first
  await happyDOM.abort();
  expect(rendered.container.innerHTML).toMatchSnapshot();
});

test('rendered DOM end state matches snapshot', async () => {
  expect.assertions(1);
  const rendered = render(Reader());
  await happyDOM.waitUntilComplete();
  expect(rendered.container.innerHTML).toMatchSnapshot();
});
