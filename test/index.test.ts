/* eslint-disable no-console, unicorn/no-process-exit */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import {
  mocksSetup, mocksTeardown, setup, sleep, teardown,
} from './utils';

// FIXME: Use hooks normally once issue is fixed -- https://github.com/lukeed/uvu/issues/80
// test.before.each(setup);
// test.before.each(mocksSetup);
// test.after.each(mocksTeardown);
// test.after.each(teardown);
test.before.each(() => {
  try {
    setup();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
test.before.each(() => {
  try {
    mocksSetup();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
test.after.each(() => {
  try {
    mocksTeardown();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
test.after.each(() => {
  try {
    teardown();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

const basicHTML = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
</body>
</html>
`;
let mockHTML = basicHTML;

test.before.each(() => {
  // @ts-expect-error - mock fn
  global.chrome.scripting.executeScript = () => Promise.resolve([{ result: mockHTML }]);
});
test.after.each(() => {
  mockHTML = basicHTML;
});

test('renders entire reader app', async () => {
  // eslint-disable-next-line global-require
  require('../dist/reader.js');

  // TODO: Better assertions
  assert.is(document.body.innerHTML.length > 500, true);
  const firstNode = document.body.firstChild as HTMLDivElement;
  assert.instance(firstNode, window.HTMLDivElement);
  assert.ok(document.body.querySelector('#progress'));
  assert.ok(document.body.querySelector('#controls'));
  assert.ok(document.body.querySelector('#play'));
  assert.ok(document.body.querySelector('#focus'));
  assert.ok(document.body.querySelector('#word'));
  assert.ok(document.body.querySelector('footer'));
  assert.is(document.body.querySelectorAll('button').length, 4);

  // Wait for timers within the app to finish
  await sleep(4);
});

test.run();
