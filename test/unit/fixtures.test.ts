import { validate } from "@maxmilton/test-utils/html";
import { describe, expect, test } from "bun:test";

const fixtureFiles: [filename: string, bytes: number, valid: boolean][] = [
  ["basic.html", 145, true],
  ["broken.html", 1244, false],
  ["wikipedia-simple.html", 274_202, true],
  ["wikipedia.html", 437_315, true],
];

for (const [filename, bytes, valid] of fixtureFiles) {
  describe(filename, () => {
    const file = Bun.file(`test/unit/fixtures/${filename}`);

    test("file exists", () => {
      expect.assertions(2);
      expect(file.exists()).resolves.toBeTruthy();
      expect(file.size).toBeGreaterThan(0);
    });

    test("code is correct length", async () => {
      expect.assertions(1);
      const html = await file.text();
      expect(html).toHaveLength(bytes);
    });

    if (valid) {
      test("code is valid HTML", async () => {
        expect.assertions(1);
        const html = await file.text();
        expect(validate(html).valid).toBeTruthy();
      });
    } else {
      test("code is intentionally not valid HTML", async () => {
        expect.assertions(1);
        const html = await file.text();
        expect(validate(html).valid).toBeFalsy();
      });
    }
  });
}
