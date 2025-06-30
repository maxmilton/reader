import { extractText } from "#/extractor.ts";
import { describe, expect, test } from "bun:test";

const minimal = "<html><body>x</body></html>";
const basic = await Bun.file("test/unit/fixtures/basic.html").text();
const broken = await Bun.file("test/unit/fixtures/broken.html").text();
const wikipediaSimple = await Bun.file("test/unit/fixtures/wikipedia-simple.html").text();
const wikipedia = await Bun.file("test/unit/fixtures/wikipedia.html").text();

// TODO: Test each of the root element selection logic branches

test("is a function", () => {
  expect.assertions(2);
  expect(extractText).toBeFunction();
  expect(extractText).not.toBeClass();
});

test("expects 1 parameter", () => {
  expect.assertions(1);
  expect(extractText).toHaveParameters(1, 0);
});

test("returns a string", () => {
  expect.assertions(1);
  const result = extractText(minimal);
  expect(result).toBeString();
});

describe("basic.html", () => {
  test("returns expected text", () => {
    expect.assertions(1);
    const result = extractText(basic);
    expect(result).toBe("Basic HTML \n Some text.");
  });
});

describe("broken.html", () => {
  test("throws when processing", () => {
    expect.assertions(1);
    expect(() => extractText(broken)).toThrow();
  });
});

describe("wikipedia-simple.html", () => {
  test("returns expected text", () => {
    expect.assertions(1);
    const result = extractText(wikipediaSimple);
    expect(result).toMatchSnapshot();
  });
});

describe("wikipedia.html", () => {
  test("returns expected text", () => {
    expect.assertions(1);
    const result = extractText(wikipedia);
    expect(result).toMatchSnapshot();
  });
});
