import { describe, expect, test } from 'bun:test';
import { extractText } from '../../src/extractor';

const minimal = '<html><body>x</body></html>';
const basic = await Bun.file('test/unit/fixtures/basic.html').text();
const broken = await Bun.file('test/unit/fixtures/broken.html').text();
const wikipediaSimple = await Bun.file('test/unit/fixtures/wikipedia-simple.html').text();
const wikipedia = await Bun.file('test/unit/fixtures/wikipedia.html').text();

// TODO: Test each of the root element selection logic branches

test('is a function', () => {
  expect.assertions(1);
  expect(extractText).toBeFunction();
});

test('takes a single argument', () => {
  expect.assertions(1);
  expect(extractText).toHaveLength(1);
});

test('returns a string', () => {
  expect.assertions(1);
  const result = extractText(minimal);
  expect(result).toBeString();
});

describe('basic.html', () => {
  test('returns expected text', () => {
    expect.assertions(1);
    const result = extractText(basic);
    expect(result).toBe('Basic HTML \n Some text.');
  });
});

describe('broken.html', () => {
  test('throws when processing', () => {
    expect.assertions(1);
    expect(() => extractText(broken)).toThrow();
  });
});

describe('wikipedia-simple.html', () => {
  test('returns expected text', () => {
    expect.assertions(1);
    const result = extractText(wikipediaSimple);
    expect(result).toMatchSnapshot();
  });
});

// TODO: Don't skip once we improve the extractor. Lots of noise in the output.
describe.skip('wikipedia.html', () => {
  test('returns expected text', () => {
    expect.assertions(1);
    const result = extractText(wikipedia);
    expect(result).toMatchSnapshot();
  });
});
