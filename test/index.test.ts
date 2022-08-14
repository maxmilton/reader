import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { reset } from './setup';
import { consoleSpy } from './utils';

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
test.after(reset);

test('renders entire reader app', async () => {
  const checkConsoleCalls = consoleSpy();

  // eslint-disable-next-line global-require
  require('../dist/reader.js');

  await happyDOM.whenAsyncComplete();

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

  checkConsoleCalls(assert);
});

test.run();
