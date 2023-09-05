import { describe, expect, test } from 'bun:test';
import { extractText } from '../../src/extractor';

const minimal = '<html><body>x</body></html>';
const basic = await Bun.file('test/unit/fixtures/basic.html').text();
const broken = await Bun.file('test/unit/fixtures/broken.html').text();
const wikipediaSimple = await Bun.file('test/unit/fixtures/wikipedia-simple.html').text();
const wikipedia = await Bun.file('test/unit/fixtures/wikipedia.html').text();

// TODO: Test each of the root element selection logic branches

test('is a function', () => {
  expect(extractText).toBeFunction();
});

test('takes a single argument', () => {
  expect(extractText).toHaveLength(1);
});

test('returns a string', () => {
  const result = extractText(minimal);
  expect(result).toBeString();
});

describe('basic.html', () => {
  test('returns expected text', () => {
    const result = extractText(basic);
    expect(result).toBe('Basic HTML \n Some text.');
  });
});

describe('broken.html', () => {
  test('throws when processing', () => {
    expect(() => extractText(broken)).toThrow();
  });
});

describe('wikipedia-simple.html', () => {
  // FIXME: Don't skip this test. Test snapshots are currently broken in bun.
  test.skip('returns expected text', () => {
    const result = extractText(wikipediaSimple);
    expect(result).toMatchSnapshot();
  });
});

describe('wikipedia.html', () => {
  // FIXME: Don't skip this test. Test snapshots are currently broken in bun.
  test.skip('returns expected text', () => {
    const result = extractText(wikipedia);
    expect(result).toMatchSnapshot();
  });
});
