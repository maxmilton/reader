import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { validate } from "@maxmilton/test-utils/html";

describe("dist files", () => {
  // TODO: Remove the file MIME type checks? Bun inferrs it from the file
  // extension, not the actual file data, so the usefulness is questionable.

  // NOTE: Files of unknown type (e.g., symlinks) fall back to the default
  // "application/octet-stream". Bun.file() does not resolve symlinks so it's
  // safe to infer that all these files are therefore regular files.
  const distFiles: [filename: string, type: string, minBytes?: number, maxBytes?: number][] = [
    ["health.js", "text/javascript;charset=utf-8", 600, 900],
    ["icon16.png", "image/png", 270, 300],
    ["icon48.png", "image/png", 500, 600],
    ["icon128.png", "image/png", 1000, 1100],
    ["literata-extended.ttf", "font/ttf", 140_000, 150_000],
    ["literata-fin.ttf", "font/ttf", 1100, 1200],
    ["literata.ttf", "font/ttf", 20_000, 24_000],
    ["manifest.json", "application/json;charset=utf-8"],
    ["reader.css", "text/css;charset=utf-8", 2000, 4000],
    ["reader.html", "text/html;charset=utf-8", 200, 400],
    ["reader.js", "text/javascript;charset=utf-8", 8000, 11_000],
  ];

  describe.each(distFiles)("%s", (filename, type, minBytes, maxBytes) => {
    const file = Bun.file(`dist/${filename}`);

    test("exists with correct MIME type", () => {
      expect.assertions(3);
      expect(file.exists()).resolves.toBeTruthy();
      expect(file.size).toBeGreaterThan(0);
      expect(file.type).toBe(type);
    });

    if (typeof minBytes === "number" && typeof maxBytes === "number") {
      test("is within expected file size limits", () => {
        expect.assertions(2);
        expect(file.size).toBeGreaterThan(minBytes);
        expect(file.size).toBeLessThan(maxBytes);
      });
    }
  });

  test("contains no extra files", async () => {
    expect.assertions(1);
    const distDir = await readdir("dist");
    expect(distDir).toHaveLength(distFiles.length);
  });

  test.each(
    distFiles.filter(([filename]) => filename.endsWith(".html")),
  )("%s contains valid HTML", async (filename) => {
    const file = Bun.file(`dist/${filename}`);
    const html = await file.text();
    const result = validate(html);
    expect(result.valid).toBeTrue();
  });
});
