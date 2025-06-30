/* eslint-disable consistent-return */

import { compile, DECLARATION, FONT_FACE, lookup, reduce, SKIP, walk } from "@maxmilton/test-utils/css";
import { describe, expect, test } from "bun:test";
import xcssConfig from "../../xcss.config.ts";

describe("xcss config", () => {
  test("contains only expected plugins", () => {
    expect(xcssConfig.plugins).toBeArrayOfSize(2);
    // HACK: We can't use fn.name because the plugins are minified, so we check
    // that a known unique error code is present in the stringified source.
    expect(xcssConfig.plugins?.[0].toString()).toInclude("import-empty"); // @ekscss/plugin-import
    expect(xcssConfig.plugins?.[1].toString()).toInclude("apply-empty"); // @ekscss/plugin-apply
  });
});

const fonts = ["literata.ttf", "literata-extended.ttf", "literata-fin.ttf"] as const;
const css = await Bun.file("dist/reader.css").text();
const ast = compile(css);

test("compiled AST is not empty", () => {
  expect.assertions(1);
  expect(ast).not.toBeEmpty();
});

test("contains @font-face rule for each font", () => {
  expect.assertions(11); // 5 other assertions + 3 fonts * 2 assertions
  expect(css).toInclude(fonts[0]);
  expect(css).toInclude(fonts[1]);
  expect(css).toInclude(fonts[2]);
  expect(css.match(/@font-face/g)).toHaveLength(fonts.length);

  // verify the fonts appear within @font-face rules
  let found = 0;
  walk(ast, (element) => {
    if (element.type !== FONT_FACE && element.parent?.type !== FONT_FACE) return SKIP;
    if (element.type === DECLARATION && element.props === "src") {
      const param = /url\(([^)]+)\)/.exec(element.children as string)?.[1];
      expect(param).toBeDefined();
      expect(fonts).toContain(param!);
      found += 1;
    }
  });
  expect(found).toBe(fonts.length);
});

test("does not contain any media queries", () => {
  expect.assertions(1);
  expect(css).not.toInclude("@media");
});

test("does not contain any @import rules", () => {
  expect.assertions(1);
  expect(css).not.toInclude("@import");
});

test("does not contain any comments", () => {
  expect.assertions(4);
  expect(css).not.toInclude("/*");
  expect(css).not.toInclude("*/");
  expect(css).not.toInclude("//"); // inline comments or URL protocol
  expect(css).not.toInclude("<!");
});

test("<html> has width of 600px", () => {
  expect.assertions(4);
  const elements = lookup(ast, "html");
  expect(elements).toBeArray();
  expect(elements?.length).toBeGreaterThan(0);
  expect(elements?.[0].props).toContain("html");
  const styles = reduce(elements!);
  expect(styles).toHaveProperty("width", "600px");
});

test("<body> has width of 600px", () => {
  expect.assertions(4);
  const elements = lookup(ast, "body");
  expect(elements).toBeArray();
  expect(elements?.length).toBeGreaterThan(0);
  expect(elements?.[0].props).toContain("body");
  const styles = reduce(elements!);
  expect(styles).toHaveProperty("width", "600px");
});
