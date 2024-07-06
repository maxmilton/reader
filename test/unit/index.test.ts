import { describe, expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';

describe('dist files', () => {
  // FIXME: The bun file type is just inferred from the file extension, not the
  // underlying file data... so that part of this test is not very useful.

  // XXX: Files with unknown type (e.g., symlinks) fall back to the default
  // "application/octet-stream". Bun.file() does not resolve symlinks so it's
  // safe to infer that all these files are therefore regular files.
  const distFiles: [filename: string, type: string, minBytes?: number, maxBytes?: number][] = [
    ['health.js', 'text/javascript;charset=utf-8', 600, 800],
    ['icon16.png', 'image/png'],
    ['icon48.png', 'image/png'],
    ['icon128.png', 'image/png'],
    ['literata-ext.woff2', 'font/woff2'],
    ['literata-italic.woff2', 'font/woff2'],
    ['literata.woff2', 'font/woff2'],
    ['manifest.json', 'application/json;charset=utf-8'],
    ['reader.css', 'text/css;charset=utf-8', 2000, 4000],
    ['reader.html', 'text/html;charset=utf-8', 200, 300],
    // TODO: Once const enum inlining support is added to bun, reduce maxBytes.
    //  ↳ https://github.com/oven-sh/bun/issues/2945
    ['reader.js', 'text/javascript;charset=utf-8', 8000, 14_000],
  ];

  for (const [filename, type, minBytes, maxBytes] of distFiles) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    describe(filename, () => {
      const file = Bun.file(`dist/${filename}`);

      test('exists with correct type', () => {
        expect.assertions(3);
        expect(file.exists()).resolves.toBeTruthy();
        expect(file.size).toBeGreaterThan(0);
        expect(file.type).toBe(type); // TODO: Keep this? Type seems to be resolved from the file extension, not the file data.
      });

      if (minBytes != null && maxBytes != null) {
        test('is within expected file size limits', () => {
          expect.assertions(2);
          expect(file.size).toBeGreaterThan(minBytes);
          expect(file.size).toBeLessThan(maxBytes);
        });
      }
    });
  }

  test('contains no extra files', async () => {
    expect.assertions(1);
    const distDir = await readdir('dist');
    expect(distDir).toHaveLength(distFiles.length);
  });
});
