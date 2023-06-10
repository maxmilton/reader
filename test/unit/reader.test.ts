import { afterAll, beforeAll, expect, test } from 'bun:test';
import { reset } from '../setup';
import { consoleSpy } from './utils';

const basicHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

beforeAll(() => {
  // @ts-expect-error - stub return value
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: basicHTML }]);
});

afterAll(reset);

test('renders entire reader popup app', async () => {
  const checkConsoleCalls = consoleSpy();

  // @ts-expect-error - no allowJs in tsconfig
  // eslint-disable-next-line import/extensions
  await import('../../dist/reader.js');
  await happyDOM.whenAsyncComplete();

  // TODO: Better assertions
  expect(document.body.innerHTML.length).toBeGreaterThan(500);
  const firstNode = document.body.firstChild as HTMLDivElement;
  expect(firstNode).toBeInstanceOf(window.HTMLDivElement);
  expect(document.body.querySelector('#progress')).toBeTruthy();
  expect(document.body.querySelector('#controls')).toBeTruthy();
  expect(document.body.querySelector('#play')).toBeTruthy();
  expect(document.body.querySelector('#focus')).toBeTruthy();
  expect(document.body.querySelector('#word')).toBeTruthy();
  expect(document.body.querySelector('footer')).toBeTruthy();
  const buttons = document.body.querySelectorAll('button');
  expect(buttons).toHaveLength(4);
  expect(buttons[0].textContent).toBe('Rewind');
  expect(buttons[1].textContent).toBe('Pause'); // starts as "Play" but changes after load
  expect(buttons[2].textContent).toBe('−');
  expect(buttons[3].textContent).toBe('+');

  checkConsoleCalls();
});
